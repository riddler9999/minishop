import {McpError} from './errors.js';

export interface CursorPayload {createdAt:string;id:string}

export function normalizePageSize(value: unknown): number {
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0) return 25;
  return Math.min(Math.floor(n),100);
}
export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload),'utf8').toString('base64url');
}
export function decodeCursor(value: string): CursorPayload {
  try{
    const parsed=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
    if(!parsed||typeof parsed.createdAt!=='string'||typeof parsed.id!=='string') throw new Error();
    const timestamp=Date.parse(parsed.createdAt);
    if(!Number.isFinite(timestamp)||! /^[A-Za-z0-9_-]{1,128}$/.test(parsed.id)) throw new Error();
    return {createdAt:new Date(timestamp).toISOString(),id:parsed.id};
  }catch{
    throw new McpError('INVALID_CURSOR',400,'Invalid cursor.');
  }
}
export function validateDateRange(start:string,end:string): {start:string;end:string} {
  const a=Date.parse(start), b=Date.parse(end);
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>b||b-a>366*24*60*60*1000) {
    throw new McpError('INVALID_DATE_RANGE',400,'Invalid date range.');
  }
  return {start:new Date(a).toISOString(),end:new Date(b).toISOString()};
}
