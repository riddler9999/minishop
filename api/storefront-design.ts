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

/**
 * Controlled buyer Store Design read.
 * - lifecycle Published is authoritative when present
 * - lifecycle absence falls back to legacy shops.theme during migration
 * - RPC failures fail closed and never silently serve stale legacy data
 */
export async function loadBuyerStoreDesign(
  sb: StorefrontDesignClient,
  input: {shopId: string; shopSlug: string},
): Promise<PublishedDesignResult> {
  const {data: published, error: publishedError} = await sb.rpc(
    'load_published_store_design',
    {p_shop_slug: input.shopSlug},
  );

  if (publishedError) return {ok: false};
  if (published?.document) return {ok: true, document: published.document};

  const {data: legacyRow, error: legacyError} = await sb
    .from('shops')
    .select('theme')
    .eq('id', input.shopId)
    .maybeSingle();

  if (legacyError || !legacyRow) return {ok: false};
  return {ok: true, document: legacyRow.theme ?? null};
}
