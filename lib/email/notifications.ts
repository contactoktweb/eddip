import type { Sale } from '@/lib/types';
import { isValidEmail } from '@/lib/siteSettings';
import { createServerSupabase } from '@/lib/supabase/server';
import { isEmailConfigured, sendEmail } from './resend';
import { adminNotificationEmail, purchaseEmail, welcomeEmail } from './templates';
import { getEmailContext, markNotificationSent, wasNotificationSent, type EmailContext } from './context';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

/**
 * Destinatarios de los avisos administrativos: el correo administrativo configurado (admite varios
 * separados por coma) más las cuentas con rol de administrador, para que ningún aviso se pierda.
 */
export async function getAdminRecipients(ctx: EmailContext): Promise<string[]> {
  const recipients = new Set(
    ctx.settings.adminEmail
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(isValidEmail)
  );

  const admin = createServerSupabase({ requireServiceRole: true });
  if (admin) {
    const { data } = await admin.from('profiles').select('email').eq('role', 'admin');
    for (const row of data || []) {
      const email = String(row.email || '').trim().toLowerCase();
      if (isValidEmail(email)) recipients.add(email);
    }
  }
  return [...recipients];
}

export async function notifyAdmins(
  ctx: EmailContext,
  data: Parameters<typeof adminNotificationEmail>[1]
): Promise<void> {
  const recipients = await getAdminRecipients(ctx);
  if (recipients.length === 0) return;
  const result = await sendEmail({ to: recipients, ...adminNotificationEmail(ctx, data) });
  if (!result.sent) console.error('No fue posible enviar el aviso administrativo:', result.error);
}

/**
 * Comprobante de compra para el estudiante y aviso a la administración. Es idempotente por venta,
 * así que puede llamarse desde el webhook, la confirmación del navegador o el registro manual.
 */
export async function sendPurchaseNotifications(sale: Sale, ctxInput?: EmailContext): Promise<void> {
  if (!isEmailConfigured() || sale.status !== 'Aprobado') return;
  const notificationId = `purchase:${sale.id}`;
  if (await wasNotificationSent(notificationId)) return;

  const ctx = ctxInput ?? (await getEmailContext());
  const date = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(`${sale.date.slice(0, 10)}T12:00:00`)
  );

  if (sale.email && isValidEmail(sale.email)) {
    const result = await sendEmail({
      to: sale.email,
      replyTo: ctx.settings.contactEmail,
      ...purchaseEmail(ctx, {
        name: sale.student,
        courseTitle: sale.course,
        courseSlug: sale.courseSlug,
        value: sale.value,
        method: sale.method,
        saleId: sale.id,
        date,
      }),
    });
    if (!result.sent) {
      console.error(`No fue posible enviar el comprobante de la venta ${sale.id}:`, result.error);
      return;
    }
  }

  await markNotificationSent(notificationId);
  await notifyAdmins(ctx, {
    title: 'Nueva compra aprobada',
    intro: 'Se aprobó una nueva inscripción en la plataforma.',
    rows: [
      ['Estudiante', sale.student],
      ['Correo', sale.email || 'No registrado'],
      ['Curso', sale.course],
      ['Valor', formatMoney(sale.value)],
      ['Medio de pago', sale.method],
      ['Referencia', sale.id],
      ['Fecha', date],
    ],
    actionPath: '/admin/ventas',
    actionLabel: 'Ver ventas',
  });
}

type WelcomeProfile = { full_name: string | null; document_id: string | null; phone: string | null; city: string | null };

/** Bienvenida al estudiante y aviso de nuevo registro a la administración (una sola vez por correo). */
export async function sendWelcomeNotifications(email: string, ctxInput?: EmailContext): Promise<{ sent: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isEmailConfigured() || !isValidEmail(cleanEmail)) return { sent: false, error: 'not_configured' };
  const notificationId = `welcome:${cleanEmail}`;
  if (await wasNotificationSent(notificationId)) return { sent: false, error: 'duplicate' };

  const admin = createServerSupabase({ requireServiceRole: true });
  const { data } = admin
    ? await admin.from('profiles').select('full_name, document_id, phone, city').eq('email', cleanEmail).maybeSingle()
    : { data: null };
  const profile = (data as WelcomeProfile | null) ?? null;
  const name = profile?.full_name || cleanEmail;

  const ctx = ctxInput ?? (await getEmailContext());
  const result = await sendEmail({ to: cleanEmail, replyTo: ctx.settings.contactEmail, ...welcomeEmail(ctx, { name }) });
  if (!result.sent) return { sent: false, error: result.error };

  await markNotificationSent(notificationId);
  await notifyAdmins(ctx, {
    title: 'Nuevo estudiante registrado',
    intro: 'Se registró una nueva cuenta de estudiante en la plataforma.',
    rows: [
      ['Nombre', name],
      ['Correo', cleanEmail],
      ['Documento', profile?.document_id || 'No registrado'],
      ['Celular', profile?.phone || 'No registrado'],
      ['Ciudad', profile?.city || 'No registrada'],
    ],
    actionPath: '/admin/estudiantes',
    actionLabel: 'Ver directorio de estudiantes',
  });
  return { sent: true };
}
