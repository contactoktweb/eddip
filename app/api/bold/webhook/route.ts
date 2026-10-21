import { NextResponse } from 'next/server';
import { requireServiceClient } from '@/lib/auth/session';
import { BOLD_CURRENCY, readBoldCredentials, isValidWebhookSignature } from '@/lib/payments/bold';
import {
  approveOrder,
  findOrderByReference,
  fulfillApprovedOrder,
  updateOrderStatus,
  voidSaleForOrder,
} from '@/lib/payments/orders';

type BoldEvent = {
  type?: string;
  subject?: string;
  data?: {
    payment_id?: string;
    payment_method?: string;
    amount?: { total?: number; currency?: string };
    metadata?: { reference?: string | null };
  };
};

/**
 * Notificaciones de Bold. Solo se procesan eventos con firma válida (HMAC con BOLD_SECRET_KEY)
 * cuyo monto coincide con el de la orden registrada en el servidor. Bold reintenta ante
 * cualquier respuesta distinta de 200, por eso los eventos ajenos o repetidos responden 200.
 */
export async function POST(request: Request) {
  const credentials = readBoldCredentials();
  const service = requireServiceClient();
  if (!credentials || service.response) {
    return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get('x-bold-signature') || '', credentials.secretKey)) {
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 401 });
  }

  let event: BoldEvent;
  try {
    event = JSON.parse(rawBody) as BoldEvent;
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const reference = String(event.data?.metadata?.reference || '');
  const order = reference ? await findOrderByReference(service.admin, reference) : null;
  if (!order) return NextResponse.json({ received: true });

  const paymentId = String(event.data?.payment_id || event.subject || '') || null;

  switch (event.type) {
    case 'SALE_APPROVED': {
      const total = Math.round(Number(event.data?.amount?.total) || 0);
      const currency = String(event.data?.amount?.currency || BOLD_CURRENCY).toUpperCase();
      if (total < order.amount || currency !== order.currency) {
        console.error(`Pago de Bold con monto inconsistente para la orden ${order.order_id}: ${total} ${currency}.`);
        return NextResponse.json({ received: true });
      }
      const approved = await approveOrder(service.admin, order, {
        providerPaymentId: paymentId,
        paymentMethod: event.data?.payment_method || null,
      });
      const result = await fulfillApprovedOrder(service.admin, approved);
      // Si la matrícula falla se responde con error para que Bold reintente la notificación
      return result.ok ? NextResponse.json({ received: true }) : NextResponse.json({ error: 'Reintentar.' }, { status: 500 });
    }
    case 'SALE_REJECTED':
      await updateOrderStatus(service.admin, order.order_id, 'rejected');
      return NextResponse.json({ received: true });
    case 'VOID_APPROVED':
      await updateOrderStatus(service.admin, order.order_id, 'voided', false);
      await voidSaleForOrder(service.admin, order.order_id);
      return NextResponse.json({ received: true });
    default:
      return NextResponse.json({ received: true });
  }
}
