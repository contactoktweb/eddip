// Migra las cuentas que solo existían en site_content.eddip_registered_users a Supabase Auth.
// Nunca copia contraseñas: crea la cuenta con una contraseña aleatoria y, con --send-reset,
// envía a cada persona el correo de recuperación para que defina la suya. Las cuentas que ya
// existían en Auth también reciben una contraseña aleatoria nueva (con --send-reset), porque
// la contraseña guardada en el registro heredado estuvo expuesta públicamente.
//
// Uso (desde la raíz del proyecto, requiere SUPABASE_SERVICE_ROLE_KEY en .env.local):
//   node --env-file=.env.local scripts/migrate-legacy-accounts.mjs              -> simulación, no modifica nada
//   node --env-file=.env.local scripts/migrate-legacy-accounts.mjs --apply      -> crea las cuentas
//   node --env-file=.env.local scripts/migrate-legacy-accounts.mjs --apply --send-reset [--site-url=https://...]
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const LEGACY_KEY = 'eddip_registered_users';
const PAGE_SIZE = 1000;
const EMAIL_DELAY_MS = 700;

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const sendReset = args.has('--send-reset');
const siteUrlArg = process.argv.find(a => a.startsWith('--site-url='))?.split('=')[1];
const siteUrl = (siteUrlArg || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}
if (sendReset && !siteUrl) {
  console.error('Para --send-reset indica la URL pública del sitio con --site-url= o NEXT_PUBLIC_SITE_URL.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const normalize = email => String(email || '').trim().toLowerCase();

async function listAuthUsers() {
  const users = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw new Error(`No fue posible listar usuarios de Auth: ${error.message}`);
    for (const u of data.users) users.set(normalize(u.email), u.id);
    if (data.users.length < PAGE_SIZE) return users;
  }
}

async function requestPasswordReset(email) {
  const res = await fetch(`${siteUrl}/api/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
}

async function main() {
  const { data: row, error } = await admin.from('site_content').select('value').eq('key', LEGACY_KEY).maybeSingle();
  if (error) throw new Error(`No fue posible leer ${LEGACY_KEY}: ${error.message}`);

  const legacy = Array.isArray(row?.value) ? row.value : [];
  if (legacy.length === 0) {
    console.log(`No hay cuentas en ${LEGACY_KEY}. Nada que migrar.`);
    return;
  }

  const existing = await listAuthUsers();
  const seen = new Set();
  const pending = [];
  const exposed = [];
  const staffRoles = [];

  for (const account of legacy) {
    const email = normalize(account?.email);
    if (!email || !email.includes('@') || seen.has(email)) continue;
    seen.add(email);
    if (account.role === 'admin' || account.role === 'designer') staffRoles.push(`${email} (${account.role})`);
    if (existing.has(email)) exposed.push({ email, id: existing.get(email) });
    else pending.push({ ...account, email });
  }

  console.log(`Cuentas heredadas: ${seen.size} · ya en Supabase Auth: ${seen.size - pending.length} · por crear: ${pending.length}`);
  if (staffRoles.length > 0) {
    console.log('Roles administrativos declarados en el registro heredado (NO se aplican automáticamente;');
    console.log('asígnalos desde /admin/roles solo si son legítimos):');
    for (const entry of staffRoles) console.log(`  - ${entry}`);
  }

  if (!sendReset && exposed.length > 0) {
    console.log(`${exposed.length} cuenta(s) ya en Auth tenían su contraseña en el registro heredado; usa --send-reset para rotarlas.`);
  }

  if (!apply) {
    for (const account of pending) console.log(`  [simulación] crearía ${account.email}`);
    if (sendReset) for (const account of exposed) console.log(`  [simulación] rotaría la contraseña de ${account.email}`);
    console.log('Simulación terminada. Ejecuta con --apply para crear las cuentas.');
    return;
  }

  let failures = 0;
  for (const account of pending) {
    const metadata = {
      full_name: String(account.fullName || '').trim() || account.email.split('@')[0],
      document_id: String(account.documentId || '').trim(),
      phone: String(account.phone || '').trim(),
      city: String(account.city || '').trim(),
    };
    const { data, error: createError } = await admin.auth.admin.createUser({
      email: account.email,
      password: randomBytes(24).toString('base64url'),
      email_confirm: true,
      user_metadata: metadata,
    });
    if (createError || !data.user) {
      failures++;
      console.error(`  [error] ${account.email}: ${createError?.message || 'sin respuesta'}`);
      continue;
    }

    await admin.from('profiles').upsert({ id: data.user.id, email: account.email, ...metadata, role: 'student' });
    console.log(`  [creada] ${account.email}`);

    if (sendReset) {
      try {
        await requestPasswordReset(account.email);
        console.log(`  [correo] recuperación enviada a ${account.email}`);
      } catch (err) {
        failures++;
        console.error(`  [error correo] ${account.email}: ${err.message}`);
      }
      await sleep(EMAIL_DELAY_MS);
    }
  }

  if (sendReset) {
    for (const account of exposed) {
      const { error: rotateError } = await admin.auth.admin.updateUserById(account.id, {
        password: randomBytes(24).toString('base64url'),
      });
      if (rotateError) {
        failures++;
        console.error(`  [error] ${account.email}: ${rotateError.message}`);
        continue;
      }
      try {
        await requestPasswordReset(account.email);
        console.log(`  [rotada] ${account.email}: contraseña reemplazada y correo de recuperación enviado`);
      } catch (err) {
        failures++;
        console.error(`  [error correo] ${account.email}: ${err.message}`);
      }
      await sleep(EMAIL_DELAY_MS);
    }
  }

  if (failures > 0) {
    console.error(`Terminó con ${failures} error(es). ${LEGACY_KEY} se conserva para reintentar.`);
    process.exitCode = 1;
    return;
  }

  const { error: deleteError } = await admin.from('site_content').delete().eq('key', LEGACY_KEY);
  if (deleteError) {
    console.error(`Las cuentas se migraron, pero no se pudo eliminar ${LEGACY_KEY}: ${deleteError.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Migración completa. Se eliminó ${LEGACY_KEY} de site_content.`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
