import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import {
  ALLOWED_MATERIAL_TYPES,
  MAX_MATERIAL_SIZE_BYTES,
  STUDY_MATERIALS_BUCKET,
  sanitizeFileName,
} from '@/lib/studyMaterials';

type UploadRequest = {
  fileName?: unknown;
  contentType?: unknown;
  size?: unknown;
  courseSlug?: unknown;
};

/**
 * Genera una URL firmada para que el navegador suba el material directamente a Supabase Storage,
 * evitando los límites de tamaño del cuerpo de las funciones del servidor.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request, ['admin', 'designer']);
  if (auth.response) return auth.response;

  let body: UploadRequest;
  try {
    body = (await request.json()) as UploadRequest;
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const fileName = typeof body.fileName === 'string' ? body.fileName : '';
  const contentType = typeof body.contentType === 'string' ? body.contentType : '';
  const size = typeof body.size === 'number' ? body.size : 0;
  const courseSlug = typeof body.courseSlug === 'string' ? sanitizeFileName(body.courseSlug) : '';

  if (!fileName || !courseSlug) {
    return NextResponse.json({ error: 'Faltan datos del archivo o del curso.' }, { status: 400 });
  }
  if (!ALLOWED_MATERIAL_TYPES[contentType]) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Usa PDF, Word, PowerPoint, Excel, texto, ZIP, imagen o MP3.' },
      { status: 415 }
    );
  }
  if (size <= 0 || size > MAX_MATERIAL_SIZE_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el tamaño máximo de 50 MB.' }, { status: 413 });
  }

  const supabase = auth.session.admin;

  const { data: bucket } = await supabase.storage.getBucket(STUDY_MATERIALS_BUCKET);
  if (!bucket) {
    const { error: createError } = await supabase.storage.createBucket(STUDY_MATERIALS_BUCKET, {
      public: true,
      fileSizeLimit: MAX_MATERIAL_SIZE_BYTES,
      allowedMimeTypes: Object.keys(ALLOWED_MATERIAL_TYPES),
    });
    if (createError && !/already exists/i.test(createError.message)) {
      console.error('No fue posible crear el bucket de materiales:', createError.message);
      return NextResponse.json({ error: 'No fue posible preparar el almacenamiento de archivos.' }, { status: 500 });
    }
  }

  const path = `${courseSlug}/${Date.now()}-${sanitizeFileName(fileName)}`;
  const { data, error } = await supabase.storage.from(STUDY_MATERIALS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('No fue posible firmar la carga del material:', error?.message);
    return NextResponse.json({ error: 'No fue posible iniciar la carga del archivo.' }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(STUDY_MATERIALS_BUCKET).getPublicUrl(path);

  return NextResponse.json({ path: data.path, token: data.token, publicUrl: publicData.publicUrl });
}
