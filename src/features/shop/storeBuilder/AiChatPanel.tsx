import {useState, useRef, useEffect} from 'react';
import {
  Send,
  Paperclip,
  X,
  Bot,
  User,
  Sparkles,
  Check,
  Undo2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type {AiConversation} from '@/domain/aiConversation';
import type {AiProposal} from '@/domain/aiGateway';
import {adminApi} from '@/data/dataSource';

interface Props {
  conversation: AiConversation;
  disabled?: boolean;
  onSendMessage: (prompt: string, media: {id: string; url: string}[]) => Promise<void>;
  onApplyProposal: (proposal: AiProposal) => void;
  onUndoLastEdit: () => void;
  canUndo: boolean;
}

export function AiChatPanel({
  conversation,
  disabled,
  onSendMessage,
  onApplyProposal,
  onUndoLastEdit,
  canUndo,
}: Props) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<{id: string; url: string; name: string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [confirmingDestructive, setConfirmingDestructive] = useState<AiProposal | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [conversation.messages]);

  async function handleFileAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const media = await adminApi.uploadStoreMedia(file);
        const url = media.url || media.storagePath;
        setAttachedMedia((prev) => [...prev, {id: media.id, url, name: file.name}]);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to attach image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleRemoveAttachedMedia(index: number) {
    setAttachedMedia((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!inputPrompt.trim() && attachedMedia.length === 0) || sending || disabled) return;
    const promptText = inputPrompt.trim() || 'Use attached image for section';

    setSending(true);

    try {
      await onSendMessage(promptText, attachedMedia);
      setInputPrompt('');
      setAttachedMedia([]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to process AI command');
    } finally {
      setSending(false);
    }
  }

  function applyProposal(proposal: AiProposal) {
    try {
      applyProposal(proposal);
      setApplyError(null);
      setConfirmingDestructive(null);
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : 'Unable to apply AI changes');
    }
  }

  function handleApplyClick(proposal: AiProposal) {
    if (proposal.isDestructive) {
      setConfirmingDestructive(proposal);
    } else {
      onApplyProposal(proposal);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-[var(--admin-border)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--admin-primary-soft)] text-[var(--admin-primary-hover)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--admin-text)]">AI Store Assistant</h2>
            <p className="text-[11px] text-[var(--admin-muted)]">Draft-only • Explicit Publish</p>
          </div>
        </div>

        {canUndo && (
          <button
            type="button"
            onClick={onUndoLastEdit}
            title="Undo last edit"
            className="flex items-center gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-2.5 py-1.5 text-xs font-semibold text-[var(--admin-text)] hover:bg-white transition">
            <Undo2 className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
            Undo Edit
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-sm ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-[var(--admin-text)] text-white'
                  : 'bg-[var(--admin-primary)] text-[var(--admin-text)]'
              }`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className={`space-y-2 max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-[var(--admin-text)] text-white rounded-tr-none'
                    : 'bg-[var(--admin-surface-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-tl-none'
                }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Media Attachments */}
                {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.mediaUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Attached media"
                        className="h-20 w-20 rounded-lg border border-[var(--admin-border)] object-cover bg-white"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Proposal Card if present */}
              {msg.proposal && (
                <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-primary-soft)] p-3 text-left space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--admin-primary-hover)] flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Proposed Changes
                    </span>
                    <span className="text-[10px] text-[var(--admin-muted)] font-mono">
                      {msg.proposal.commands.length} command(s)
                    </span>
                  </div>

                  <p className="text-xs font-medium text-[var(--admin-text)] leading-snug">
                    {msg.proposal.summary}
                  </p>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyClick(msg.proposal!)}
                      className="flex items-center gap-1 rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-bold text-[var(--admin-text)] hover:bg-[var(--admin-primary-hover)] transition">
                      <Check className="h-3.5 w-3.5" />
                      Apply to Draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {applyError && <p role="alert" className="text-xs text-red-700">{applyError}</p>}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-[var(--admin-muted)] italic">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-primary-hover)]" />
            AI Assistant is generating storefront proposal...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Confirmation Modal for Destructive Actions */}
      {confirmingDestructive && (
        <div className="border-t border-[var(--admin-border)] bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            Confirm Destructive Section Removal
          </div>
          <p>This proposal will remove section(s) from your draft layout. Confirm applying?</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                applyProposal(confirmingDestructive);
              }}
              className="rounded-lg bg-amber-800 px-3 py-1 font-bold text-white hover:bg-amber-900">
              Confirm &amp; Apply
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDestructive(null)}
              className="rounded-lg border border-amber-300 px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Media Attachment Previews before sending */}
      {attachedMedia.length > 0 && (
        <div className="border-t border-[var(--admin-border)] px-4 py-2 flex items-center gap-2 overflow-x-auto bg-[var(--admin-surface-muted)]">
          {attachedMedia.map((m, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img src={m.url} alt="Attached preview" className="h-12 w-12 rounded-lg object-cover border" />
              <button
                type="button"
                onClick={() => handleRemoveAttachedMedia(idx)}
                className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-black text-white text-[10px]">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-[var(--admin-border)] p-3 space-y-2">
        <div className="relative flex items-center">
          <label className="grid h-9 w-9 cursor-pointer place-items-center text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-primary-hover)]" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled || uploading || sending}
              onChange={handleFileAttach}
              className="sr-only"
            />
          </label>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={disabled || sending}
            placeholder="Ask AI to change colors, hero text, section order..."
            className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-canvas)] py-2.5 pl-2 pr-10 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-primary)] focus:ring-1 focus:ring-[var(--admin-primary)]"
          />

          <button
            type="submit"
            disabled={disabled || sending || (!inputPrompt.trim() && attachedMedia.length === 0)}
            className="absolute right-2 grid h-7 w-7 place-items-center rounded-lg bg-[var(--admin-primary)] text-[var(--admin-text)] hover:bg-[var(--admin-primary-hover)] transition disabled:opacity-40">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-[var(--admin-muted)] text-center">
          Tip: Upload images and say "Use this as my hero image".
        </p>
      </form>
    </div>
  );
}
