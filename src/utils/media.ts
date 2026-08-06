const mediaFiles = import.meta.glob('/src/assets/media/projects/**/*.{webp,webm,mp4,svg,png,jpg,jpeg,pdf}', { query: '?url', eager: true, import: 'default' }) as Record<string, string>;

// Métadonnées des images matricielles, pour les passer à l'optimiseur d'Astro
// (`?url` court-circuite `astro:assets` et sert les originaux tels quels).
const mediaAssets = import.meta.glob('/src/assets/media/projects/**/*.{webp,png,jpg,jpeg}', { eager: true, import: 'default' }) as Record<string, ImageMetadata>;

/**
 * Normalise un chemin du frontmatter vers une clé de glob Vite.
 */
function normalizePath(imagePath: string): string {
    // Chemin relatif (depuis src/content/projects)
    if (imagePath.startsWith('../../assets/')) {
        return imagePath.replace('../../assets/', '/src/assets/');
    }
    // Chemin absolu (anciennement depuis public/)
    if (imagePath.startsWith('/assets/')) {
        return `/src${imagePath}`;
    }
    return imagePath;
}

/**
 * Résout un chemin d'image du frontmatter vers son URL finale (bundle Vite).
 * ex: "../../assets/media/projects/jobbrr.webp" -> "/_astro/jobbrr.hash.webp"
 */
export function getMediaUrl(imagePath: string | undefined | null): string | null {
    if (!imagePath) return null;

    const normalizedPath = normalizePath(imagePath);

    if (mediaFiles[normalizedPath]) {
        return mediaFiles[normalizedPath];
    }

    // Fallback URL externe ou non trouvée
    return imagePath;
}

/**
 * Résout un média vers son ImageMetadata quand c'est une image optimisable.
 * Retourne null pour les vidéos, PDF, SVG et URLs externes.
 */
export function getMediaAsset(img: unknown): ImageMetadata | null {
    if (!img) return null;

    // Déjà une ImageMetadata (import direct)
    if (typeof img === 'object' && 'src' in (img as any) && 'width' in (img as any)) {
        return img as ImageMetadata;
    }

    if (typeof img !== 'string') return null;

    return mediaAssets[normalizePath(img)] ?? null;
}

/**
 * Récupère toutes les images d'un sous-dossier de résultats dynamique.
 * Renvoie l'ImageMetadata quand l'optimisation est possible, sinon l'URL.
 */
export function getResultImages(projectTitle: string): (ImageMetadata | string)[] {
    const searchStr = `/src/assets/media/projects/results/${projectTitle}/`;
    return Object.keys(mediaFiles)
        .filter(path => path.includes(searchStr) || path.includes(`/${projectTitle.replace(/ /g, '%20')}/`))
        .map(path => mediaAssets[path] ?? mediaFiles[path]);
}
