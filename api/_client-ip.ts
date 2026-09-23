export function forwardedClientIp(req: any): string {
  // On Vercel, req.socket.remoteAddress is the platform-controlled peer address.
  // Prefer it over request headers so a caller cannot rotate the database
  // rate-limit key by supplying its own x-forwarded-for value. Only fall back to
  // Vercel's normalized header when the runtime does not expose a socket peer.
  const socketIp = String(req.socket?.remoteAddress ?? '').trim();
  if (socketIp) return socketIp;

  const vercelForwardedFor = String(req.headers?.['x-forwarded-for'] ?? '').trim();
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim() || 'unknown';

  return 'unknown';
}
