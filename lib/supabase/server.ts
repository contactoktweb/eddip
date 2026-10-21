import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase exclusivo del servidor (route handlers y Server Components).
 * Usa la service role key cuando está configurada (operaciones administrativas como Storage);
 * en caso contrario, opera con la clave pública con los mismos permisos del navegador.
 */
export function createServerSupabase(options: { requireServiceRole?: boolean } = {}): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) return null;
  if (options.requireServiceRole && !serviceRoleKey) return null;

  const key = serviceRoleKey || anonKey;
  if (!key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function readSiteContent<T = unknown>(key: string): Promise<T | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle();
  if (error) {
    console.warn(`No fue posible leer site_content [${key}]:`, error.message);
    return null;
  }
  return (data?.value as T) ?? null;
}

export async function writeSiteContent(key: string, value: unknown): Promise<boolean> {
  const supabase = createServerSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) {
    console.warn(`No fue posible escribir site_content [${key}]:`, error.message);
    return false;
  }
  return true;
}

export async function deleteSiteContent(key: string): Promise<void> {
  const supabase = createServerSupabase();
  if (!supabase) return;
  await supabase.from('site_content').delete().eq('key', key);
}

/** Lee una lista JSON de site_content con un cliente ya autorizado (service role). */
export async function readContentList<T>(client: SupabaseClient, key: string): Promise<T[]> {
  const { data } = await client.from('site_content').select('value').eq('key', key).maybeSingle();
  return Array.isArray(data?.value) ? (data.value as T[]) : [];
}

export async function writeContentValue(client: SupabaseClient, key: string, value: unknown): Promise<boolean> {
  const { error } = await client
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) console.error(`No fue posible guardar ${key}:`, error.message);
  return !error;
}
