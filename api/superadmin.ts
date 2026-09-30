import {sendJson} from './_http.js';
import {clean} from './_validation.js';
import {mapDbError} from '../src/domain/dbError.js';
import {requireSuperadmin} from './_superadmin.js';

const ACTIONS = new Set(['approve-application','reject-application','activate','renew','upgrade','downgrade','cancel','credit-pack','reject-pack','toggle-shop']);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

type SuperadminDeps = {
  requireAccess: typeof requireSuperadmin;
};

function pageSize(input: unknown): number {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(parsed)));
}

function encodeCursor(row: any): string | null {
  if (!row?.created_at) return null;
  return Buffer.from(JSON.stringify({created_at: row.created_at, id: row.id ?? row.owner_id ?? row.shop_id ?? null})).toString('base64url');
}

function decodeCursor(raw: unknown): {created_at: string; id: string | null} | null {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    return typeof parsed?.created_at === 'string' ? {created_at: parsed.created_at, id: typeof parsed.id === 'string' ? parsed.id : null} : null;
  } catch {
    return null;
  }
}

async function getPage(sb: any, table: string, selection: string, limit: number, cursorRaw: unknown, status?: string) {
  const cursor = decodeCursor(cursorRaw);
  let q = sb.from(table).select(selection);
  if (status) q = q.eq('status', status);
  if (cursor) q = q.lt('created_at', cursor.created_at);
  q = q.order('created_at', {ascending:false}).limit(limit + 1);
  const {data, error} = await q;
  const rows = data ?? [];
  return {
    rows: rows.slice(0, limit),
    error,
    nextCursor: rows.length > limit ? encodeCursor(rows[limit - 1]) : null,
  };
}

async function countRows(sb: any, table: string, filter?: {column: string; value: unknown}) {
  let q = sb.from(table).select('*', {count:'exact', head:true});
  if (filter) q = q.eq(filter.column, filter.value);
  const {count, error} = await q.limit(1);
  return {count: count ?? 0, error};
}

async function sumApproved(sb: any, table: string) {
  let cursor: string | null = null;
  let total = 0;
  for (let i = 0; i < 100; i++) {
    const page = await getPage(sb, table, 'id,owner_id,amount,status,created_at', 100, cursor, 'approved');
    if (page.error) return {total:0, error:page.error};
    total += page.rows.reduce((sum:number,row:any)=>sum+Number(row.amount||0),0);
    if (!page.nextCursor) return {total, error:null};
    cursor = page.nextCursor;
  }
  return {total:0, error:new Error('Aggregate page bound exceeded')};
}

