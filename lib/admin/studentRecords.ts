import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sale } from '@/lib/types';
import { STUDENT_DIRECTORY_KEY, createAuthAccount, findProfileByEmail, normalizeEmail } from '@/lib/auth/accounts';
import { ACCOUNT_SETUP_TTL_MINUTES, createResetToken } from '@/lib/auth/passwordReset';
import { applyEnrollmentToDirectory, type EnrichedStudent } from '@/lib/studentDirectory';
import { readContentList, writeContentValue } from '@/lib/supabase/server';
import { isEmailConfigured, sendEmail } from '@/lib/email/resend';
import { accountSetupEmail } from '@/lib/email/templates';
import { getEmailContext } from '@/lib/email/context';
import { sendPurchaseNotifications } from '@/lib/email/notifications';

/**
 * Fuente única de la información de estudiantes para el panel: perfiles, matrículas y certificados
 * de la base de datos, más los registros del directorio institucional. Lo que solo existía en el
 * directorio se migra automáticamente a la tabla de matrículas para que el estudiante tenga acceso.
 */

const SALES_KEY = 'admin_sales_list';
const MINUTES_PER_DAY = 24 * 60;

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  document_id: string | null;
  phone: string | null;
  city: string | null;
  role: string | null;
  created_at: string | null;
};
type EnrollmentRow = { student_id: string; course_slug: string; enrolled_at: string | null; progress_percent: number | null };
type CertificateRow = { code: string; student_id: string | null; document_id: string | null; course_slug: string };
type CourseRow = { slug: string; title: string; price: number | null };

export type StudentProfileInput = {
  fullName?: string;
  documentId?: string;
  phone?: string;
  city?: string;
};

export type EnrollmentRequest = StudentProfileInput & {
  email: string;
  courseSlugs: string[];
  /** Registra una venta aprobada por cada curso (medio de pago y valor por curso). */
  sale?: { method: string; values: Record<string, number> };
};

const normalizeDocument = (doc?: string | null) => (doc || '').replace(/[\s.-]/g, '');

async function loadCourses(admin: SupabaseClient): Promise<Map<string, CourseRow>> {
  const { data } = await admin.from('courses').select('slug, title, price');
  return new Map(((data as CourseRow[] | null) || []).map(c => [c.slug, c]));
}

/** Copia a la tabla de matrículas los cursos que solo estaban registrados en el directorio. */
async function migrateDirectoryEnrollments(
  admin: SupabaseClient,
  directory: EnrichedStudent[],
  profilesByEmail: Map<string, ProfileRow>,
  enrolled: Set<string>
): Promise<EnrollmentRow[]> {
  const missing: { student_id: string; course_slug: string }[] = [];
  for (const entry of directory) {
    const profile = profilesByEmail.get(normalizeEmail(entry.email || ''));
    if (!profile) continue;
    for (const course of entry.enrolledCourses || []) {
      const key = `${profile.id}:${course.slug}`;
      if (!enrolled.has(key)) {
        enrolled.add(key);
        missing.push({ student_id: profile.id, course_slug: course.slug });
      }
    }
  }
  if (missing.length === 0) return [];

  const { error } = await admin.from('enrollments').upsert(missing, { onConflict: 'student_id,course_slug' });
  if (error) {
    console.error('No fue posible migrar matrículas del directorio:', error.message);
    return [];
  }
  return missing.map(m => ({ ...m, enrolled_at: new Date().toISOString(), progress_percent: 0 }));
}

