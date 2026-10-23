import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { requireSession } from '@/lib/auth/session';
import { fetchBoldVoucher, readBoldCredentials } from '@/lib/payments/bold';
import {
  approveOrder,
  fulfillApprovedOrder,
  isValidOrderId,
  updateOrderStatus,
  type PaymentOrder,
} from '@/lib/payments/orders';

const ORDERS_LIMIT = 50;

type OrderRow = PaymentOrder & { created_at: string };

/** Pagos en línea recientes (todas las órdenes de Bold con su estado). Solo administradores. */
export async function GET(request: Request) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;
  const { admin } = auth.session;

  const { data } = await admin
    .from('payment_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(ORDERS_LIMIT);
  const orders = (data as OrderRow[] | null) || [];

  const ids = [...new Set(orders.map(o => o.student_id))];
  const { data: profiles } = ids.length
    ? await admin.from('profiles').select('id, email, full_name').in('id', ids)
    : { data: [] };
  const byId = new Map((profiles || []).map(p => [p.id as string, p]));

  return NextResponse.json(
    {
      orders: orders.map(o => ({
        orderId: o.order_id,
        courseTitle: o.course_title,
        amount: o.amount,
        status: o.status,
        createdAt: o.created_at,
        fulfilled: Boolean(o.fulfilled_at),
        studentName: (byId.get(o.student_id)?.full_name as string | undefined) || '',
        studentEmail: (byId.get(o.student_id)?.email as string | undefined) || '',
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/** Verifica una orden con Bold y, si el pago está aprobado, matricula y registra la venta. */
export async function POST(request: Request) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;
  const { admin } = auth.session;

  const body = await readJsonBody(request);
  const orderId = body ? readText(body, 'orderId', 80) : '';
  if (!isValidOrderId(orderId)) return NextResponse.json({ error: 'Referencia no válida.' }, { status: 400 });

  const { data } = await admin.from('payment_orders').select('*').eq('order_id', orderId).maybeSingle();
  let order = data as PaymentOrder | null;
  if (!order) return NextResponse.json({ error: 'No encontramos esta orden.' }, { status: 404 });

  if (order.status === 'pending') {
    const credentials = readBoldCredentials();
    const voucher = credentials ? await fetchBoldVoucher(order.order_id, credentials.identityKey) : null;
    if (!voucher) {
      return NextResponse.json({ status: 'pending', message: 'No fue posible consultar Bold. Inténtalo en unos minutos.' });
    }
    if (voucher.status === 'NO_TRANSACTION_FOUND') {
      return NextResponse.json({ status: 'pending', message: 'Bold no registra ningún pago con esta referencia: la compra no se completó.' });
    }
    if (voucher.status === 'REJECTED' || voucher.status === 'FAILED' || voucher.status === 'VOIDED') {
      await updateOrderStatus(admin, order.order_id, voucher.status === 'VOIDED' ? 'voided' : 'rejected');
      return NextResponse.json({ status: 'rejected', message: 'Bold reporta el pago como rechazado o anulado.' });
    }
    if (voucher.status !== 'APPROVED') {
      return NextResponse.json({ status: 'pending', message: 'Bold aún procesa este pago.' });
    }
    if (Math.round(voucher.total) < order.amount) {
      return NextResponse.json({ status: 'pending', message: 'El valor pagado en Bold no coincide con el de la matrícula.' }, { status: 409 });
    }
    order = await approveOrder(admin, order, { providerPaymentId: voucher.transactionId, paymentMethod: voucher.paymentMethod });
  }

  if (order.status !== 'approved') {
    return NextResponse.json({ status: order.status, message: 'La orden no está aprobada.' });
  }

  const result = await fulfillApprovedOrder(admin, order);
  if (!result.ok) return NextResponse.json({ error: 'El pago está aprobado, pero no se pudo activar la matrícula.' }, { status: 500 });
  return NextResponse.json({ status: 'approved', message: 'Pago aprobado: matrícula activa y comprobante enviado.' });
}