export function createSuperadminHandler(
  deps: SuperadminDeps = {requireAccess: requireSuperadmin},
) {
  return async function handler(req: any, res: any) {
  const access = await deps.requireAccess(req);
  if ('error' in access) return sendJson(res, access.status ?? 403, {error: access.error});
  const sb = access.admin;

  if (req.method === 'GET') {
    const q = req.query || {};
    const proofType = clean(q.proofType, 30);
    const proofId = clean(q.proofId, 100);
    if (proofType && proofId) {
      const table = proofType === 'application' ? 'shop_applications' : proofType === 'pack' ? 'order_pack_purchases' : '';
      const idColumn = proofType === 'application' ? 'owner_id' : 'id';
      if (!table) return sendJson(res, 400, {error:'Invalid proof type'});
      const {data, error} = await sb.from(table).select(`${idColumn},screenshot_path`).eq(idColumn, proofId).limit(1);
      if (error) return sendJson(res, 502, {error:'Could not load proof'});
      const row = (data || [])[0];
      if (!row?.screenshot_path) return sendJson(res, 404, {error:'Proof not found'});
      const signed = await sb.storage.from('payment-proofs').createSignedUrl(row.screenshot_path, 300);
      return sendJson(res, 200, {proofUrl:signed.data?.signedUrl || null});
    }

    const limit = pageSize(q.limit);
    const [
      shopsPage, applicationsPage, packsPage,
      shopCount, activeShopCount, pendingApplications, pendingPacks,
      appRevenue, packRevenue,
    ] = await Promise.all([
      getPage(sb,'shops','id,name,slug,owner_id,plan,is_active,seller_is_active,platform_suspended,created_at,updated_at',limit,q.shopsCursor),
      getPage(sb,'shop_applications','owner_id,plan,amount,payment_method,payment_ref_tail,screenshot_path,status,created_at,reviewed_at,review_note',limit,q.applicationsCursor,'pending'),
      getPage(sb,'order_pack_purchases','id,shop_id,qty,amount,payment_method,payment_ref_tail,screenshot_path,status,created_at,reviewed_at',limit,q.packsCursor,'pending'),
      countRows(sb,'shops'),
      countRows(sb,'shops',{column:'is_active',value:true}),
      countRows(sb,'shop_applications',{column:'status',value:'pending'}),
      countRows(sb,'order_pack_purchases',{column:'status',value:'pending'}),
      sumApproved(sb,'shop_applications'),
      sumApproved(sb,'order_pack_purchases'),
    ]);
    const errors = [shopsPage.error, applicationsPage.error, packsPage.error, shopCount.error, activeShopCount.error, pendingApplications.error, pendingPacks.error, appRevenue.error, packRevenue.error].filter(Boolean);
    if (errors.length) return sendJson(res, 502, {error:'Could not load platform data'});

    const shopIds = shopsPage.rows.map((s:any)=>s.id);
    let entitlements:any[] = [];
    if (shopIds.length) {
      const {data, error} = await sb.from('shop_entitlements')
        .select('shop_id,plan,active,monthly_quota,monthly_used,purchased_balance,cycle_end,pending_plan,updated_at')
        .in('shop_id', shopIds)
        .limit(limit);
      if (error) return sendJson(res, 502, {error:'Could not load platform data'});
      entitlements = data || [];
    }

    return sendJson(res, 200, {
      metrics:{
        shops:shopCount.count,
        activeShops:activeShopCount.count,
        pendingApplications:pendingApplications.count,
        pendingOrderPacks:pendingPacks.count,
        recordedRevenue:appRevenue.total+packRevenue.total,
      },
      shops:shopsPage.rows,
      applications:applicationsPage.rows,
      packs:packsPage.rows,
      entitlements,
      page:{
        limit,
        shops:{nextCursor:shopsPage.nextCursor},
        applications:{nextCursor:applicationsPage.nextCursor},
        packs:{nextCursor:packsPage.nextCursor},
      },
    });
  }

  if (req.method !== 'POST') return sendJson(res, 405, {error: 'Method not allowed'});
  const body = req.body || {};
  const action = clean(body.action, 40);
  if (!ACTIONS.has(action)) return sendJson(res, 400, {error: 'Invalid action'});
  const shopId = clean(body.shopId, 80);
  const paymentIdentity = clean(body.paymentIdentity, 160) || null;
  const idempotencyKey = clean(body.idempotencyKey, 80) || null;
  const transactionIdInput = String(body.transactionId ?? '').trim();
  const transactionId =
    transactionIdInput && transactionIdInput.length <= 160 ? transactionIdInput : null;

  let error: any = null;
  let data: any = null;
  if (action === 'approve-application' || action === 'reject-application') {
    const ownerId = clean(body.ownerId, 80);
    if (!ownerId) return sendJson(res, 400, {error:'Missing owner'});
    const status = action === 'approve-application' ? 'approved' : 'rejected';
    ({error} = await sb.from('shop_applications').update({status, reviewed_at: new Date().toISOString(), review_note: clean(body.note, 500) || null}).eq('owner_id', ownerId).eq('status','pending'));
  } else if (action === 'activate') {
    const plan = clean(body.plan, 30);
    if (!shopId || !['starter','business'].includes(plan)) return sendJson(res, 400, {error:'Invalid activation'});
    if (!paymentIdentity || !idempotencyKey) return sendJson(res, 400, {error:'Payment identity and idempotency key are required'});
    ({data, error} = await sb.rpc('admin_activate_subscription', {p_shop_id: shopId, p_plan: plan, p_payment_identity: paymentIdentity, p_idempotency_key: idempotencyKey}));
  } else if (action === 'renew') {
    if (!shopId) return sendJson(res, 400, {error:'Missing shop'});
    if (!paymentIdentity || !idempotencyKey) return sendJson(res, 400, {error:'Payment identity and idempotency key are required'});
    ({data, error} = await sb.rpc('admin_renew_subscription', {p_shop_id: shopId, p_payment_identity: paymentIdentity, p_idempotency_key: idempotencyKey}));
  } else if (action === 'upgrade') {
    if (!shopId) return sendJson(res, 400, {error:'Missing shop'});
    if (!paymentIdentity || !idempotencyKey) return sendJson(res, 400, {error:'Payment identity and idempotency key are required'});
    ({data, error} = await sb.rpc('admin_upgrade_plan', {p_shop_id: shopId, p_payment_identity: paymentIdentity, p_idempotency_key: idempotencyKey}));
  } else if (action === 'downgrade') {
    const plan = clean(body.plan, 30);
    if (!shopId || !['free_trial','starter'].includes(plan)) return sendJson(res, 400, {error:'Invalid downgrade'});
    ({error} = await sb.rpc('admin_schedule_downgrade', {p_shop_id: shopId, p_target_plan: plan}));
  } else if (action === 'cancel') {
    if (!shopId) return sendJson(res, 400, {error:'Missing shop'});
    ({error} = await sb.rpc('admin_cancel_subscription', {p_shop_id: shopId}));
  } else if (action === 'credit-pack') {
    const purchaseId = clean(body.purchaseId, 80);
    const packPaymentIdentity = paymentIdentity || transactionId;
    if (!purchaseId || !packPaymentIdentity || !idempotencyKey) return sendJson(res, 400, {error:'Missing purchase, payment identity, or idempotency key'});
    ({data, error} = await sb.rpc('admin_credit_order_pack', {p_purchase_id: purchaseId, p_payment_identity: packPaymentIdentity, p_idempotency_key: idempotencyKey}));
  } else if (action === 'reject-pack') {
    const purchaseId = clean(body.purchaseId, 80);
    if (!purchaseId) return sendJson(res, 400, {error:'Missing purchase'});
    ({error} = await sb.from('order_pack_purchases').update({status:'rejected', reviewed_at:new Date().toISOString(), review_note: clean(body.note,500)||null}).eq('id',purchaseId).eq('status','pending'));
  } else if (action === 'toggle-shop') {
    if (!shopId || typeof body.active !== 'boolean') return sendJson(res, 400, {error:'Invalid shop state'});
    ({error} = await sb.from('shops').update({platform_suspended: !body.active}).eq('id', shopId));
  }

  if (error) return sendJson(res, 400, {error: mapDbError(error.message, 'Action failed')});
  return sendJson(res, 200, data && typeof data === 'object' ? data : {ok: true});
  };
}

export default createSuperadminHandler();
