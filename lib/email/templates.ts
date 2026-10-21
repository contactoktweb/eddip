import type { SiteSettings } from '@/lib/siteSettings';
import { buildWhatsappUrl, formatWhatsappDisplay } from '@/lib/siteSettings';

type TemplateContext = {
  siteUrl: string;
  settings: SiteSettings;
};

type RenderedEmail = { subject: string; html: string; text: string };

const BRAND_NAVY = '#071F49';
const BRAND_BLUE = '#0F59DF';
const TEXT_MUTED = '#5b6c81';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

function button(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px"><tr><td style="border-radius:12px;background:${BRAND_BLUE}">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(label)}</a>
  </td></tr></table>`;
}

function detailRows(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid #e7edf5;border-radius:12px;border-collapse:separate">
    ${rows
      .map(
        ([label, value], i) => `<tr>
      <td style="padding:12px 16px;font-size:13px;color:${TEXT_MUTED};${i > 0 ? 'border-top:1px solid #eef2f6;' : ''}">${escapeHtml(label)}</td>
      <td style="padding:12px 16px;font-size:14px;font-weight:700;color:${BRAND_NAVY};text-align:right;${i > 0 ? 'border-top:1px solid #eef2f6;' : ''}">${escapeHtml(value)}</td>
    </tr>`
      )
      .join('')}
  </table>`;
}

