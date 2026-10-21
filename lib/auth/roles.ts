export type AppRole = 'student' | 'designer' | 'admin';

export const APP_ROLES: readonly AppRole[] = ['student', 'designer', 'admin'];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (APP_ROLES as readonly string[]).includes(value);
}

/** Cualquier valor desconocido se trata como estudiante (el rol con menos privilegios). */
export function normalizeRole(value: unknown): AppRole {
  return isAppRole(value) ? value : 'student';
}
