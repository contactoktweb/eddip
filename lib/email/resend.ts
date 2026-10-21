const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SENDER_DISPLAY_NAME = 'NOTIFICACIONES EDDIP';

/** Agrega el nombre visible del remitente si RESEND_FROM_EMAIL solo trae la dirección. */
function formatSender(from: string): string {
  return from.includes('<') ? from : `${SENDER_DISPLAY_NAME} <${from.trim()}>`;
}

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type EmailResult = { sent: true; id: string } | { sent: false; error: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/** Envía un correo transaccional mediante la API REST de Resend (solo servidor). */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false, error: 'El envío de correos no está configurado (RESEND_API_KEY / RESEND_FROM_EMAIL).' };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: formatSender(from),
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok || !data.id) {
      const error = data.message || `Resend respondió con estado ${response.status}`;
      console.error('Error enviando correo con Resend:', error);
      return { sent: false, error };
    }
    return { sent: true, id: data.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Error de red al contactar Resend';
    console.error('Error enviando correo con Resend:', error);
    return { sent: false, error };
  }
}