/** Estructura común de los correos con el logo institucional y los datos de contacto. */
function layout(ctx: TemplateContext, preheader: string, bodyHtml: string): string {
  const logoUrl = `${ctx.siteUrl}/eddip-logo.png`;
  const year = new Date().getFullYear();
  const whatsapp = formatWhatsappDisplay(ctx.settings.whatsappNumber);

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EDDIP</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e7edf5">
        <tr><td style="background:linear-gradient(135deg,${BRAND_NAVY},#073B9D);padding:28px 32px" align="left">
          <a href="${escapeHtml(ctx.siteUrl)}" style="text-decoration:none">
            <img src="${escapeHtml(logoUrl)}" width="52" height="52" alt="Logo de EDDIP" style="display:inline-block;vertical-align:middle;border-radius:12px;border:0">
            <span style="display:inline-block;vertical-align:middle;margin-left:12px;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:.04em">EDDIP</span>
          </a>
          <div style="margin-top:6px;font-size:12px;color:#bcd3f5">Educación Superior y Continua</div>
        </td></tr>
        <tr><td style="padding:34px 32px 10px;color:#33445c;font-size:15px;line-height:1.65">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:22px 32px 30px;border-top:1px solid #eef2f6;font-size:12px;color:${TEXT_MUTED};line-height:1.6">
          ¿Necesitas ayuda? Escríbenos por WhatsApp al
          <a href="${escapeHtml(buildWhatsappUrl(ctx.settings))}" style="color:${BRAND_BLUE};font-weight:700">${escapeHtml(whatsapp)}</a>
          o al correo <a href="mailto:${escapeHtml(ctx.settings.contactEmail)}" style="color:${BRAND_BLUE};font-weight:700">${escapeHtml(ctx.settings.contactEmail)}</a>.
          <br><br>© ${year} EDDIP. Todos los derechos reservados.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function textFooter(ctx: TemplateContext): string {
  return `\n\n¿Necesitas ayuda? WhatsApp ${formatWhatsappDisplay(ctx.settings.whatsappNumber)} · ${ctx.settings.contactEmail}\n© ${new Date().getFullYear()} EDDIP`;
}

export function welcomeEmail(ctx: TemplateContext, student: { name: string }): RenderedEmail {
  const firstName = student.name.split(' ')[0] || student.name;
  const dashboardUrl = `${ctx.siteUrl}/dashboard`;
  return {
    subject: '¡Bienvenido a EDDIP! Tu cuenta está activa',
    html: layout(
      ctx,
      'Tu cuenta de estudiante en EDDIP fue creada con éxito.',
      `<h1 style="margin:0 0 14px;font-size:24px;color:${BRAND_NAVY}">¡Hola, ${escapeHtml(firstName)}!</h1>
       <p style="margin:0 0 12px">Tu cuenta de estudiante en <strong>EDDIP</strong> fue creada con éxito. Desde tu panel podrás inscribirte en cursos, avanzar lección a lección, presentar evaluaciones y descargar tus certificados verificables.</p>
       ${button(dashboardUrl, 'Ingresar a mi panel')}
       <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED}">Si no creaste esta cuenta, comunícate con nosotros para revisarlo.</p>`
    ),
    text: `Hola, ${firstName}.\n\nTu cuenta de estudiante en EDDIP fue creada con éxito. Ingresa a tu panel: ${dashboardUrl}${textFooter(ctx)}`,
  };
}

export function purchaseEmail(
  ctx: TemplateContext,
  purchase: { name: string; courseTitle: string; courseSlug?: string; value: number; method: string; saleId: string; date: string }
): RenderedEmail {
  const firstName = purchase.name.split(' ')[0] || purchase.name;
  const courseUrl = purchase.courseSlug ? `${ctx.siteUrl}/aprender/${purchase.courseSlug}` : `${ctx.siteUrl}/dashboard/cursos`;
  return {
    subject: `Inscripción confirmada: ${purchase.courseTitle}`,
    html: layout(
      ctx,
      `Tu inscripción en ${purchase.courseTitle} fue confirmada.`,
      `<h1 style="margin:0 0 14px;font-size:24px;color:${BRAND_NAVY}">¡Tu inscripción está confirmada!</h1>
       <p style="margin:0 0 12px">Hola, ${escapeHtml(firstName)}. Recibimos tu pago y ya tienes acceso al curso. Este es el resumen de tu compra:</p>
       ${detailRows([
         ['Curso', purchase.courseTitle],
         ['Valor pagado', formatMoney(purchase.value)],
         ['Medio de pago', purchase.method],
         ['Referencia', purchase.saleId],
         ['Fecha', purchase.date],
       ])}
       ${button(courseUrl, 'Comenzar el curso')}`
    ),
    text: `Hola, ${firstName}.\n\nTu inscripción en "${purchase.courseTitle}" fue confirmada.\nValor: ${formatMoney(purchase.value)}\nMedio de pago: ${purchase.method}\nReferencia: ${purchase.saleId}\nFecha: ${purchase.date}\n\nComienza aquí: ${courseUrl}${textFooter(ctx)}`,
  };
}

export function passwordResetEmail(ctx: TemplateContext, data: { name: string; resetUrl: string; expiresInMinutes: number }): RenderedEmail {
  const firstName = data.name.split(' ')[0] || data.name;
  return {
    subject: 'Restablece tu contraseña de EDDIP',
    html: layout(
      ctx,
      'Usa este enlace para crear una nueva contraseña.',
      `<h1 style="margin:0 0 14px;font-size:24px;color:${BRAND_NAVY}">Restablecer contraseña</h1>
       <p style="margin:0 0 12px">Hola, ${escapeHtml(firstName)}. Recibimos una solicitud para restablecer la contraseña de tu cuenta en EDDIP. Haz clic en el botón para crear una nueva.</p>
       ${button(data.resetUrl, 'Crear nueva contraseña')}
       <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED}">El enlace vence en ${data.expiresInMinutes} minutos y solo puede usarse una vez. Si no solicitaste este cambio, ignora este correo: tu contraseña actual seguirá funcionando.</p>`
    ),
    text: `Hola, ${firstName}.\n\nPara crear una nueva contraseña ingresa a: ${data.resetUrl}\nEl enlace vence en ${data.expiresInMinutes} minutos. Si no solicitaste este cambio, ignora este correo.${textFooter(ctx)}`,
  };
}

export function adminNotificationEmail(
  ctx: TemplateContext,
  data: { title: string; intro: string; rows: [string, string][]; actionPath: string; actionLabel: string }
): RenderedEmail {
  return {
    subject: `[EDDIP] ${data.title}`,
    html: layout(
      ctx,
      data.intro,
      `<h1 style="margin:0 0 14px;font-size:22px;color:${BRAND_NAVY}">${escapeHtml(data.title)}</h1>
       <p style="margin:0 0 12px">${escapeHtml(data.intro)}</p>
       ${detailRows(data.rows)}
       ${button(`${ctx.siteUrl}${data.actionPath}`, data.actionLabel)}`
    ),
    text: `${data.title}\n\n${data.intro}\n\n${data.rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${ctx.siteUrl}${data.actionPath}`,
  };
}
