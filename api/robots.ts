export default function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send('User-agent: *\nDisallow: /api/\n');
}
