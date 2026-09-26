import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseSlug, courseTitle, amount, customer } = body;

    const apiKey =
      process.env.BOLD_IDENTITY_KEY ||
      process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY ||
      '7OkEZv2inQ-n10gIYdX_mEzjRGccyySgkpL4F7U_49k';

    const secretKey =
      process.env.BOLD_SECRET_KEY || 'TmbpZK-m32Y4_0A6a7czMA';

    const numericAmount = Math.max(0, Math.round(Number(amount) || 0));
    const orderId = `EDDIP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currency = 'COP';

    // Generar hash de integridad SHA-256 según documentación de Bold:
    // Cadena: orderId + amount + currency + secretKey
    const rawSignature = `${orderId}${numericAmount}${currency}${secretKey}`;
    const integritySignature = crypto
      .createHash('sha256')
      .update(rawSignature, 'utf8')
      .digest('hex');

    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const redirectionUrl = `${origin}/checkout/${courseSlug}?bold_order=${orderId}&bold_status=approved`;

    let paymentUrl: string | null = null;

    // Intentar generar link de pago oficial mediante la API de Bold
    try {
      const endpoints = [
        'https://api.online.payments.bold.co/v1/payment_links',
        'https://integrations.api.bold.co/online/link/v1',
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              Authorization: `x-api-key ${apiKey}`,
            },
            body: JSON.stringify({
              amount: numericAmount,
              currency: 'COP',
              description: `Matrícula EDDIP — ${courseTitle || 'Curso Especializado'}`,
              order_id: orderId,
              redirection_url: redirectionUrl,
              payer_email: customer?.email,
              payer_name: customer?.name,
              payer_phone: customer?.phone,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            paymentUrl = data.payload?.url || data.url || data.payment_link || null;
            if (paymentUrl) break;
          }
        } catch {
          // continuar con siguiente endpoint
        }
      }
    } catch {
      // Fallback a checkout modal embebido con boldPaymentButton.js
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: numericAmount,
      currency,
      apiKey,
      integritySignature,
      description: `Matrícula Académica — ${courseTitle || 'Curso EDDIP'}`,
      redirectionUrl,
      paymentUrl,
    });
  } catch (error) {
    console.error('Error generando orden de pago Bold:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo generar la sesión de pago con Bold.' },
      { status: 500 }
    );
  }
}
