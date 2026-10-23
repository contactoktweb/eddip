import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { STUDENT_DIRECTORY_KEY } from '@/lib/auth/accounts';
import { applyEnrollmentToDirectory, type EnrichedStudent } from '@/lib/studentDirectory';
import { readContentList, writeContentValue } from '@/lib/supabase/server';
import type { Sale } from '@/lib/types';
import { sendPurchaseNotifications } from '@/lib/email/notifications';

/**
 * Órdenes de pago (tabla payment_orders, escrita solo con service role). Una orden aprobada
 * se cumple una sola vez: registra la venta, actualiza el directorio y crea la matrícula.
 */

const SALES_KEY = 'admin_sales_list';

export type PaymentOrderStatus = 'pending' | 'approved' | 'rejected' | 'voided';

export type PaymentOrder = {
  order_id: string;
  student_id: string;
  course_slug: string;
  course_title: string;
  amount: number;
  currency: string;
  coupon_code: string | null;
  provider: string;
  payment_link_id: string | null;
  status: PaymentOrderStatus;
  provider_payment_id: string | null;
  payment_method: string | null;
  approved_at: string | null;
  fulfilled_at: string | null;
};

const ORDER_ID_PATTERN = /^EDDIP-[A-Z0-9-]{6,60}$/;
const REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

export const isValidOrderId = (orderId: string) => ORDER_ID_PATTERN.test(orderId);

export function generateOrderId(): string {
  return `EDDIP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export const saleIdForOrder = (orderId: string) => `VEN-${orderId.replace(/^EDDIP-/, '')}`;

export async function findOrderByReference(admin: SupabaseClient, reference: string): Promise<PaymentOrder | null> {
  if (!REFERENCE_PATTERN.test(reference)) return null;
  const { data } = await admin
    .from('payment_orders')
    .select('*')
    .or(`order_id.eq.${reference},payment_link_id.eq.${reference}`)
    .maybeSingle();
  return (data as PaymentOrder | null) ?? null;
}

export async function findStudentOrder(admin: SupabaseClient, orderId: string, studentId: string): Promise<PaymentOrder | null> {
  const { data } = await admin
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('student_id', studentId)
    .maybeSingle();
  return (data as PaymentOrder | null) ?? null;
}

/** Marca la orden como aprobada si seguía pendiente o rechazada (reintento aprobado); devuelve la orden vigente. */
export async function approveOrder(
  admin: SupabaseClient,
  order: PaymentOrder,
  details: { providerPaymentId: string | null; paymentMethod: string | null }
): Promise<PaymentOrder> {
  const now = new Date().toISOString();
  const { data } = await admin
    .from('payment_orders')
    .update({
      status: 'approved',
      provider_payment_id: details.providerPaymentId,
      payment_method: details.paymentMethod,
      approved_at: now,
      updated_at: now,
    })
    .eq('order_id', order.order_id)
    .in('status', ['pending', 'rejected'])
    .select('*')
    .maybeSingle();
  if (data) return data as PaymentOrder;

  const { data: current } = await admin.from('payment_orders').select('*').eq('order_id', order.order_id).maybeSingle();
  return (current as PaymentOrder | null) ?? order;
}

export async function updateOrderStatus(admin: SupabaseClient, orderId: string, status: PaymentOrderStatus, onlyIfPending = true) {
  let query = admin
    .from('payment_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('order_id', orderId);
  if (onlyIfPending) query = query.eq('status', 'pending');
  const { error } = await query;
  if (error) console.error(`No fue posible actualizar la orden ${orderId}:`, error.message);
}

type ProfileRow = { email: string | null; full_name: string | null; document_id: string | null; phone: string | null; city: string | null };

/**
 * Registra la venta, el directorio y la matrícula de una orden aprobada. Es idempotente:
 * puede ejecutarse desde el webhook y desde la verificación del navegador sin duplicar registros.
 */
export async function fulfillApprovedOrder(admin: SupabaseClient, order: PaymentOrder): Promise<{ ok: boolean; saleId: string }> {
  const saleId = saleIdForOrder(order.order_id);
  if (order.status !== 'approved') return { ok: false, saleId };
  if (order.fulfilled_at) return { ok: true, saleId };

  const { data: profileData } = await admin
    .from('profiles')
    .select('email, full_name, document_id, phone, city')
    .eq('id', order.student_id)
    .maybeSingle();
  const profile = (profileData as ProfileRow | null) ?? null;
  const email = (profile?.email || '').toLowerCase();
  const fullName = profile?.full_name?.trim() || email || 'Estudiante EDDIP';

  const sales = await readContentList<Sale>(admin, SALES_KEY);
  let sale = sales.find(s => s.id === saleId);
  if (!sale) {
    sale = {
      id: saleId,
      student: fullName,
      course: order.course_title,
      value: order.amount,
      method: order.provider,
      date: new Date().toISOString().slice(0, 10),
      status: 'Aprobado',
      email,
      courseSlug: order.course_slug,
    };
    if (!(await writeContentValue(admin, SALES_KEY, [sale, ...sales]))) return { ok: false, saleId };
  }
  const approvedSale = sale;

  if (email) {
    const directory = await readContentList<EnrichedStudent>(admin, STUDENT_DIRECTORY_KEY);
    const { list } = applyEnrollmentToDirectory(directory, {
      studentId: order.student_id,
      name: fullName,
      email,
      courseSlug: order.course_slug,
      courseTitle: order.course_title,
      documentId: profile?.document_id || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
    });
    await writeContentValue(admin, STUDENT_DIRECTORY_KEY, list);
  }

  const { error: enrollmentError } = await admin
    .from('enrollments')
    .upsert({ student_id: order.student_id, course_slug: order.course_slug }, { onConflict: 'student_id,course_slug' });
  if (enrollmentError) {
    console.error('No fue posible registrar la matrícula:', enrollmentError.message);
    return { ok: false, saleId };
  }

  await admin
    .from('payment_orders')
    .update({ fulfilled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('order_id', order.order_id);

  // El comprobante y el aviso a la administración salen desde el servidor, aunque el navegador ya esté cerrado
  try {
    await sendPurchaseNotifications(approvedSale);
  } catch (err) {
    console.error(`No fue posible notificar la venta ${saleId}:`, err);
  }

  return { ok: true, saleId };
}

/** Reverso aprobado en Bold: marca la venta como rechazada y retira la matrícula de la orden. */
export async function revokeVoidedOrder(admin: SupabaseClient, order: PaymentOrder): Promise<void> {
  const saleId = saleIdForOrder(order.order_id);
  const sales = await readContentList<Sale>(admin, SALES_KEY);
  if (sales.some(s => s.id === saleId)) {
    await writeContentValue(
      admin,
      SALES_KEY,
      sales.map(s => (s.id === saleId ? { ...s, status: 'Rechazado' } : s))
    );
  }

  const { error } = await admin
    .from('enrollments')
    .delete()
    .eq('student_id', order.student_id)
    .eq('course_slug', order.course_slug);
  if (error) console.error(`No fue posible retirar la matrícula de la orden ${order.order_id}:`, error.message);
}
