import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { MIN_PASSWORD_LENGTH, createAuthAccount, findDuplicateAccount, normalizeEmail } from '@/lib/auth/accounts';
import { isAppRole } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { isValidEmail } from '@/lib/siteSettings';

/** Alta de usuarios institucionales con rol asignado (solo administradores). */
export async function POST(request: Request) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const email = normalizeEmail(readText(body, 'email'));
  const fullName = readText(body, 'fullName');
  const password = typeof body.password === 'string' ? body.password : '';
  const role = body.role;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Por favor ingresa un correo electrónico válido.' }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: 'Por favor ingresa el nombre completo del usuario.' }, { status: 400 });
  }
  if (!isAppRole(role)) {
    return NextResponse.json({ error: 'El rol seleccionado no es válido.' }, { status: 400 });
  }
  if (password && password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const documentId = readText(body, 'documentId', 40);
  const duplicate = await findDuplicateAccount(auth.session.admin, email, documentId);
  if (duplicate) return NextResponse.json({ error: duplicate }, { status: 409 });

  const created = await createAuthAccount(auth.session.admin, {
    email,
    fullName,
    documentId,
    phone: readText(body, 'phone', 40),
    city: readText(body, 'city', 120),
    password: password || undefined,
    role,
  });
  if (created.error) return NextResponse.json({ error: created.error }, { status: created.status });

  return NextResponse.json({ success: true, id: created.userId });
}
