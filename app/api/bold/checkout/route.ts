import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { requireSession } from '@/lib/auth/session';
import { findCourseRecord } from '@/lib/courses/serverCourse';
import { BOLD_CURRENCY, createBoldPaymentLink, integritySignature, readBoldCredentials } from '@/lib/payments/bold';
import { normalizeCouponCode, quoteCoursePrice } from '@/lib/payments/pricing';
import { fulfillApprovedOrder, generateOrderId, saleIdForOrder, type PaymentOrder } from '@/lib/payments/orders';

/**
 * Crea la orden de pago de la persona autenticada. El monto se calcula aquí con el precio del curso
 * guardado en el servidor; el navegador solo indica el curso y el cupón de beca.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const { admin, user } = auth.session;
  const course = await findCourseRecord(admin, readText(body, 'courseSlug', 120));
  if (!course) return NextResponse.json({ error: 'El curso seleccionado no existe.' }, { status: 404 });

  const couponCode = normalizeCouponCode(readText(body, 'couponCode', 40));
  const { total } = quoteCoursePrice(course.price, couponCode);
  const orderId = generateOrderId();
  const description = `Matrícula Académica — ${course.title}`;

  const baseOrder = {
    order_id: orderId,
    student_id: user.id,
    course_slug: course.slug,
    course_title: course.title,
    amount: total,
    currency: BOLD_CURRENCY,
    coupon_code: couponCode || null,
  };

  // Programas sin costo: no pasan por la pasarela y se matriculan de inmediato
  if (total === 0) {
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from('payment_orders')
      .insert({ ...baseOrder, provider: 'Sin costo', status: 'approved', approved_at: now })
      .select('*')
      .single();
    if (error || !data) {
      console.error('No fue posible registrar la orden sin costo:', error?.message);
      return NextResponse.json({ error: 'No fue posible registrar la matrícula. Inténtalo nuevamente.' }, { status: 500 });
    }
    const result = await fulfillApprovedOrder(admin, data as PaymentOrder, request);
    if (!result.ok) return NextResponse.json({ error: 'No fue posible registrar la matrícula. Inténtalo nuevamente.' }, { status: 500 });
    return NextResponse.json({ success: true, free: true, orderId, saleId: result.saleId });
  }

  const credentials = readBoldCredentials();
  if (!credentials) {
    console.error('BOLD_IDENTITY_KEY y BOLD_SECRET_KEY deben estar configuradas en .env.local.');
    return NextResponse.json({ error: 'La pasarela de pagos no está disponible en este momento.' }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const redirectionUrl = `${origin}/checkout/${course.slug}?bold_order=${orderId}`;
  const paymentLink = await createBoldPaymentLink({
    identityKey: credentials.identityKey,
    orderId,
    amount: total,
    description,
    redirectionUrl,
    payerEmail: user.email || undefined,
    payerName: String(user.user_metadata?.full_name || ''),
  });

  const { error } = await admin
    .from('payment_orders')
    .insert({ ...baseOrder, provider: 'Bold', payment_link_id: paymentLink?.linkId || null });
  if (error) {
    console.error('No fue posible registrar la orden de pago:', error.message);
    return NextResponse.json({ error: 'No se pudo generar la sesión de pago con Bold.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orderId,
    saleId: saleIdForOrder(orderId),
    amount: total,
    currency: BOLD_CURRENCY,
    apiKey: credentials.identityKey,
    integritySignature: integritySignature(orderId, total, credentials.secretKey),
    description,
    redirectionUrl,
    paymentUrl: paymentLink?.url || null,
  });
}
