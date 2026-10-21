import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';

/**
 * Perfil y rol de la sesión actual, leídos en el servidor con el token verificado.
 * Es la fuente de verdad del rol para el navegador y no depende de las políticas RLS del cliente.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { user, role, admin } = auth.session;
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, document_id, phone, city')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json(
    {
      role,
      full_name: profile?.full_name ?? null,
      document_id: profile?.document_id ?? null,
      phone: profile?.phone ?? null,
      city: profile?.city ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
