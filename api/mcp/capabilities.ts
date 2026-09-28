import type {MiniShopCapability, SellerContext} from './contracts.ts';
import {McpError} from './errors.ts';

export function requireCapability(context: SellerContext, capability: MiniShopCapability): void {
  if (!context.capabilities.has(capability)) {
    throw new McpError('INSUFFICIENT_SCOPE', 403, 'This MiniShop capability is required.');
  }
}
