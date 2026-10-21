import { supabase } from './client';
import {
  COURSE_CATEGORIES_EVENT,
  COURSE_CATEGORIES_KEY,
  SITE_SETTINGS_EVENT,
  SITE_SETTINGS_KEY,
  defaultCourseCategories,
  mergeSiteSettings,
  type SiteSettings,
} from '@/lib/siteSettings';
import {
  LEGAL_DOCUMENT_EVENT,
  mergeLegalDocument,
  type LegalDocument,
  type LegalDocumentKey,
} from '@/lib/legalDocuments';

type SaveResult = { success: boolean; error?: string };

async function readValue(key: string): Promise<unknown> {
  const { data, error } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

async function writeValue(key: string, value: unknown, eventName: string): Promise<SaveResult> {
  try {
    const { error } = await supabase
      .from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return { success: false, error: error.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión con la base de datos.' };
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { key, value } }));
  }
  return { success: true };
}

function normalizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return defaultCourseCategories;
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const clean = item.trim();
    const id = clean.toLowerCase();
    if (clean && !seen.has(id)) {
      seen.add(id);
      list.push(clean);
    }
  }
  return list;
}

export const settingsService = {
  async getSiteSettings(): Promise<SiteSettings> {
    try {
      return mergeSiteSettings(await readValue(SITE_SETTINGS_KEY));
    } catch {
      return mergeSiteSettings(null);
    }
  },

  saveSiteSettings(settings: SiteSettings): Promise<SaveResult> {
    return writeValue(SITE_SETTINGS_KEY, settings, SITE_SETTINGS_EVENT);
  },

  async getCourseCategories(): Promise<string[]> {
    try {
      const value = await readValue(COURSE_CATEGORIES_KEY);
      return value === null ? defaultCourseCategories : normalizeCategories(value);
    } catch {
      return defaultCourseCategories;
    }
  },

  saveCourseCategories(categories: string[]): Promise<SaveResult> {
    return writeValue(COURSE_CATEGORIES_KEY, normalizeCategories(categories), COURSE_CATEGORIES_EVENT);
  },

  async getLegalDocument(key: LegalDocumentKey): Promise<LegalDocument> {
    try {
      return mergeLegalDocument(key, await readValue(key));
    } catch {
      return mergeLegalDocument(key, null);
    }
  },

  saveLegalDocument(key: LegalDocumentKey, document: LegalDocument): Promise<SaveResult> {
    return writeValue(key, document, LEGAL_DOCUMENT_EVENT);
  },
};
