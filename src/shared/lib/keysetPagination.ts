const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export function boundedPageSize(input?: number): number {
  if (!Number.isFinite(input)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(input!)));
}

export function encodePageCursor<T extends Record<string, unknown>>(value: T): string {
  return btoa(JSON.stringify(value));
}

export function decodePageCursor<T>(
  raw: string | null | undefined,
  isValid: (value: unknown) => value is T,
): T | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(atob(raw));
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function isSafeCursorId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
}
