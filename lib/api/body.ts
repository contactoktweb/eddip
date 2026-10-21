const DEFAULT_MAX_LENGTH = 200;

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null);
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

/** Texto recortado y acotado; cualquier otro tipo se descarta. */
export function readText(body: Record<string, unknown>, field: string, maxLength = DEFAULT_MAX_LENGTH): string {
  const value = body[field];
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}
