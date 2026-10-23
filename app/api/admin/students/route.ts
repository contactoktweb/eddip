import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { requireSession } from '@/lib/auth/session';
import { isValidEmail } from '@/lib/siteSettings';
import { isValidCourseSlug } from '@/lib/courses/serverCourse';
import { isManualPaymentMethod } from '@/lib/admin/paymentMethods';
import { enrollStudent, listStudents } from '@/lib/admin/studentRecords';

const MAX_COURSES_PER_REQUEST = 30;
const MAX_SALE_VALUE = 100_000_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Directorio unificado de estudiantes (perfiles, matrículas y certificados). Solo administradores. */
export async function GET(request: Request) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;

  const students = await listStudents(auth.session.admin);
  return NextResponse.json({ students }, { headers: { 'Cache-Control': 'no-store' } });
}

/** Registro manual o asignación de cursos a un estudiante, con venta opcional. Solo administradores. */
export async function POST(request: Request) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const email = readText(body, 'email').toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Ingresa un correo electrónico válido.' }, { status: 400 });
  }

  const courseSlugs = Array.isArray(body.courseSlugs)
    ? body.courseSlugs.filter((s): s is string => typeof s === 'string' && isValidCourseSlug(s)).slice(0, MAX_COURSES_PER_REQUEST)
    : [];
  if (courseSlugs.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos un curso.' }, { status: 400 });
  }

  let sale: { method: string; values: Record<string, number>; date?: string } | undefined;
  if (body.sale && typeof body.sale === 'object') {
    const rawSale = body.sale as Record<string, unknown>;
    if (!isManualPaymentMethod(rawSale.method)) {
      return NextResponse.json({ error: 'El medio de pago no es válido.' }, { status: 400 });
    }
    const values: Record<string, number> = {};
    const rawValues = rawSale.values && typeof rawSale.values === 'object' ? (rawSale.values as Record<string, unknown>) : {};
    for (const slug of courseSlugs) {
      const value = Number(rawValues[slug]);
      if (Number.isFinite(value) && value >= 0 && value <= MAX_SALE_VALUE) values[slug] = Math.round(value);
    }
    const date = typeof rawSale.date === 'string' && DATE_PATTERN.test(rawSale.date) ? rawSale.date : undefined;
    sale = { method: rawSale.method, values, date };
  }

  const result = await enrollStudent(
    auth.session.admin,
    {
      email,
      fullName: readText(body, 'fullName', 120),
      documentId: readText(body, 'documentId', 40),
      phone: readText(body, 'phone', 40),
      city: readText(body, 'city', 120),
      courseSlugs,
      sale,
    },
    request
  );

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  return NextResponse.json({ success: true, studentId: result.studentId, accountCreated: result.accountCreated });
}
