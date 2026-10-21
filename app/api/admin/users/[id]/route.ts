import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readJsonBody } from '@/lib/api/body';
import { isAppRole } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function countAdmins(admin: SupabaseClient): Promise<number> {
  const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
  return count ?? 0;
}

async function readTargetRole(admin: SupabaseClient, id: string): Promise<string | null> {
  const { data } = await admin.from('profiles').select('role').eq('id', id).maybeSingle();
  return (data?.role as string | undefined) ?? null;
}

/** Cambio de rol (solo administradores). Impide dejar la plataforma sin administradores. */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'La cuenta indicada no tiene acceso a la plataforma.' }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const role = body?.role;
  if (!isAppRole(role)) {
    return NextResponse.json({ error: 'El rol seleccionado no es válido.' }, { status: 400 });
  }

  const { admin } = auth.session;
  const currentRole = await readTargetRole(admin, id);
  if (!currentRole) {
    return NextResponse.json({ error: 'Usuario no encontrado en el sistema.' }, { status: 404 });
  }
  if (currentRole === 'admin' && role !== 'admin' && (await countAdmins(admin)) <= 1) {
    return NextResponse.json({ error: 'Debe existir al menos un administrador en la plataforma.' }, { status: 409 });
  }

  const { error } = await admin.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) {
    console.error('No fue posible actualizar el rol:', error.message);
    return NextResponse.json({ error: 'No fue posible actualizar el rol.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** Eliminación de la cuenta de acceso en Supabase Auth (el perfil se elimina en cascada). */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ success: true, deleted: false });
  }
  if (id === auth.session.user.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 409 });
  }

  const { admin } = auth.session;
  if ((await readTargetRole(admin, id)) === 'admin' && (await countAdmins(admin)) <= 1) {
    return NextResponse.json({ error: 'Debe existir al menos un administrador en la plataforma.' }, { status: 409 });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error && !/not found/i.test(error.message)) {
    console.error('No fue posible eliminar la cuenta:', error.message);
    return NextResponse.json({ error: 'No fue posible eliminar la cuenta.' }, { status: 500 });
  }
  await admin.from('profiles').delete().eq('id', id);

  return NextResponse.json({ success: true, deleted: true });
}