export async function listStudents(admin: SupabaseClient): Promise<EnrichedStudent[]> {
  const [profilesRes, enrollmentsRes, certificatesRes, courses, directory] = await Promise.all([
    admin.from('profiles').select('id, email, full_name, document_id, phone, city, role, created_at'),
    admin.from('enrollments').select('student_id, course_slug, enrolled_at, progress_percent'),
    admin.from('certificates').select('code, student_id, document_id, course_slug'),
    loadCourses(admin),
    readContentList<EnrichedStudent>(admin, STUDENT_DIRECTORY_KEY),
  ]);

  const profiles = ((profilesRes.data as ProfileRow[] | null) || []).filter(p => p.email);
  const profilesByEmail = new Map(profiles.map(p => [normalizeEmail(p.email), p]));
  const enrollments = (enrollmentsRes.data as EnrollmentRow[] | null) || [];
  const enrolledKeys = new Set(enrollments.map(e => `${e.student_id}:${e.course_slug}`));
  enrollments.push(...(await migrateDirectoryEnrollments(admin, directory, profilesByEmail, enrolledKeys)));
  const certificates = (certificatesRes.data as CertificateRow[] | null) || [];
  const directoryByEmail = new Map(directory.map(d => [normalizeEmail(d.email || ''), d]));

  const buildStudent = (base: {
    id: string;
    name: string;
    email: string;
    documentId: string;
    phone: string;
    city: string;
    registeredAt: string;
    role: EnrichedStudent['role'];
  }): EnrichedStudent => {
    const own = enrollments.filter(e => e.student_id === base.id);
    const doc = normalizeDocument(base.documentId);
    const ownCertificates = certificates.filter(
      c => c.student_id === base.id || (doc.length > 0 && normalizeDocument(c.document_id) === doc)
    );
    const enrolledCourses = own.map(e => ({
      slug: e.course_slug,
      title: courses.get(e.course_slug)?.title || e.course_slug,
      progress: Math.max(0, Math.min(100, Number(e.progress_percent) || 0)),
      completedLessons: [],
      totalLessons: 1,
      certificateCode: ownCertificates.find(c => c.course_slug === e.course_slug)?.code,
    }));
    const progressAvg = enrolledCourses.length
      ? Math.round(enrolledCourses.reduce((a, c) => a + c.progress, 0) / enrolledCourses.length)
      : 0;
    return {
      ...base,
      coursesCount: enrolledCourses.length,
      progressAvg,
      certificatesCount: ownCertificates.length,
      status: progressAvg >= 100 ? 'Completado' : enrolledCourses.length > 0 ? 'Activo' : 'Inactivo',
      enrolledCourses,
      examScores: directoryByEmail.get(base.email)?.examScores || [],
    };
  };

  const students: EnrichedStudent[] = profiles
    .filter(p => (p.role || 'student') === 'student')
    .map(p => {
      const email = normalizeEmail(p.email);
      const dir = directoryByEmail.get(email);
      return buildStudent({
        id: p.id,
        name: p.full_name || dir?.name || email.split('@')[0],
        email,
        documentId: p.document_id || dir?.documentId || '',
        phone: p.phone || dir?.phone || '',
        city: p.city || dir?.city || '',
        registeredAt: (p.created_at || '').slice(0, 10) || dir?.registeredAt || '',
        role: 'student',
      });
    });

  // Personas registradas solo en el directorio (sin cuenta todavía)
  for (const dir of directory) {
    const email = normalizeEmail(dir.email || '');
    if (!email || profilesByEmail.has(email)) continue;
    students.push({
      ...dir,
      email,
      status: dir.status || 'Inactivo',
      enrolledCourses: dir.enrolledCourses || [],
      examScores: dir.examScores || [],
      coursesCount: (dir.enrolledCourses || []).length,
    });
  }

  return students.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));
}

async function updateProfileFields(admin: SupabaseClient, profile: ProfileRow, input: StudentProfileInput) {
  const changes: Record<string, string> = {};
  if (input.fullName?.trim()) changes.full_name = input.fullName.trim();
  if (input.documentId !== undefined) changes.document_id = input.documentId.trim();
  if (input.phone !== undefined) changes.phone = input.phone.trim();
  if (input.city !== undefined) changes.city = input.city.trim();
  if (Object.keys(changes).length === 0) return null;

  const { error } = await admin
    .from('profiles')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', profile.id);
  return error?.message ?? null;
}

/** Actualiza los datos de la ficha del estudiante en su perfil y en el directorio. */
export async function updateStudentProfile(
  admin: SupabaseClient,
  studentId: string,
  input: StudentProfileInput
): Promise<{ error?: string }> {
  const { data } = await admin
    .from('profiles')
    .select('id, email, full_name, document_id, phone, city, role, created_at')
    .eq('id', studentId)
    .maybeSingle();
  const profile = data as ProfileRow | null;

  const directory = await readContentList<EnrichedStudent>(admin, STUDENT_DIRECTORY_KEY);
  const dirIndex = directory.findIndex(d => d.id === studentId || (profile && normalizeEmail(d.email) === normalizeEmail(profile.email)));
  if (!profile && dirIndex < 0) return { error: 'No encontramos a este estudiante.' };

  if (profile) {
    const error = await updateProfileFields(admin, profile, input);
    if (error) return { error };
  }

  if (dirIndex >= 0) {
    const current = directory[dirIndex];
    directory[dirIndex] = {
      ...current,
      name: input.fullName?.trim() || current.name,
      documentId: input.documentId?.trim() ?? current.documentId,
      phone: input.phone?.trim() ?? current.phone,
      city: input.city?.trim() ?? current.city,
    };
    await writeContentValue(admin, STUDENT_DIRECTORY_KEY, directory);
  }
  return {};
}

/**
 * Matricula a una persona en uno o varios cursos: crea su cuenta si no existe (y le envía el
 * enlace para crear su contraseña), registra la matrícula, el directorio y, si se indica, la venta
 * con su comprobante.
 */
