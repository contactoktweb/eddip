/**
 * Copias de cursos (con imágenes y videos en base64) que versiones anteriores guardaban en el
 * navegador. Los cursos se leen de Supabase, así que estas claves solo ocupan espacio.
 */
const LEGACY_HEAVY_KEYS = [
  'eddip-demo-v2',
  'extra_courses',
  'eddip_admin_extra_courses',
  'eddip_admin_eddip_admin_extra_courses',
  'eddip_site_content',
];

type StorageKind = 'local' | 'session';

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Elimina las copias heredadas de cursos que pueden llenar el almacenamiento del navegador. */
export function clearLegacyStorage(): void {
  const storage = getStorage('local');
  if (!storage) return;
  for (const key of LEGACY_HEAVY_KEYS) {
    try {
      storage.removeItem(key);
    } catch {}
  }
}

/**
 * Guarda en localStorage/sessionStorage sin lanzar nunca: el almacenamiento local es solo una
 * comodidad y no debe interrumpir flujos como el pago. Si no hay espacio, libera las copias
 * heredadas y reintenta una vez.
 */
export function safeSetItem(key: string, value: string, kind: StorageKind = 'local'): boolean {
  const storage = getStorage(kind);
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    clearLegacyStorage();
    try {
      storage.setItem(key, value);
      return true;
    } catch (err) {
      console.warn(`No hay espacio en el navegador para guardar "${key}":`, err);
      return false;
    }
  }
}
