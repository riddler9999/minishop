import type {AiProposal} from './aiGateway';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mediaUrls?: string[];
  proposal?: AiProposal;
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
    createdAt: new Date().toISOString(),
  };
  const updated: AiConversation = {
    ...conversation,
    messages: [...conversation.messages, assistantMsg],
    updatedAt: new Date().toISOString(),
  };
  return {conversation: updated, assistantMsg};
}
