import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppRole } from '@/lib/auth/roles';

export const MIN_PASSWORD_LENGTH = 6;
export const STUDENT_DIRECTORY_KEY = 'admin_students_list';

export type AccountInput = {
  email: string;
  fullName: string;
  documentId?: string;
  phone?: string;
  city?: string;
  password?: string;
  role?: AppRole;
};

export type ProfileRecord = { id: string; email: string; full_name: string | null; role: string | null; created_at?: string };

type DirectoryEntry = { email?: string; name?: string; documentId?: string };

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeDocument = (doc?: string) => (doc || '').replace(/[\s.-]/g, '');
const MIN_DOCUMENT_LENGTH = 4;

export async function findProfileByEmail(admin: SupabaseClient, email: string): Promise<ProfileRecord | null> {
  const { data } = await admin
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  return (data as ProfileRecord | null) ?? null;
}

export async function readStudentDirectory(admin: SupabaseClient): Promise<DirectoryEntry[]> {
  const { data } = await admin.from('site_content').select('value').eq('key', STUDENT_DIRECTORY_KEY).maybeSingle();
  return Array.isArray(data?.value) ? (data.value as DirectoryEntry[]) : [];
}

/**
 * Devuelve un mensaje si el correo ya tiene cuenta o si la cédula pertenece a otra persona.
 * Un estudiante inscrito por un administrador (solo en el directorio) puede reclamar su cuenta con el mismo correo.
 */
export async function findDuplicateAccount(admin: SupabaseClient, email: string, documentId?: string): Promise<string | null> {
  const cleanEmail = normalizeEmail(email);
  if (await findProfileByEmail(admin, cleanEmail)) {
    return 'Este correo electrónico ya se encuentra registrado. Inicia sesión o recupera tu contraseña.';
  }

  const doc = normalizeDocument(documentId);
  if (doc.length < MIN_DOCUMENT_LENGTH) return null;

  const { data: profiles } = await admin.from('profiles').select('email, document_id').not('document_id', 'is', null);
  const takenByProfile = (profiles || []).some(
    p => normalizeDocument(p.document_id as string) === doc && normalizeEmail(String(p.email || '')) !== cleanEmail
  );
  const takenByDirectory = (await readStudentDirectory(admin)).some(
    s => normalizeDocument(s.documentId) === doc && normalizeEmail(s.email || '') !== cleanEmail
  );

  return takenByProfile || takenByDirectory
    ? `El documento de identidad "${documentId?.trim()}" ya se encuentra registrado con otra cuenta.`
    : null;
}

/** Crea la cuenta en Supabase Auth (único almacén de credenciales) y completa su perfil con el rol indicado. */
export async function createAuthAccount(
  admin: SupabaseClient,
  input: AccountInput
): Promise<{ userId: string; error?: never; status?: never } | { userId?: never; error: string; status: number }> {
  const email = normalizeEmail(input.email);
  const profile = {
    full_name: input.fullName.trim(),
    document_id: input.documentId?.trim() || '',
    phone: input.phone?.trim() || '',
    city: input.city?.trim() || '',
  };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password || randomBytes(24).toString('base64url'),
    email_confirm: true,
    user_metadata: profile,
  });

  if (error || !data.user) {
    if (error && /already|registered|exists/i.test(error.message)) {
      return { error: 'Este correo electrónico ya se encuentra registrado. Inicia sesión o recupera tu contraseña.', status: 409 };
    }
    console.error('No fue posible crear la cuenta en Supabase Auth:', error?.message);
    return { error: 'No fue posible crear la cuenta. Inténtalo nuevamente.', status: 500 };
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    email,
    ...profile,
    role: input.role || 'student',
    updated_at: new Date().toISOString(),
  });
  if (profileError) {
    console.error('La cuenta se creó, pero no fue posible completar el perfil:', profileError.message);
  }

  return { userId: data.user.id };
}
