import { supabase } from './client';

export type ApiResult<T = Record<string, unknown>> = { ok: boolean; status: number; data: T & { error?: string } };

/** fetch hacia las rutas del servidor adjuntando el token de la sesión de Supabase. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}

/** Igual que authedFetch, pero devuelve el JSON y nunca lanza por errores de red. */
export async function callApi<T = Record<string, unknown>>(input: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await authedFetch(input, init);
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: 'No fue posible conectar con el servidor. Inténtalo de nuevo.' } as T & { error?: string },
    };
  }
}
