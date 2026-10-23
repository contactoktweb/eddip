import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { requireSession } from '@/lib/auth/session';
import { fetchBoldVoucher, readBoldCredentials } from '@/lib/payments/bold';
import {
  approveOrder,
  findStudentOrder,
  fulfillApprovedOrder,
  isValidOrderId,
  updateOrderStatus,
} from '@/lib/payments/orders';

const PENDING_MESSAGE = 'Bold aún no confirma tu pago. Si ya pagaste, espera unos minutos y vuelve a verificar.';
const FAILED_MESSAGE = 'Bold no aprobó este pago. Puedes intentarlo nuevamente con otro medio de pago.';

/**
 * Confirma la matrícula de una orden de la persona autenticada. Solo se matricula si el pago
 * figura aprobado: por el webhook firmado de Bold o por la consulta directa a la API de Bold.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  const orderId = body ? readText(body, 'orderId', 80) : '';
  if (!isValidOrderId(orderId)) {
    return NextResponse.json({ error: 'La referencia de pago no es válida.' }, { status: 400 });
  }

  const { admin, user } = auth.session;
  let order = await findStudentOrder(admin, orderId, user.id);
  if (!order) return NextResponse.json({ error: 'No encontramos esta orden de pago en tu cuenta.' }, { status: 404 });

  if (order.status === 'rejected' || order.status === 'voided') {
    return NextResponse.json({ status: order.status, error: FAILED_MESSAGE }, { status: 402 });
  }

  if (order.status === 'pending') {
    const credentials = readBoldCredentials();
    const voucher = credentials ? await fetchBoldVoucher(order.order_id, credentials.identityKey) : null;
    if (!voucher) return NextResponse.json({ status: 'pending', error: PENDING_MESSAGE }, { status: 202 });

    if (voucher.status === 'REJECTED' || voucher.status === 'FAILED' || voucher.status === 'VOIDED') {
      await updateOrderStatus(admin, order.order_id, voucher.status === 'VOIDED' ? 'voided' : 'rejected');
      return NextResponse.json({ status: 'rejected', error: FAILED_MESSAGE }, { status: 402 });
    }
    if (voucher.status !== 'APPROVED') {
      return NextResponse.json({ status: 'pending', error: PENDING_MESSAGE }, { status: 202 });
    }
    if (Math.round(voucher.total) < order.amount) {
      console.error(`Bold reporta un monto menor al de la orden ${order.order_id}: ${voucher.total}.`);
      return NextResponse.json({ error: 'El valor pagado no coincide con el de la matrícula. Contáctanos para revisarlo.' }, { status: 409 });
    }
    order = await approveOrder(admin, order, { providerPaymentId: voucher.transactionId, paymentMethod: voucher.paymentMethod });
  }

  const result = await fulfillApprovedOrder(admin, order, request);
  if (!result.ok) {
    return NextResponse.json({ error: 'Tu pago fue aprobado, pero no pudimos activar la matrícula. Inténtalo nuevamente.' }, { status: 500 });
  }
  return NextResponse.json({ success: true, status: 'approved', saleId: result.saleId, courseSlug: order.course_slug });
}
