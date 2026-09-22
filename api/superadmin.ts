import {sendJson} from './_http.js';
import {clean} from './_validation.js';
import {requireSuperadmin} from './_superadmin.js';

const ACTIONS = new Set(['activate','renew','upgrade','downgrade','cancel','credit-pack','toggle-shop']);

export default async function handler(req: any, res: any) {
  const access = await requireSuperadmin(req);
  if ('error' in access) return sendJson(res, access.status, {error: access.error});
  const sb = access.admin;

  if (req.method === 'GET') {
    const [{data: shops, error: se}, {data: applications, error: ae}, {data: packs, error: pe}, {data: entitlements, error: ee}] = await Promise.all([
      sb.from('shops').select('id,name,slug,owner_id,plan,is_active,created_at,updated_at').order('created_at', {ascending:false}).limit(500),
      sb.from('shop_applications').select('owner_id,plan,amount,payment_method,payment_ref_tail,screenshot_path,status,created_at,reviewed_at,review_note').order('created_at', {ascending:false}).limit(200),
      sb.from('order_pack_purchases').select('id,shop_id,qty,amount,payment_method,payment_ref_tail,screenshot_path,status,created_at,reviewed_at').order('created_at', {ascending:false}).limit(200),
      sb.from('shop_entitlements').select('shop_id,plan,active,monthly_quota,monthly_used,purchased_balance,cycle_end,pending_plan,updated_at').limit(500),
    ]);
    if (se || ae || pe || ee) return sendJson(res, 502, {error: 'Could not load platform data'});
    const totalRevenue = [...(applications || []), ...(packs || [])]
      .filter((x: any) => x.status === 'approved')
      .reduce((sum: number, x: any) => sum + Number(x.amount || 0), 0);
    return sendJson(res, 200, {
      metrics: {
        shops: shops?.length || 0,
        activeShops: (shops || []).filter((s: any) => s.is_active).length,
        pendingApplications: (applications || []).filter((a: any) => a.status === 'pending').length,
        pendingOrderPacks: (packs || []).filter((p: any) => p.status === 'pending').length,
        recordedRevenue: totalRevenue,
      },
      shops: shops || [], applications: applications || [], packs: packs || [], entitlements: entitlements || [],
    });
  }

  if (req.method !== 'POST') return sendJson(res, 405, {error: 'Method not allowed'});
  const body = req.body || {};
  const action = clean(body.action, 40);
  if (!ACTIONS.has(action)) return sendJson(res, 400, {error: 'Invalid action'});
  const shopId = clean(body.shopId, 80);
  const paymentRef = clean(body.paymentRef, 120) || null;

  let error: any = null;
  if (action === 'activate') {
    const plan = clean(body.plan, 30);
    if (!shopId || !['starter','business'].includes(plan)) return sendJson(res, 400, {error:'Invalid activation'});
    ({error} = await sb.rpc('admin_activate_subscription', {p_shop_id: shopId, p_plan: plan, p_payment_ref: paymentRef}));
  } else if (action === 'renew') {
    if (!shopId) return sendJson(res, 400, {error:'Missing shop'});
    ({error} = await sb.rpc('admin_renew_subscription', {p_shop_id: shopId, p_payment_ref: paymentRef}));
  } else if (action === 'upgrade') {
    if (!shopId) return sendJson(res, 400, {error:'Missing shop'});
    ({error} = await sb.rpc('admin_upgrade_plan', {p_shop_id: shopId, p_payment_ref: paymentRef}));
  } else if (action === 'downgrade') {
    const plan = clean(body.plan, 30);
    if (!shopId || !['free_trial','starter'].includes(plan)) return sendJson(res, 400, {error:'Invalid downgrade'});
    ({error} = await sb.rpc('admin_schedule_downgrade', {p_shop_id: shopId, p_target_plan: plan}));
  } else if (action === 'cancel') {
    if (!shopId) return sendJson(res, 400, {error:'Missing shop'});
    ({error} = await sb.rpc('admin_cancel_subscription', {p_shop_id: shopId}));
  } else if (action === 'credit-pack') {
    const purchaseId = clean(body.purchaseId, 80);
    if (!purchaseId) return sendJson(res, 400, {error:'Missing purchase'});
    ({error} = await sb.rpc('admin_credit_order_pack', {p_purchase_id: purchaseId}));
  } else if (action === 'toggle-shop') {
    if (!shopId || typeof body.active !== 'boolean') return sendJson(res, 400, {error:'Invalid shop state'});
    ({error} = await sb.from('shops').update({is_active: body.active}).eq('id', shopId));
  }

  if (error) return sendJson(res, 400, {error: error.message || 'Action failed'});
  return sendJson(res, 200, {ok: true});
}
