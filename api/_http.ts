export function sendJson(res: any, status: number, body: unknown, cache = false) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache && status === 200 ? 'public, s-maxage=30, stale-while-revalidate=300' : 'no-store');
  res.end(JSON.stringify(body));
}
