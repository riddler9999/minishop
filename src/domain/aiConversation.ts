import type {AiProposal} from './aiGateway';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mediaUrls?: string[];
  proposal?: AiProposal;
  applicationStatus?: 'pending' | 'applied' | 'failed';
  appliedRevision?: string;
  applicationError?: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  shopId: string;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export function createInitialConversation(shopId: string): AiConversation {
  return {
    id: `conv_${Date.now()}`,
    shopId,
    messages: [
      {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content:
          'Welcome to the MiniShop AI Store Builder! Describe how you want your shop to look, upload product/hero pictures, or ask to re-arrange sections.',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function appendUserMessage(
  conversation: AiConversation,
  content: string,
  mediaUrls?: string[]
): {conversation: AiConversation; userMsg: AiMessage} {
  const userMsg: AiMessage = {
    id: `msg_u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    role: 'user',
    content,
    mediaUrls,
    createdAt: new Date().toISOString(),
  };
  const updated: AiConversation = {
    ...conversation,
    messages: [...conversation.messages, userMsg],
    updatedAt: new Date().toISOString(),
  };
  return {conversation: updated, userMsg};
}

export function appendAssistantProposal(
  conversation: AiConversation,
  proposal: AiProposal
): {conversation: AiConversation; assistantMsg: AiMessage} {
  const assistantMsg: AiMessage = {
    id: `msg_a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    role: 'assistant',
    content: proposal.summary,
    proposal,
    applicationStatus: 'pending',
    createdAt: new Date().toISOString(),
  };
  const updated: AiConversation = {
    ...conversation,
    messages: [...conversation.messages, assistantMsg],
    updatedAt: new Date().toISOString(),
  };
  return {conversation: updated, assistantMsg};
}

/** Track local application separately from successful draft persistence. */
export function setProposalApplicationStatus(
  conversation: AiConversation,
  proposalId: string,
  status: 'applied' | 'failed',
  details: {revision?: string; error?: string} = {},
): AiConversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.proposal?.id === proposalId
        ? {
            ...message,
            applicationStatus: status,
            appliedRevision: status === 'applied' ? details.revision : undefined,
            applicationError: status === 'failed' ? details.error : undefined,
          }
        : message,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export type ProposalPresentation = {
  kind: 'pending' | 'success' | 'failed' | 'superseded' | 'confirmation';
  label: string;
  detail: string;
};

/** Never describe a locally edited document as saved before autosave succeeds. */
export function getProposalPresentation(
  message: AiMessage,
  currentRevision: string,
  saveStatus: 'saved' | 'dirty' | 'saving' | 'retry' | 'conflict',
): ProposalPresentation {
  if (message.applicationStatus === 'failed') {
    return {
      kind: 'failed',
      label: 'Apply Failed',
      detail: message.applicationError || 'AI could not apply this change. Request a new suggestion.',
    };
  }
  if (message.applicationStatus === 'applied') {
    if (!message.appliedRevision || message.appliedRevision !== currentRevision) {
      return {
        kind: 'superseded',
        label: 'Superseded by Newer Edits',
        detail: 'The draft has changed since this proposal. Check the latest preview.',
      };
    }
    if (saveStatus === 'saved') {
      return {kind: 'success', label: 'Saved to Draft', detail: 'Draft saved — preview updated.'};
    }
    if (saveStatus === 'conflict') {
      return {kind: 'failed', label: 'Save Conflict', detail: 'Another session changed the draft. Reload to resolve.'};
    }
    if (saveStatus === 'retry') {
      return {kind: 'failed', label: 'Draft Save Failed', detail: 'The change is local only. Use Retry to save it.'};
    }
    return {kind: 'pending', label: 'Applied Locally', detail: 'Preview updated. Waiting for the draft to save.'};
  }
  if (message.proposal?.isDestructive) {
    return {
      kind: 'confirmation',
      label: 'Confirmation Required',
      detail: 'Review and confirm this potentially destructive change.',
    };
  }
  return {kind: 'pending', label: 'Pending Application', detail: 'Waiting for successful validation and application.'};
}
