import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getMediaAsset, getMediaUrl, getResultImages } from '../utils/media';

// Images de marque et de portrait : elles appartiennent au site, pas à un
// projet. Elles restent donc rattachées à l'accueil.
const siteImages = import.meta.glob<{ default: string }>(
  [
    '/src/assets/media/*.{jpeg,jpg,png,webp}',
    '/src/assets/media/{photo,opengraph,brands}/**/*.{jpeg,jpg,png,webp,svg}',
  ],
  { query: '?url', eager: true }
);

// `&` et `<` doivent être échappés : un seul caractère brut rend le sitemap
// illisible pour Google, qui abandonne le fichier sans prévenir.
const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const titleFromPath = (path: string) => path.split('/').pop()?.split('.')[0] || '';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site ? site.toString() : 'https://wizyx.me/';
  const abs = (path: string) => new URL(path, siteUrl).href;

  // Une entrée = une page réelle et les images qu'elle affiche. Auparavant les
  // 222 images étaient toutes rattachées à l'accueil, ce qui empêchait Google
  // d'associer une image à la page où elle apparaît.
  const pages: { loc: string; images: { url: string; title: string }[] }[] = [];

  const seenPerPage = (urls: { url: string; title: string }[]) => {
    const seen = new Set<string>();
    return urls.filter(({ url }) => {
      // Vite inline les petits SVG en data-URI : un sitemap n'accepte que des
      // URL, et ces entrées sont rejetées par Google.
      if (!url || url.startsWith('data:')) return false;
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  };

  // ── Accueil : images de marque, portraits, visuels de partage ────────────
  pages.push({
    loc: siteUrl,
    images: seenPerPage(
      Object.keys(siteImages).map((path) => ({
        url: abs(siteImages[path].default),
        title: titleFromPath(path),
      }))
    ),
  });

  // ── Une entrée par projet, avec sa vignette et sa galerie ────────────────
  const projects = await getCollection('projects');
  for (const project of projects) {
    const data = project.data as any;
    const images: { url: string; title: string }[] = [];

    const cover = getMediaAsset(data.image) ?? null;
    if (cover?.src) images.push({ url: abs(cover.src), title: data.title ?? project.id });
    else if (typeof data.image === 'string') {
      const url = getMediaUrl(data.image);
      if (url) images.push({ url: abs(url), title: data.title ?? project.id });
    }

    for (const item of getResultImages(data.title ?? '')) {
      const src = typeof item === 'string' ? item : item?.src;
      if (src) images.push({ url: abs(src), title: data.title ?? project.id });
    }

    const kept = seenPerPage(images);
    if (kept.length) {
      pages.push({ loc: abs(`/creations/${project.id}`), images: kept });
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const page of pages) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(page.loc)}</loc>\n`;
    for (const image of page.images) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(image.url)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
