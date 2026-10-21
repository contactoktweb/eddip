import crypto from 'crypto';

/** Integración de servidor con Bold (botón de pagos, webhook firmado y consulta de transacciones). */

const VOUCHER_API = 'https://payments.api.bold.co/v2/payment-voucher';
const PAYMENT_LINK_ENDPOINTS = [
  'https://api.online.payments.bold.co/v1/payment_links',
  'https://integrations.api.bold.co/online/link/v1',
];
const REQUEST_TIMEOUT_MS = 8000;

export const BOLD_CURRENCY = 'COP';

export type BoldCredentials = { identityKey: string; secretKey: string };

export function readBoldCredentials(): BoldCredentials | null {
  const identityKey = process.env.BOLD_IDENTITY_KEY || process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY || '';
  const secretKey = process.env.BOLD_SECRET_KEY || '';
  return identityKey && secretKey ? { identityKey, secretKey } : null;
}

/** Hash de integridad del botón de pagos: SHA-256 de orderId + monto + moneda + llave secreta. */
export function integritySignature(orderId: string, amount: number, secretKey: string): string {
  return crypto.createHash('sha256').update(`${orderId}${amount}${BOLD_CURRENCY}${secretKey}`, 'utf8').digest('hex');
}

/** Firma del webhook: HMAC-SHA256 (hex) del cuerpo crudo codificado en Base64, con la llave secreta. */
export function isValidWebhookSignature(rawBody: string, signature: string, secretKey: string): boolean {
  if (!signature) return false;
  const encoded = Buffer.from(rawBody, 'utf8').toString('base64');
  const expected = crypto.createHmac('sha256', secretKey).update(encoded).digest('hex');
  const received = signature.trim().toLowerCase();
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
}

export type BoldPaymentStatus =
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED'
  | 'VOIDED'
  | 'PROCESSING'
  | 'PENDING'
  | 'NO_TRANSACTION_FOUND'
  | 'UNKNOWN';

export type BoldVoucher = {
  status: BoldPaymentStatus;
  total: number;
  transactionId: string | null;
  paymentMethod: string | null;
};

const KNOWN_STATUSES: BoldPaymentStatus[] = [
  'APPROVED',
  'REJECTED',
  'FAILED',
  'VOIDED',
  'PROCESSING',
  'PENDING',
  'NO_TRANSACTION_FOUND',
];

/** Consulta el estado de una venta del botón de pagos por su identificador (order-id). */
export async function fetchBoldVoucher(orderId: string, identityKey: string): Promise<BoldVoucher | null> {
  try {
    const res = await fetch(`${VOUCHER_API}/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `x-api-key ${identityKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.status === 404) return { status: 'NO_TRANSACTION_FOUND', total: 0, transactionId: null, paymentMethod: null };
    if (!res.ok) {
      console.error(`Bold respondió ${res.status} al consultar la orden ${orderId}.`);
      return null;
    }
    const json = (await res.json()) as Record<string, unknown>;
    const data = (json.payload && typeof json.payload === 'object' ? json.payload : json) as Record<string, unknown>;
    const rawStatus = String(data.payment_status || '').toUpperCase() as BoldPaymentStatus;
    return {
      status: KNOWN_STATUSES.includes(rawStatus) ? rawStatus : 'UNKNOWN',
      total: Number(data.total) || 0,
      transactionId: typeof data.transaction_id === 'string' ? data.transaction_id : null,
      paymentMethod: typeof data.payment_method === 'string' ? data.payment_method : null,
    };
  } catch (error) {
    console.error('No fue posible consultar la transacción en Bold:', error);
    return null;
  }
}

/** Intenta crear un link de pago oficial; si Bold no lo permite se usa el botón embebido. */
export async function createBoldPaymentLink(params: {
  identityKey: string;
  orderId: string;
  amount: number;
  description: string;
  redirectionUrl: string;
  payerEmail?: string;
  payerName?: string;
}): Promise<{ url: string; linkId: string | null } | null> {
  for (const endpoint of PAYMENT_LINK_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': params.identityKey,
          Authorization: `x-api-key ${params.identityKey}`,
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: BOLD_CURRENCY,
          description: params.description,
          order_id: params.orderId,
          redirection_url: params.redirectionUrl,
          payer_email: params.payerEmail,
          payer_name: params.payerName,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      const data = (json.payload && typeof json.payload === 'object' ? json.payload : json) as Record<string, unknown>;
      const url = data.url;
      const linkId = data.payment_link;
      if (typeof url === 'string' && url) return { url, linkId: typeof linkId === 'string' ? linkId : null };
    } catch {
      // Se intenta con el siguiente endpoint
    }
  }
  return null;
}
