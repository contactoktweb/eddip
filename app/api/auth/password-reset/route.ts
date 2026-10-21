import { NextResponse } from 'next/server';
import { isEmailConfigured, sendEmail } from '@/lib/email/resend';
import { passwordResetEmail } from '@/lib/email/templates';
import { getEmailContext } from '@/lib/email/context';
import { RESET_TOKEN_TTL_MINUTES, createResetToken, findAccountHolder } from '@/lib/auth/passwordReset';
import { isValidEmail } from '@/lib/siteSettings';

/**
 * Solicitud de recuperación de contraseña. La respuesta es la misma exista o no la cuenta,
 * para no revelar qué correos están registrados.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Ingresa un correo electrónico válido.' }, { status: 400 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'En este momento no podemos enviar correos de recuperación. Comunícate con soporte por WhatsApp.' },
      { status: 503 }
    );
  }

  const holder = await findAccountHolder(email);
  if (holder) {
    const token = await createResetToken(email);
    if (!token) {
      return NextResponse.json({ error: 'No fue posible generar el enlace. Inténtalo nuevamente.' }, { status: 500 });
    }

    const ctx = await getEmailContext(request);
    const resetUrl = `${ctx.siteUrl}/login?mode=new-password&token=${encodeURIComponent(token)}`;
    const result = await sendEmail({
      to: email,
      replyTo: ctx.settings.contactEmail,
      ...passwordResetEmail(ctx, { name: holder.name, resetUrl, expiresInMinutes: RESET_TOKEN_TTL_MINUTES }),
    });
    if (!result.sent) {
      return NextResponse.json({ error: 'No fue posible enviar el correo. Inténtalo más tarde.' }, { status: 502 });
    }
  }

  return NextResponse.json({ success: true });
}
