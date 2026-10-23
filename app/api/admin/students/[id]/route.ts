import { NextResponse } from 'next/server';
import { readJsonBody, readText } from '@/lib/api/body';
import { requireSession } from '@/lib/auth/session';
import { updateStudentProfile } from '@/lib/admin/studentRecords';

type RouteContext = { params: Promise<{ id: string }> };

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Actualización de la ficha del estudiante (nombre, documento, celular y ciudad). Solo administradores. */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireSession(request, ['admin']);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!ID_PATTERN.test(id)) return NextResponse.json({ error: 'Estudiante no válido.' }, { status: 400 });

  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const fullName = readText(body, 'fullName', 120);
  if (!fullName) return NextResponse.json({ error: 'El nombre completo es obligatorio.' }, { status: 400 });

  const result = await updateStudentProfile(auth.session.admin, id, {
    fullName,
    documentId: readText(body, 'documentId', 40),
    phone: readText(body, 'phone', 40),
    city: readText(body, 'city', 120),
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
