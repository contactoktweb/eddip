import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import { normalizeRole, type AppRole } from '@/lib/auth/roles';

export type RequestSession = { user: User; role: AppRole; admin: SupabaseClient };

type SessionResult = { session: RequestSession; response?: never } | { session?: never; response: NextResponse };

const SERVICE_UNAVAILABLE = 'Esta operación no está disponible en este momento. Inténtalo más tarde.';

function readBearerToken(request: Request): string {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

/**
 * Verifica el token de Supabase enviado por el navegador y obtiene el rol desde public.profiles.
 * Nunca confía en roles enviados por el cliente ni en user_metadata (editable por el propio usuario).
 */
export async function requireSession(request: Request, allowedRoles?: AppRole[]): Promise<SessionResult> {
  const admin = createServerSupabase({ requireServiceRole: true });
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY no está configurada: no es posible verificar sesiones en el servidor.');
    return { response: NextResponse.json({ error: SERVICE_UNAVAILABLE }, { status: 503 }) };
  }

  const token = readBearerToken(request);
  if (!token) {
    return { response: NextResponse.json({ error: 'Debes iniciar sesión para continuar.' }, { status: 401 }) };
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' }, { status: 401 }) };
  }

  const { data: profile } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  const role = normalizeRole(profile?.role);

  if (allowedRoles && !allowedRoles.includes(role)) {
    return { response: NextResponse.json({ error: 'No tienes permisos para realizar esta acción.' }, { status: 403 }) };
  }

  return { session: { user: data.user, role, admin } };
}

/** Cliente con service role para rutas públicas que necesitan privilegios (registro, recuperación). */
export function requireServiceClient(): { admin: SupabaseClient; response?: never } | { admin?: never; response: NextResponse } {
  const admin = createServerSupabase({ requireServiceRole: true });
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY no está configurada.');
    return { response: NextResponse.json({ error: SERVICE_UNAVAILABLE }, { status: 503 }) };
  }
  return { admin };
}
