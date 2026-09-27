/**
 * Utilidades para detección, parseo y renderizado de videos e imágenes en las lecciones.
 */

/**
 * Extrae el ID de 11 caracteres de cualquier URL de YouTube:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Si ya es un ID de 11 caracteres alfanuméricos directos
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex robusta para cualquier variante de YouTube
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  );

  return match && match[1] ? match[1] : null;
}

/**
 * Obtiene la URL de incrustación segura (embed) de YouTube para iframes.
 */
export function getYouTubeEmbedUrl(urlOrId: string): string | null {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Verifica si una URL corresponde a un video de YouTube.
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return Boolean(extractYouTubeId(url));
}

/**
 * Verifica si una URL o dataURL corresponde a un archivo directo de video (mp4, webm, ogg, blob, data:video).
 */
export function isDirectVideo(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const s = url.trim().toLowerCase();
  return (
    s.startsWith('data:video/') ||
    s.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(s)
  );
}
