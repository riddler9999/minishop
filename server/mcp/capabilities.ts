import type {MiniShopCapability, SellerContext} from './contracts.js';
import {McpError} from './errors.js';

export function requireCapability(context: SellerContext, capability: MiniShopCapability): void {
  if (!context.capabilities.has(capability)) {
    throw new McpError('INSUFFICIENT_SCOPE', 403, 'This MiniShop capability is required.');
  }
}
