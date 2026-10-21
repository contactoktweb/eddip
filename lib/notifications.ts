'use client';

type StudentNotification =
  | { type: 'welcome'; email: string }
  | { type: 'purchase'; email: string; saleId: string };

/**
 * Solicita al servidor el envío de un correo transaccional. No bloquea ni interrumpe el flujo
 * del usuario si el correo no puede enviarse.
 */
export function notifyStudent(notification: StudentNotification): void {
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
    keepalive: true,
  }).catch(err => console.warn('No fue posible solicitar el envío del correo:', err));
}
