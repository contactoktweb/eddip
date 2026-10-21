export type SocialNetworkKey = 'facebook' | 'instagram' | 'tiktok';

export type SiteSettings = {
  /** Número de WhatsApp en formato internacional, solo dígitos (ej. 573145637835). */
  whatsappNumber: string;
  whatsappMessage: string;
  /** Correo visible para clientes y estudiantes. */
  contactEmail: string;
  /** Correo interno que recibe las notificaciones de registros y compras. */
  adminEmail: string;
  socialLinks: Record<SocialNetworkKey, string>;
};

export const SITE_SETTINGS_KEY = 'siteSettings';
export const COURSE_CATEGORIES_KEY = 'courseCategories';
export const SITE_SETTINGS_EVENT = 'eddip_site_settings_updated';
export const COURSE_CATEGORIES_EVENT = 'eddip_course_categories_updated';

export const defaultSiteSettings: SiteSettings = {
  whatsappNumber: '573145637835',
  whatsappMessage: 'Hola, quisiera más información sobre los cursos de EDDIP',
  contactEmail: 'escribenos@eddip.com.co',
  adminEmail: 'admin@eddip.com.co',
  socialLinks: {
    facebook: '',
    instagram: '',
    tiktok: '',
  },
};

export const SOCIAL_NETWORKS: { key: SocialNetworkKey; label: string; icon: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', icon: 'facebook', placeholder: 'https://www.facebook.com/tu-pagina' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: 'https://www.instagram.com/tu-cuenta' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok', placeholder: 'https://www.tiktok.com/@tu-cuenta' },
];

export const defaultCourseCategories: string[] = [
  'Seguridad y Policía',
  'Área Jurídica',
  'Gestión Pública',
  'Desarrollo Profesional',
  'Movilidad y Seguridad Vial',
];

export function normalizeWhatsappNumber(value: string): string {
  return value.replace(/\D/g, '');
}

export function buildWhatsappUrl(settings: Pick<SiteSettings, 'whatsappNumber' | 'whatsappMessage'>): string {
  const number = normalizeWhatsappNumber(settings.whatsappNumber);
  const message = settings.whatsappMessage.trim();
  return message
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${number}`;
}

/** Formatea 573145637835 como +57 314 563 7835 para mostrarlo en pantalla. */
export function formatWhatsappDisplay(value: string): string {
  const digits = normalizeWhatsappNumber(value);
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return digits ? `+${digits}` : '';
}

export function isValidHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Combina un valor guardado (posiblemente parcial o antiguo) con los valores por defecto. */
export function mergeSiteSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== 'object') return defaultSiteSettings;
  const v = value as Partial<SiteSettings>;
  return {
    whatsappNumber: v.whatsappNumber || defaultSiteSettings.whatsappNumber,
    whatsappMessage: v.whatsappMessage ?? defaultSiteSettings.whatsappMessage,
    contactEmail: v.contactEmail || defaultSiteSettings.contactEmail,
    adminEmail: v.adminEmail || defaultSiteSettings.adminEmail,
    socialLinks: {
      ...defaultSiteSettings.socialLinks,
      ...(v.socialLinks || {}),
    },
  };
}
