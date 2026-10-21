import type { SupabaseClient } from '@supabase/supabase-js';
import { courseBySlug } from '@/lib/data';
import type { Module } from '@/lib/types';

/** Datos del curso con los que el servidor fija precios, horas certificadas y evaluaciones. */
export type CourseRecord = {
  slug: string;
  title: string;
  price: number;
  durationHours: number;
  modules: Module[];
};

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;

export const isValidCourseSlug = (slug: string) => SLUG_PATTERN.test(slug);

function parseModules(value: unknown): Module[] {
  if (Array.isArray(value)) return value as Module[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as Module[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Busca el curso en la base de datos y, si no existe allí, en el catálogo base del proyecto. */
export async function findCourseRecord(admin: SupabaseClient, slug: string): Promise<CourseRecord | null> {
  if (!isValidCourseSlug(slug)) return null;

  const { data } = await admin
    .from('courses')
    .select('slug, title, price, duration_hours, modules')
    .eq('slug', slug)
    .maybeSingle();

  if (data) {
    return {
      slug: String(data.slug),
      title: String(data.title),
      price: Math.max(0, Math.round(Number(data.price) || 0)),
      durationHours: Number(data.duration_hours) || 40,
      modules: parseModules(data.modules),
    };
  }

  const base = courseBySlug(slug);
  return base
    ? { slug: base.slug, title: base.title, price: base.price, durationHours: base.durationHours, modules: base.modules || [] }
    : null;
}
