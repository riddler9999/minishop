import {createClient} from '@supabase/supabase-js';
import {sendJson} from '../server/_http.js';

export const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;

type NotificationDeps = {
  createClient: typeof createClient;
  fetchImpl: typeof fetch;
  env: NodeJS.ProcessEnv;
};

function backoffMinutes(attempt: number) {
  return Math.min(60, 2 ** Math.max(0, attempt - 1));
}

function renderEmail(row: any) {
  const type = String(row.event_type || '');
  const payload = row.payload || {};
  if (type === 'order_created') {
    return {
      subject: `Order ${payload.order_no ?? ''} received`,
      text: `Your order ${payload.order_no ?? ''} has been received. Total: ${payload.grand_total ?? ''} Ks.`,
    };
  }
  if (type === 'order_status_changed') {
    return {
      subject: `Order ${payload.order_no ?? ''} status updated`,
      text: `Order ${payload.order_no ?? ''} status is now ${payload.status ?? ''}.`,
    };
  }
  if (type === 'payment_approved') {
    return {subject: 'Payment approved', text: `Your ${payload.plan ?? ''} plan payment was approved.`};
  }
  return {
    subject: 'Payment review update',
    text: `Your payment was rejected.${payload.review_note ? ` Reason: ${payload.review_note}` : ''}`,
  };
}

export function createNotificationHandler(deps: NotificationDeps = {
  createClient,
  fetchImpl: fetch,
  env: process.env,
}) {
  return async function handler(req: any, res: any) {
    if (req.method !== 'POST') return sendJson(res, 405, {error: 'Method not allowed'});
    const secret = deps.env.NOTIFICATION_WORKER_SECRET;
    if (!secret || req.headers?.authorization !== `Bearer ${secret}`) {
      return sendJson(res, 401, {error: 'Unauthorized'});
    }
    const url = deps.env.SUPABASE_URL || deps.env.VITE_SUPABASE_URL;
    const serviceKey = deps.env.SUPABASE_NOTIFICATION_WORKER_KEY;
    const resendKey = deps.env.RESEND_API_KEY;
    const from = deps.env.NOTIFICATION_EMAIL_FROM;
    if (!url || !serviceKey || !resendKey || !from) {
      return sendJson(res, 503, {error: 'Notification provider is not configured'});
    }

    const sb = deps.createClient(url, serviceKey, {auth:{persistSession:false,autoRefreshToken:false}});
    const now = new Date().toISOString();
    const {data: rows, error} = await sb
      .from('notification_outbox')
      .select('id,event_key,event_type,recipient,payload,status,attempt_count,next_attempt_at')
      .eq('channel', 'email')
      .in('status', ['pending','failed','processing'])
      .lte('next_attempt_at', now)
      .lt('attempt_count', MAX_ATTEMPTS)
      .lte('next_attempt_at', now)
      .order('created_at', {ascending:true})
      .limit(BATCH_SIZE);
    if (error) return sendJson(res, 502, {error: 'Could not load notification queue'});

    let sent = 0;
    let failed = 0;
    for (const row of rows || []) {
      const attempt = Number(row.attempt_count || 0) + 1;
      const claim = await sb
        .from('notification_outbox')
        .update({status:'processing', attempt_count:attempt, lease_until:new Date(Date.now() + 5 * 60_000).toISOString(), next_attempt_at:new Date(Date.now() + 5 * 60_000).toISOString(), last_error:null, updated_at:new Date().toISOString()})
        .eq('id', row.id)
        .in('status', ['pending','failed','processing'])
        .lte('next_attempt_at', now)
        .select('id')
        .maybeSingle();
      if (claim.error || !claim.data) continue;

      const message = renderEmail(row);
      try {
        const response = await deps.fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${resendKey}`,
            'content-type': 'application/json',
            'idempotency-key': row.event_key,
          },
          body: JSON.stringify({from, to:[row.recipient], subject:message.subject, text:message.text}),
        });
        if (!response.ok) throw new Error(`provider_http_${response.status}`);
        await sb.from('notification_outbox').update({
          status: 'sent',
          delivered_at: new Date().toISOString(),
          lease_until: null,
          last_error: null,
          updated_at: new Date().toISOString(),
        }).eq('id', row.id);
        sent += 1;
      } catch (err) {
        const terminal = attempt >= MAX_ATTEMPTS;
        const next = new Date(Date.now() + backoffMinutes(attempt) * 60_000).toISOString();
        await sb.from('notification_outbox').update({
          status: 'failed',
          next_attempt_at: next,
          lease_until: null,
          last_error: err instanceof Error ? err.message.slice(0, 200) : 'provider_error',
          updated_at: new Date().toISOString(),
        }).eq('id', row.id);
        failed += 1;
        if (terminal) continue;
      }
    }

    return sendJson(res, 200, {processed:(rows || []).length, sent, failed});
  };
}

export default createNotificationHandler();
