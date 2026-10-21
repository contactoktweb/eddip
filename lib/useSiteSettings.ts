'use client';
import { useEffect, useState } from 'react';
import { settingsService } from '@/lib/supabase/settingsService';
import {
  COURSE_CATEGORIES_EVENT,
  SITE_SETTINGS_EVENT,
  defaultCourseCategories,
  defaultSiteSettings,
  mergeSiteSettings,
  type SiteSettings,
} from '@/lib/siteSettings';

// Una sola consulta por carga de página aunque varios componentes usen el hook
let settingsRequest: Promise<SiteSettings> | null = null;
let categoriesRequest: Promise<string[]> | null = null;

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    let mounted = true;
    settingsRequest ??= settingsService.getSiteSettings();
    settingsRequest.then(value => {
      if (mounted) setSettings(value);
    });

    const handleUpdate = (e: Event) => {
      const value = mergeSiteSettings((e as CustomEvent<{ value: unknown }>).detail?.value);
      settingsRequest = Promise.resolve(value);
      setSettings(value);
    };

    window.addEventListener(SITE_SETTINGS_EVENT, handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener(SITE_SETTINGS_EVENT, handleUpdate);
    };
  }, []);

  return settings;
}

export function useCourseCategories(): { categories: string[]; loading: boolean } {
  const [categories, setCategories] = useState<string[]>(defaultCourseCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    categoriesRequest ??= settingsService.getCourseCategories();
    categoriesRequest.then(value => {
      if (!mounted) return;
      setCategories(value);
      setLoading(false);
    });

    const handleUpdate = (e: Event) => {
      const value = (e as CustomEvent<{ value: unknown }>).detail?.value;
      if (Array.isArray(value)) {
        categoriesRequest = Promise.resolve(value as string[]);
        setCategories(value as string[]);
      }
    };

    window.addEventListener(COURSE_CATEGORIES_EVENT, handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener(COURSE_CATEGORIES_EVENT, handleUpdate);
    };
  }, []);

  return { categories, loading };
}
