const hits = new Map<string, {count:number; reset:number}>();
export function rateLimit(req: any, limit = 30, windowMs = 60_000): boolean {
  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const current = hits.get(ip);
  if (!current || current.reset <= now) { hits.set(ip, {count:1, reset:now + windowMs}); return true; }
  current.count += 1;
  return current.count <= limit;
}