export async function enrollStudent(
  admin: SupabaseClient,
  request: EnrollmentRequest,
  siteRequest?: Request
): Promise<{ error?: string; status?: number; studentId?: string; accountCreated?: boolean }> {
  const email = normalizeEmail(request.email);
  const courses = await loadCourses(admin);
  const selected = [...new Set(request.courseSlugs)].map(slug => courses.get(slug)).filter((c): c is CourseRow => Boolean(c));
  if (selected.length === 0) return { error: 'Selecciona al menos un curso válido.', status: 400 };

  let profile = (await findProfileByEmail(admin, email)) as ProfileRow | null;
  let accountCreated = false;

  if (!profile) {
    const fullName = request.fullName?.trim();
    if (!fullName) return { error: 'Ingresa el nombre completo del estudiante.', status: 400 };
    const created = await createAuthAccount(admin, {
      email,
      fullName,
      documentId: request.documentId,
      phone: request.phone,
      city: request.city,
      role: 'student',
    });
    if (!created.userId) return { error: created.error, status: created.status };
    const userId = created.userId;
    accountCreated = true;
    const { data } = await admin
      .from('profiles')
      .select('id, email, full_name, document_id, phone, city, role, created_at')
      .eq('id', userId)
      .maybeSingle();
    profile = (data as ProfileRow | null) ?? {
      id: userId,
      email,
      full_name: fullName,
      document_id: request.documentId || '',
      phone: request.phone || '',
      city: request.city || '',
      role: 'student',
      created_at: new Date().toISOString(),
    };
  } else {
    // Completa solo los datos que la ficha aún no tiene
    await updateProfileFields(admin, profile, {
      fullName: profile.full_name ? undefined : request.fullName,
      documentId: profile.document_id ? undefined : request.documentId,
      phone: profile.phone ? undefined : request.phone,
      city: profile.city ? undefined : request.city,
    });
  }

  const student: ProfileRow = profile;
  const { error: enrollError } = await admin.from('enrollments').upsert(
    selected.map(c => ({ student_id: student.id, course_slug: c.slug })),
    { onConflict: 'student_id,course_slug' }
  );
  if (enrollError) return { error: `No fue posible registrar la matrícula: ${enrollError.message}`, status: 500 };

  const name = student.full_name || request.fullName?.trim() || email;
  let directory = await readContentList<EnrichedStudent>(admin, STUDENT_DIRECTORY_KEY);
  for (const course of selected) {
    directory = applyEnrollmentToDirectory(directory, {
      studentId: student.id,
      name,
      email,
      courseSlug: course.slug,
      courseTitle: course.title,
      documentId: student.document_id || request.documentId,
      phone: student.phone || request.phone,
      city: student.city || request.city,
    }).list.map(d => (normalizeEmail(d.email) === email ? { ...d, id: student.id } : d));
  }
  await writeContentValue(admin, STUDENT_DIRECTORY_KEY, directory);

  const ctx = await getEmailContext(siteRequest);

  if (request.sale) {
    const sales = await readContentList<Sale>(admin, SALES_KEY);
    const stamp = Date.now().toString(36).toUpperCase();
    const newSales: Sale[] = selected.map((course, index) => ({
      id: `VEN-${stamp}-${index + 1}`,
      student: name,
      course: course.title,
      value: Math.max(0, Math.round(request.sale!.values[course.slug] ?? Number(course.price) ?? 0)),
      method: request.sale!.method,
      date: new Date().toISOString().slice(0, 10),
      status: 'Aprobado',
      email,
      courseSlug: course.slug,
    }));
    if (!(await writeContentValue(admin, SALES_KEY, [...newSales, ...sales]))) {
      return { error: 'La matrícula quedó registrada, pero no se guardó la venta.', status: 500, studentId: student.id };
    }
    for (const sale of newSales) {
      try {
        await sendPurchaseNotifications(sale, ctx);
      } catch (err) {
        console.error(`No fue posible notificar la venta ${sale.id}:`, err);
      }
    }
  }

  if (accountCreated && isEmailConfigured()) {
    const token = await createResetToken(email, ACCOUNT_SETUP_TTL_MINUTES);
    if (token) {
      const setupUrl = `${ctx.siteUrl}/login?mode=new-password&token=${encodeURIComponent(token)}`;
      const result = await sendEmail({
        to: email,
        replyTo: ctx.settings.contactEmail,
        ...accountSetupEmail(ctx, {
          name,
          setupUrl,
          courses: selected.map(c => c.title),
          expiresInDays: ACCOUNT_SETUP_TTL_MINUTES / MINUTES_PER_DAY,
        }),
      });
      if (!result.sent) console.error('No fue posible enviar el correo de activación:', result.error);
    }
  }

  return { studentId: student.id, accountCreated };
}
