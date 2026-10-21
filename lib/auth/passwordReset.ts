import { createHash, randomBytes } from 'crypto';
import { createServerSupabase, readSiteContent, writeSiteContent } from '@/lib/supabase/server';
import { createAuthAccount, findProfileByEmail, readStudentDirectory } from '@/lib/auth/accounts';

export { MIN_PASSWORD_LENGTH } from '@/lib/auth/accounts';

const RESET_TOKENS_KEY = 'password_reset_tokens';
export const RESET_TOKEN_TTL_MINUTES = 60;

type StoredResetToken = { hash: string; email: string; expiresAt: string };

type AccountHolder = { name: string; userId?: string; student?: { name?: string; documentId?: string; phone?: string; city?: string } };

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function readTokens(): Promise<StoredResetToken[]> {
  const stored = await readSiteContent<StoredResetToken[]>(RESET_TOKENS_KEY);
  const now = Date.now();
  return (Array.isArray(stored) ? stored : []).filter(t => new Date(t.expiresAt).getTime() > now);
}

/** Busca a la persona en Supabase Auth (perfil) y, si aún no tiene cuenta, en el directorio de estudiantes. */
export async function findAccountHolder(email: string): Promise<AccountHolder | null> {
  const admin = createServerSupabase({ requireServiceRole: true });
  if (!admin) return null;
  const clean = normalizeEmail(email);

  const profile = await findProfileByEmail(admin, clean);
  if (profile) return { name: profile.full_name || clean, userId: profile.id };

  const student = (await readStudentDirectory(admin)).find(s => normalizeEmail(s.email || '') === clean);
  if (student) return { name: student.name || clean, student };

  return null;
}

/** Crea un token de un solo uso; en la base de datos solo se guarda su hash. */
export async function createResetToken(email: string): Promise<string | null> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
  const clean = normalizeEmail(email);
  const tokens = (await readTokens()).filter(t => t.email !== clean);
  const saved = await writeSiteContent(RESET_TOKENS_KEY, [...tokens, { hash: hashToken(token), email: clean, expiresAt }]);
  return saved ? token : null;
}

/** Valida y consume el token. Devuelve el correo asociado o null si es inválido o expiró. */
export async function consumeResetToken(token: string): Promise<string | null> {
  const hash = hashToken(token);
  const tokens = await readTokens();
  const match = tokens.find(t => t.hash === hash);
  if (!match) return null;
  await writeSiteContent(RESET_TOKENS_KEY, tokens.filter(t => t.hash !== hash));
  return match.email;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const hash = hashToken(token);
  return (await readTokens()).some(t => t.hash === hash);
}

/**
 * Actualiza la contraseña en Supabase Auth. Si la persona solo existía en el directorio
 * (inscrita por un administrador), se le crea su cuenta de estudiante con esa contraseña.
 */
export async function updateAccountPassword(email: string, password: string): Promise<boolean> {
  const admin = createServerSupabase({ requireServiceRole: true });
  if (!admin) return false;

  const holder = await findAccountHolder(email);
  if (!holder) return false;

  if (holder.userId) {
    const { error } = await admin.auth.admin.updateUserById(holder.userId, { password });
    if (error) console.error('No fue posible actualizar la contraseña:', error.message);
    return !error;
  }

  const created = await createAuthAccount(admin, {
    email,
    password,
    fullName: holder.student?.name || holder.name,
    documentId: holder.student?.documentId,
    phone: holder.student?.phone,
    city: holder.student?.city,
    role: 'student',
  });
  return Boolean(created.userId);
}
