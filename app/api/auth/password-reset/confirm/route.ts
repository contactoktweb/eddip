import { NextResponse } from 'next/server';
import {
  MIN_PASSWORD_LENGTH,
  consumeResetToken,
  isResetTokenValid,
  updateAccountPassword,
} from '@/lib/auth/passwordReset';
import { requireServiceClient } from '@/lib/auth/session';

type ConfirmBody = { token?: unknown; password?: unknown; validateOnly?: unknown };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ConfirmBody | null;
  const token = typeof body?.token === 'string' ? body.token.trim() : '';

  if (!token) {
    return NextResponse.json({ error: 'El enlace de recuperación no es válido.' }, { status: 400 });
  }

  const service = requireServiceClient();
  if (service.response) return service.response;

  if (body?.validateOnly === true) {
    return NextResponse.json({ valid: await isResetTokenValid(token) });
  }

  const password = typeof body?.password === 'string' ? body.password : '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const email = await consumeResetToken(token);
  if (!email) {
    return NextResponse.json(
      { error: 'El enlace expiró o ya fue utilizado. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".' },
      { status: 410 }
    );
  }

  const updated = await updateAccountPassword(email, password);
  if (!updated) {
    return NextResponse.json({ error: 'No fue posible actualizar la contraseña. Inténtalo nuevamente.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, email });
}
