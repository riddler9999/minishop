import {createClient} from '@supabase/supabase-js';
import {mapDbError} from '../src/domain/dbError.js';
import {supabaseEnv} from './_env.js';
import {sendJson} from './_http.js';
import {clean} from './_validation.js';
import {normalizeCheckoutInput} from './checkout-input.js';
import {forwardedClientIp} from './_client-ip.js';
import {createCheckoutHandler} from './checkout-handler.js';

export default createCheckoutHandler({
  createClient: createClient as any,
  env: supabaseEnv,
  sendJson,
  clean,
  normalizeCheckoutInput,
  forwardedClientIp,
  mapDbError,
});
