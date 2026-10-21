import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readJsonBody, readText } from '@/lib/api/body';
import { STUDENT_DIRECTORY_KEY } from '@/lib/auth/accounts';
import { requireSession } from '@/lib/auth/session';
import { courseBySlug } from '@/lib/data';
import { applyEnrollmentToDirectory, type EnrichedStudent } from '@/lib/studentDirectory';
import type { Sale } from '@/lib/types';

const SALES_KEY = 'admin_sales_list';
const ALLOWED_METHODS = ['Bold', 'PSE', 'Tarjeta de Crédito'];
const SALE_ID_PATTERN = /^VEN-[A-Za-z0-9-]{1,40}$/;

async function readList<T>(admin: SupabaseClient, key: string): Promise<T[]> {
  const { data } = await admin.from('site_content').select('value').eq('key', key).maybeSingle();
  return Array.isArray(data?.value) ? (data.value as T[]) : [];
}

async function writeList(admin: SupabaseClient, key: string, value: unknown[]): Promise<boolean> {
  const { error } = await admin
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) console.error(`No fue posible guardar ${key}:`, error.message);
  return !error;
}

async function findCourse(admin: SupabaseClient, slug: string): Promise<{ title: string; price: number } | null> {
  const { data } = await admin.from('courses').select('title, price').eq('slug', slug).maybeSingle();
  if (data) return { title: String(data.title), price: Number(data.price) || 0 };
  const base = courseBySlug(slug);
  return base ? { title: base.title, price: base.price } : null;
}

/**
 * Registra la venta y la matrícula de la persona autenticada. El correo y el identificador
 * provienen de la sesión verificada, nunca del cuerpo de la solicitud.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const saleId = readText(body, 'saleId', 48);
  const courseSlug = readText(body, 'courseSlug', 120);
  const method = readText(body, 'method', 40);
  if (!SALE_ID_PATTERN.test(saleId) || !courseSlug || !ALLOWED_METHODS.includes(method)) {
    return NextResponse.json({ error: 'Los datos de la compra no son válidos.' }, { status: 400 });
  }

  const { admin, user } = auth.session;
  const email = (user.email || '').toLowerCase();
  const course = await findCourse(admin, courseSlug);
  if (!course || !email) {
    return NextResponse.json({ error: 'El curso seleccionado no existe.' }, { status: 404 });
  }

  const requestedValue = Number(body.value);
  const value = Number.isFinite(requestedValue) ? Math.min(Math.max(Math.round(requestedValue), 0), course.price) : course.price;
  const fullName = readText(body, 'fullName') || String(user.user_metadata?.full_name || email);

  const sales = await readList<Sale>(admin, SALES_KEY);
  if (!sales.some(s => s.id === saleId)) {
    const sale: Sale = {
      id: saleId,
      student: fullName,
      course: course.title,
      value,
      method,
      date: new Date().toISOString().slice(0, 10),
      status: 'Aprobado',
      email,
      courseSlug,
    };
    if (!(await writeList(admin, SALES_KEY, [sale, ...sales]))) {
      return NextResponse.json({ error: 'No fue posible registrar la compra. Inténtalo nuevamente.' }, { status: 500 });
    }
  }

  const directory = await readList<EnrichedStudent>(admin, STUDENT_DIRECTORY_KEY);
  const { list } = applyEnrollmentToDirectory(directory, {
    studentId: user.id,
    name: fullName,
    email,
    courseSlug,
    courseTitle: course.title,
    documentId: readText(body, 'documentId', 40),
    phone: readText(body, 'phone', 40),
    city: readText(body, 'city', 120),
  });
  await writeList(admin, STUDENT_DIRECTORY_KEY, list);

  const { error: enrollmentError } = await admin
    .from('enrollments')
    .upsert({ student_id: user.id, course_slug: courseSlug }, { onConflict: 'student_id,course_slug' });
  if (enrollmentError) console.error('No fue posible registrar la matrícula:', enrollmentError.message);

  return NextResponse.json({ success: true });
}
