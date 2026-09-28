type PublishedDesignResult =
  | {ok: true; document: unknown}
  | {ok: false};

type StorefrontDesignClient = {
  rpc(name: string, args: {p_shop_slug: string}): Promise<{data: any; error: any}>;
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{data: any; error: any}>;
      };
    };
  };
};

function isUndeployedLifecycleRpc(error: any): boolean {
  const code = String(error?.code ?? '');
  return code === 'PGRST202' || code === '42883';
}

/**
 * Controlled buyer Store Design read.
 * - lifecycle Published is authoritative when the lifecycle row exists
 * - lifecycle row absence falls back to legacy shops.theme during migration
 * - an undeployed lifecycle RPC also falls back to legacy shops.theme so the
 *   compatibility period works before migration 0024 is applied
 * - all other RPC failures fail closed and never silently serve stale legacy data
 */
export async function loadBuyerStoreDesign(
  sb: StorefrontDesignClient,
  input: {shopId: string; shopSlug: string},
): Promise<PublishedDesignResult> {
  const {data: published, error: publishedError} = await sb.rpc(
    'load_published_store_design',
    {p_shop_slug: input.shopSlug},
  );

  if (publishedError && !isUndeployedLifecycleRpc(publishedError)) return {ok: false};
  // The RPC returns null only when no lifecycle row exists. Once a row exists,
  // even an explicitly-null Published document is authoritative and must not
  // resurrect the legacy shops.theme value.
  if (!publishedError && published !== null && published !== undefined) {
    return {ok: true, document: published.document ?? null};
  }

  const {data: legacyRow, error: legacyError} = await sb
    .from('shops')
    .select('theme')
    .eq('id', input.shopId)
    .maybeSingle();

  if (legacyError || !legacyRow) return {ok: false};
  return {ok: true, document: legacyRow.theme ?? null};
}
