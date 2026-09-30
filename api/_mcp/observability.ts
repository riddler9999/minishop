import type {AuditSink} from './contracts.js';

export const noOpAuditSink: AuditSink = {
  async record() {},
};
