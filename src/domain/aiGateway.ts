import type {AiStoreCommand} from './storeDesign/aiCommands';

export interface AiProposal {
  id: string;
  userPrompt: string;
  summary: string;
  commands: AiStoreCommand[];
  createdAt: string;
  isDestructive?: boolean;
  trustedMedia?: Record<string, string>;
  baseRevision: string;
}
