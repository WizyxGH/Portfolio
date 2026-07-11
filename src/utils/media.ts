const mediaFiles = import.meta.glob('/src/assets/media/projects/**/*.{webp,webm,mp4,svg,png,jpg,jpeg,pdf}', { query: '?url', eager: true, import: 'default' }) as Record<string, string>;

/**
 * Résout un chemin d'image du frontmatter vers son URL finale (bundle Vite).
 * ex: "../../assets/media/projects/jobbrr.webp" -> "/_astro/jobbrr.hash.webp"
 */
export function getMediaUrl(imagePath: string | undefined | null): string | null {
    if (!imagePath) return null;
    
    let normalizedPath = imagePath;
    
    // Chemin relatif (depuis src/content/projects)
    if (normalizedPath.startsWith('../../assets/')) {
        normalizedPath = normalizedPath.replace('../../assets/', '/src/assets/');
    } 
    // Chemin absolu (anciennement depuis public/)
    else if (normalizedPath.startsWith('/assets/')) {
        normalizedPath = `/src${normalizedPath}`;
    }

    if (mediaFiles[normalizedPath]) {
        return mediaFiles[normalizedPath];
    }
    
    // Fallback URL externe ou non trouvée
    return imagePath;
}

/**
 * Récupère toutes les images d'un sous-dossier de résultats dynamique.
 */
export function getResultImages(projectTitle: string): string[] {
    const searchStr = `/src/assets/media/projects/results/${projectTitle}/`;
    return Object.keys(mediaFiles)
        .filter(path => path.includes(searchStr) || path.includes(`/${projectTitle.replace(/ /g, '%20')}/`))
        .map(path => mediaFiles[path]);
}
