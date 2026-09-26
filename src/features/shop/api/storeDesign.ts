import {requireSupabase} from '@/core/supabase/client';
import {createStoreDesignLifecycleAdapter} from './storeDesignAdapter';

type RpcResult = Promise<{data: unknown; error: unknown}>;

export {StoreDesignConflictError, createStoreDesignLifecycleAdapter} from './storeDesignAdapter';
export type {StoreDesignRpcClient} from './storeDesignAdapter';

export const storeDesignAdminApi = createStoreDesignLifecycleAdapter({
  rpc(fn, args) {
    const supabase = requireSupabase();
    return supabase.rpc(fn as never, args as never) as unknown as RpcResult;
  },
});
