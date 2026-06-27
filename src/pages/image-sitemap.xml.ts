import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  // Find all images in src/assets/media using Vite's import.meta.glob with ?url query to get the public URL.
  const images = import.meta.glob<{ default: string }>('/src/assets/media/**/*.{jpeg,jpg,png,webp,svg}', { query: '?url', eager: true });
  
  const siteUrl = site ? site.toString() : 'https://wizyx.me/';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
  
  // We attach all images to the homepage URL for simplicity, as Google Image Sitemap allows multiple images per page.
  xml += `  <url>\n`;
  xml += `    <loc>${siteUrl}</loc>\n`;

  for (const path in images) {
    // Vite resolves the ?url query to a path like /_astro/photo.hash.webp
    const resolvedPath = images[path].default;
    // Construct absolute URL
    const imgUrl = new URL(resolvedPath, siteUrl).href;
    
    // Use filename as title
    const filename = path.split('/').pop()?.split('.')[0] || '';
    
    xml += `    <image:image>\n`;
    xml += `      <image:loc>${imgUrl}</image:loc>\n`;
    xml += `      <image:title>${filename}</image:title>\n`;
    xml += `    </image:image>\n`;
  }

  xml += `  </url>\n`;
  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
