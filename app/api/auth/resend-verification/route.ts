import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { requireServiceClient } from '@/lib/auth/session';
import { normalizeEmail } from '@/lib/auth/accounts';
import { isEmailConfigured, sendEmail } from '@/lib/email/resend';
import { emailVerificationEmail } from '@/lib/email/templates';
import { getEmailContext, markNotificationSent, wasNotificationSent } from '@/lib/email/context';
import { isValidEmail } from '@/lib/siteSettings';

const PAGE_SIZE = 1000;
const RESEND_WINDOW_MS = 10 * 60 * 1000;

/**
 * Reenvía el correo de verificación a cuentas creadas cuando Supabase exigía confirmar el correo.
 * El enlace es de un solo uso: al abrirlo se confirma el correo y se inicia la sesión.
 * La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body ? readText(body, 'email') : '');

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Ingresa un correo electrónico válido.' }, { status: 400 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'En este momento no podemos enviar correos. Comunícate con soporte por WhatsApp.' },
      { status: 503 }
    );
  }

  const service = requireServiceClient();
  if (service.response) return service.response;

  // Un envío por correo cada 10 minutos para evitar abusos
  const windowId = `verify:${email}:${Math.floor(Date.now() / RESEND_WINDOW_MS)}`;
  if (await wasNotificationSent(windowId)) return NextResponse.json({ success: true });

  let pending: { email?: string; user_metadata?: Record<string, unknown> } | undefined;
  for (let page = 1; ; page++) {
    const { data, error } = await service.admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error || !data) break;
    pending = data.users.find(u => normalizeEmail(u.email || '') === email && !u.email_confirmed_at);
    if (pending || data.users.length < PAGE_SIZE) break;
  }

  if (pending) {
    const ctx = await getEmailContext(request);
    const { data: link, error: linkError } = await service.admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${ctx.siteUrl}/dashboard` },
    });
    if (linkError || !link?.properties?.action_link) {
      console.error('No fue posible generar el enlace de verificación:', linkError?.message);
      return NextResponse.json({ error: 'No fue posible generar el enlace. Inténtalo nuevamente.' }, { status: 500 });
    }

    const name = typeof pending.user_metadata?.full_name === 'string' ? pending.user_metadata.full_name : email;
    const result = await sendEmail({
      to: email,
      replyTo: ctx.settings.contactEmail,
      ...emailVerificationEmail(ctx, { name, verifyUrl: link.properties.action_link }),
    });
    if (!result.sent) {
      return NextResponse.json({ error: 'No fue posible enviar el correo. Inténtalo más tarde.' }, { status: 502 });
    }
    await markNotificationSent(windowId);
  }

  return NextResponse.json({ success: true });
}
