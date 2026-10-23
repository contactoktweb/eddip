import { mergeSiteSettings, SITE_SETTINGS_KEY } from '@/lib/siteSettings';
import { readSiteContent, writeSiteContent } from '@/lib/supabase/server';

const NOTIFICATION_LOG_KEY = 'notification_log';
const NOTIFICATION_LOG_LIMIT = 500;

const DEFAULT_SITE_URL = 'https://www.eddip.com.co';

/** URL pública del sitio para enlaces e imágenes de los correos (sin petición, p. ej. el webhook de Bold). */
export function resolveSiteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return request ? new URL(request.url).origin : DEFAULT_SITE_URL;
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
