import {sendJson} from './_http.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') return sendJson(res, 405, {error: 'Method not allowed'});
  return sendJson(res, 200, {gateway: 'first-party', version: 1});
}
