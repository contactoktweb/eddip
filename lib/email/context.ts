import { mergeSiteSettings, SITE_SETTINGS_KEY } from '@/lib/siteSettings';
import { readSiteContent, writeSiteContent } from '@/lib/supabase/server';

const NOTIFICATION_LOG_KEY = 'notification_log';
const NOTIFICATION_LOG_LIMIT = 500;

/** Sitio de respaldo en Vercel, siempre disponible aunque el dominio principal apunte a otro hosting. */
const FALLBACK_SITE_URL = 'https://eddip.vercel.app';
const KNOWN_SITE_ORIGINS = ['https://www.eddip.com.co', 'https://eddip.com.co', FALLBACK_SITE_URL];

const toOrigin = (value?: string) => {
  try {
    return value ? new URL(value.trim()).origin : '';
  } catch {
    return '';
  }
};

/** Dominios desde los que se aceptan enlaces en los correos (evita enlaces hacia hosts no autorizados). */
function allowedSiteOrigins(): Set<string> {
  const extra = (process.env.SITE_URL_ALLOWLIST || '').split(',');
  return new Set([...KNOWN_SITE_ORIGINS, process.env.NEXT_PUBLIC_SITE_URL, ...extra].map(toOrigin).filter(Boolean));
}

/**
 * URL pública para enlaces e imágenes de los correos. Se usa el dominio desde el que la persona hizo
 * la solicitud (principal o respaldo) si está autorizado; sin petición (webhook de Bold) se usa
 * NEXT_PUBLIC_SITE_URL o, si no existe, el sitio de respaldo.
 */
export function resolveSiteUrl(request?: Request): string {
  const requestOrigin = request ? toOrigin(request.url) : '';
  if (requestOrigin && allowedSiteOrigins().has(requestOrigin)) return requestOrigin;
  return toOrigin(process.env.NEXT_PUBLIC_SITE_URL) || FALLBACK_SITE_URL;
}

export async function getEmailContext(request?: Request) {
  return {
    siteUrl: resolveSiteUrl(request),
    settings: mergeSiteSettings(await readSiteContent(SITE_SETTINGS_KEY)),
  };
}

export type EmailContext = Awaited<ReturnType<typeof getEmailContext>>;

/** Evita enviar dos veces la misma notificación (por ejemplo, al recargar la página de confirmación). */
export async function wasNotificationSent(id: string): Promise<boolean> {
  const log = await readSiteContent<string[]>(NOTIFICATION_LOG_KEY);
  return Array.isArray(log) && log.includes(id);
}

export async function markNotificationSent(id: string): Promise<void> {
  const log = await readSiteContent<string[]>(NOTIFICATION_LOG_KEY);
  const next = [id, ...(Array.isArray(log) ? log.filter(entry => entry !== id) : [])].slice(0, NOTIFICATION_LOG_LIMIT);
  await writeSiteContent(NOTIFICATION_LOG_KEY, next);
}
