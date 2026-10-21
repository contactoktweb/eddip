import { NextResponse } from 'next/server';
import type { Sale } from '@/lib/types';
import { createServerSupabase, readSiteContent } from '@/lib/supabase/server';
import { isEmailConfigured, sendEmail } from '@/lib/email/resend';
import { adminNotificationEmail, purchaseEmail, welcomeEmail } from '@/lib/email/templates';
import { getEmailContext, markNotificationSent, wasNotificationSent } from '@/lib/email/context';

type RegisteredProfile = { full_name: string | null; document_id: string | null; phone: string | null; city: string | null; created_at: string | null };

async function findRecentProfile(email: string): Promise<RegisteredProfile | null> {
  const supabase = createServerSupabase({ requireServiceRole: true });
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('full_name, document_id, phone, city, created_at')
    .eq('email', email)
    .maybeSingle();
  return (data as RegisteredProfile | null) ?? null;
}

type NotificationRequest =
  | { type: 'welcome'; email: string }
  | { type: 'purchase'; email: string; saleId: string };

const WELCOME_WINDOW_MS = 30 * 60 * 1000;
const PURCHASE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const clean = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

function parseBody(body: unknown): NotificationRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const email = clean(b.email);
  if (!email) return null;
  if (b.type === 'welcome') return { type: 'welcome', email };
  if (b.type === 'purchase' && typeof b.saleId === 'string' && b.saleId.trim()) {
    return { type: 'purchase', email, saleId: b.saleId.trim() };
  }
  return null;
}

/**
 * Envía los correos transaccionales de registro y compra. Solo notifica eventos que ya existen
 * en la base de datos (cuenta recién creada o venta aprobada) y nunca repite el mismo envío.
 */
export async function POST(request: Request) {
  const payload = parseBody(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ sent: false, reason: 'not_configured' }, { status: 202 });
  }

  const ctx = await getEmailContext(request);

  if (payload.type === 'welcome') {
    const notificationId = `welcome:${payload.email}`;
    if (await wasNotificationSent(notificationId)) return NextResponse.json({ sent: false, reason: 'duplicate' });

    const user = await findRecentProfile(payload.email);
    const createdAt = user?.created_at ? new Date(user.created_at).getTime() : 0;
    if (!user || Date.now() - createdAt > WELCOME_WINDOW_MS) {
      return NextResponse.json({ error: 'No hay un registro reciente para este correo.' }, { status: 404 });
    }

    const name = user.full_name || payload.email;
    const result = await sendEmail({ to: payload.email, replyTo: ctx.settings.contactEmail, ...welcomeEmail(ctx, { name }) });
    if (!result.sent) return NextResponse.json({ sent: false, error: result.error }, { status: 502 });

    await markNotificationSent(notificationId);
    await sendEmail({
      to: ctx.settings.adminEmail,
      ...adminNotificationEmail(ctx, {
        title: 'Nuevo estudiante registrado',
        intro: 'Se registró una nueva cuenta de estudiante en la plataforma.',
        rows: [
          ['Nombre', name],
          ['Correo', payload.email],
          ['Documento', user.document_id || 'No registrado'],
          ['Celular', user.phone || 'No registrado'],
          ['Ciudad', user.city || 'No registrada'],
        ],
        actionPath: '/admin/estudiantes',
        actionLabel: 'Ver directorio de estudiantes',
      }),
    });
    return NextResponse.json({ sent: true });
  }

  const notificationId = `purchase:${payload.saleId}`;
  if (await wasNotificationSent(notificationId)) return NextResponse.json({ sent: false, reason: 'duplicate' });

  const sales = (await readSiteContent<Sale[]>('admin_sales_list')) || [];
  const sale = sales.find(s => s.id === payload.saleId);
  const saleTime = sale ? new Date(`${sale.date.slice(0, 10)}T12:00:00`).getTime() : 0;
  if (
    !sale ||
    sale.status !== 'Aprobado' ||
    clean(sale.email) !== payload.email ||
    Date.now() - saleTime > PURCHASE_WINDOW_MS
  ) {
    return NextResponse.json({ error: 'No se encontró una compra aprobada para este correo.' }, { status: 404 });
  }

  const date = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(saleTime));
  const result = await sendEmail({
    to: payload.email,
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
  if (!result.sent) return NextResponse.json({ sent: false, error: result.error }, { status: 502 });

  await markNotificationSent(notificationId);
  await sendEmail({
    to: ctx.settings.adminEmail,
    ...adminNotificationEmail(ctx, {
      title: 'Nueva compra aprobada',
      intro: 'Se aprobó una nueva inscripción pagada en la plataforma.',
      rows: [
        ['Estudiante', sale.student],
        ['Correo', payload.email],
        ['Curso', sale.course],
        ['Valor', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(sale.value)],
        ['Medio de pago', sale.method],
        ['Referencia', sale.id],
      ],
      actionPath: '/admin/ventas',
      actionLabel: 'Ver ventas',
    }),
  });
  return NextResponse.json({ sent: true });
}
