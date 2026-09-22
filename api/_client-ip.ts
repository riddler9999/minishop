export function forwardedClientIp(req: any): string {
  const raw = String(
    req.headers?.['x-forwarded-for'] ??
      req.headers?.['x-real-ip'] ??
      req.socket?.remoteAddress ??
      'unknown',
  );
  return raw.split(',')[0].trim() || 'unknown';
}
