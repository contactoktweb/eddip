import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { MIN_PASSWORD_LENGTH, createAuthAccount, findDuplicateAccount, normalizeEmail } from '@/lib/auth/accounts';
import { requireServiceClient } from '@/lib/auth/session';
import { isValidEmail } from '@/lib/siteSettings';
import { sendWelcomeNotifications } from '@/lib/email/notifications';
import { getEmailContext } from '@/lib/email/context';

const MAX_PASSWORD_LENGTH = 72;

/**
 * Registro público de estudiantes. La cuenta se crea en Supabase Auth con el rol de estudiante;
 * el cliente inicia sesión a continuación con signInWithPassword.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const email = normalizeEmail(readText(body, 'email'));
  const fullName = readText(body, 'fullName');
  const password = typeof body.password === 'string' ? body.password : '';

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Por favor ingresa un correo electrónico válido.' }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: 'Por favor ingresa tu nombre completo.' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const service = requireServiceClient();
  if (service.response) return service.response;

  const documentId = readText(body, 'documentId', 40);
  const duplicate = await findDuplicateAccount(service.admin, email, documentId);
  if (duplicate) return NextResponse.json({ error: duplicate }, { status: 409 });

  const created = await createAuthAccount(service.admin, {
    email,
    password,
    fullName,
    documentId,
    phone: readText(body, 'phone', 40),
    city: readText(body, 'city', 120),
    role: 'student',
  });
  if (created.error) return NextResponse.json({ error: created.error }, { status: created.status });

  // Bienvenida al estudiante y aviso a la administración desde el servidor
  try {
    await sendWelcomeNotifications(email, await getEmailContext(request));
  } catch (err) {
    console.error('No fue posible enviar la bienvenida:', err);
  }

  return NextResponse.json({ success: true });
}
