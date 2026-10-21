import { createHash, randomBytes } from 'crypto';
import { createServerSupabase, readSiteContent, writeSiteContent } from '@/lib/supabase/server';

const RESET_TOKENS_KEY = 'password_reset_tokens';
export const RESET_TOKEN_TTL_MINUTES = 60;
export const MIN_PASSWORD_LENGTH = 6;

type StoredResetToken = { hash: string; email: string; expiresAt: string };

export type RegisteredAccountRecord = {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  documentId?: string;
  phone?: string;
  city?: string;
  role: 'student' | 'admin' | 'designer';
  createdAt: string;
};

type DirectoryStudent = { id: string; name: string; email: string; documentId?: string; phone?: string; city?: string };

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function readTokens(): Promise<StoredResetToken[]> {
  const stored = await readSiteContent<StoredResetToken[]>(RESET_TOKENS_KEY);
  const now = Date.now();
  return (Array.isArray(stored) ? stored : []).filter(t => new Date(t.expiresAt).getTime() > now);
}

/** Busca a la persona entre las cuentas registradas y, si no tiene cuenta, en el directorio de estudiantes. */
export async function findAccountHolder(email: string): Promise<{ name: string; account?: RegisteredAccountRecord; student?: DirectoryStudent } | null> {
  const clean = normalizeEmail(email);
  const accounts = (await readSiteContent<RegisteredAccountRecord[]>('eddip_registered_users')) || [];
  const account = accounts.find(a => normalizeEmail(a.email || '') === clean);
  if (account) return { name: account.fullName || clean, account };

  const students = (await readSiteContent<DirectoryStudent[]>('admin_students_list')) || [];
  const student = students.find(s => normalizeEmail(s.email || '') === clean);
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

/** Actualiza la contraseña de la cuenta institucional (y de Supabase Auth cuando hay service role). */
export async function updateAccountPassword(email: string, password: string): Promise<boolean> {
  const clean = normalizeEmail(email);
  const accounts = (await readSiteContent<RegisteredAccountRecord[]>('eddip_registered_users')) || [];
  const index = accounts.findIndex(a => normalizeEmail(a.email || '') === clean);

  if (index >= 0) {
    accounts[index] = { ...accounts[index], password };
  } else {
    const holder = await findAccountHolder(clean);
    if (!holder?.student) return false;
    accounts.unshift({
      id: holder.student.id,
      email: clean,
      password,
      fullName: holder.student.name,
      documentId: holder.student.documentId || '',
      phone: holder.student.phone || '',
      city: holder.student.city || '',
      role: 'student',
      createdAt: new Date().toISOString(),
    });
  }

  const saved = await writeSiteContent('eddip_registered_users', accounts);
  if (!saved) return false;

  const admin = createServerSupabase({ requireServiceRole: true });
  if (admin) {
    const PAGE_SIZE = 1000;
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
      if (error || !data) break;
      const authUser = data.users.find(u => normalizeEmail(u.email || '') === clean);
      if (authUser) {
        await admin.auth.admin.updateUserById(authUser.id, { password });
        break;
      }
      if (data.users.length < PAGE_SIZE) break;
    }
  }

  return true;
}
