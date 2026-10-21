// Mueve las imágenes y videos guardados en base64 (data:...) dentro de los cursos a Supabase Storage
// (bucket público course-media) y reemplaza cada valor por su URL pública. Reduce el peso de
// courses.modules y de las claves course_images_* de site_content.
//
// Uso (desde la raíz del proyecto, requiere SUPABASE_SERVICE_ROLE_KEY en .env.local):
//   node --env-file=.env.local scripts/migrate-course-media.mjs           -> simulación, no modifica nada
//   node --env-file=.env.local scripts/migrate-course-media.mjs --apply   -> sube los archivos y actualiza los cursos
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'course-media';
const DATA_URI_PATTERN = /^data:([\w.+-]+\/[\w.+-]+);base64,(.+)$/s;
const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
};

const apply = process.argv.includes('--apply');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const stats = { files: 0, bytes: 0, skipped: 0 };

async function uploadDataUri(value, folder) {
  const match = DATA_URI_PATTERN.exec(value);
  const mimeType = match?.[1];
  const extension = mimeType && EXTENSIONS[mimeType];
  if (!match || !extension) {
    stats.skipped++;
    return value;
  }

  const buffer = Buffer.from(match[2], 'base64');
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 24);
  const path = `${folder}/${hash}.${extension}`;
  stats.files++;
  stats.bytes += buffer.length;

  if (!apply) return `[storage] ${path}`;

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`No fue posible subir ${path}: ${error.message}`);
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Recorre cualquier estructura JSON reemplazando los data URI; devuelve [valor, cambió]. */
async function replaceDataUris(node, folder) {
  if (typeof node === 'string') {
    if (!node.startsWith('data:')) return [node, false];
    const replaced = await uploadDataUri(node, folder);
    return [replaced, replaced !== node];
  }
  if (Array.isArray(node)) {
    let changed = false;
    const out = [];
    for (const item of node) {
      const [value, itemChanged] = await replaceDataUris(item, folder);
      out.push(value);
      changed ||= itemChanged;
    }
    return [out, changed];
  }
  if (node && typeof node === 'object') {
    let changed = false;
    const out = {};
    for (const [key, item] of Object.entries(node)) {
      const [value, itemChanged] = await replaceDataUris(item, folder);
      out[key] = value;
      changed ||= itemChanged;
    }
    return [out, changed];
  }
  return [node, false];
}

const safeFolder = slug => String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-');

async function migrateCourses() {
  const { data: list, error } = await admin.from('courses').select('id, slug');
  if (error) throw new Error(`No fue posible listar los cursos: ${error.message}`);

  for (const { id, slug } of list) {
    // Un curso a la vez: la consulta completa de todos los cursos supera el tiempo límite
    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('image, images, instructor, modules')
      .eq('id', id)
      .single();
    if (courseError) throw new Error(`No fue posible leer ${slug}: ${courseError.message}`);

    const [updated, changed] = await replaceDataUris(course, safeFolder(slug));
    if (!changed) continue;
    console.log(`  curso ${slug}: multimedia en base64 encontrada`);
    if (!apply) continue;

    const { error: updateError } = await admin
      .from('courses')
      .update({ ...updated, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) throw new Error(`No fue posible actualizar ${slug}: ${updateError.message}`);
  }
}

async function migrateImageRegistry() {
  const { data: rows, error } = await admin.from('site_content').select('key').like('key', 'course\\_images\\_%');
  if (error) throw new Error(`No fue posible listar course_images_*: ${error.message}`);

  for (const { key } of rows) {
    const { data: row } = await admin.from('site_content').select('value').eq('key', key).single();
    const [updated, changed] = await replaceDataUris(row?.value, safeFolder(key.replace('course_images_', '')));
    if (!changed) continue;
    console.log(`  ${key}: imágenes en base64 encontradas`);
    if (!apply) continue;

    const { error: updateError } = await admin
      .from('site_content')
      .update({ value: updated, updated_at: new Date().toISOString() })
      .eq('key', key);
    if (updateError) throw new Error(`No fue posible actualizar ${key}: ${updateError.message}`);
  }
}

async function main() {
  if (apply) {
    const { data: bucket } = await admin.storage.getBucket(BUCKET);
    if (!bucket) {
      const { error } = await admin.storage.createBucket(BUCKET, { public: true });
      if (error && !/already exists/i.test(error.message)) throw new Error(`No fue posible crear el bucket: ${error.message}`);
    }
  }

  await migrateCourses();
  await migrateImageRegistry();

  const megabytes = (stats.bytes / (1024 * 1024)).toFixed(2);
  console.log(
    `${apply ? 'Migrados' : 'Por migrar'}: ${stats.files} archivo(s), ${megabytes} MB` +
      (stats.skipped ? ` · ${stats.skipped} con formato no admitido se conservaron` : '')
  );
  if (!apply) console.log('Simulación terminada. Ejecuta con --apply para subir los archivos.');
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
