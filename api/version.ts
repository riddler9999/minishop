import {sendJson} from './_http.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') return sendJson(res, 405, {error: 'Method not allowed'});

  return sendJson(res, 200, {
    app: 'minishop',
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown',
    gitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
    environment: process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || 'development',
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
  });
}
