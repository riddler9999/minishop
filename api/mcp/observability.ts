import type {AuditSink} from './contracts.ts';

export const noOpAuditSink: AuditSink = {
  async record() {},
};
