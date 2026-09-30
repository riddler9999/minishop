export type McpErrorCode =
  | 'AUTH_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'INSUFFICIENT_SCOPE'
  | 'SHOP_NOT_FOUND'
  | 'STORE_DESIGN_CONFLICT'
  | 'INVALID_SECTION'
  | 'UNSUPPORTED_TEMPLATE'
  | 'INVALID_PRODUCT_SOURCE'
  | 'PUBLISH_VALIDATION_FAILED'
  | 'INVALID_DATE_RANGE'
  | 'INVALID_CURSOR'
  | 'INVALID_ARGUMENTS'
  | 'RESOURCE_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export class McpError extends Error {
  readonly code: McpErrorCode;
  readonly status: number;
  readonly requestId?: string;

  constructor(
    code: McpErrorCode,
    status: number,
    message: string,
    requestId?: string,
  ) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function toSafeMcpError(error: unknown, requestId: string): McpError {
  if (error instanceof McpError) {
    return new McpError(error.code, error.status, error.message, requestId);
  }
  return new McpError('INTERNAL_ERROR', 500, 'MiniShop MCP request failed.', requestId);
}
