import { useState, useMemo } from 'react';
import { Clock, Send, Trash2, MessageSquare, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatCrmDate } from '../../../utils/helpers';
import { getCurrentUserName } from '../leadHelpers';

function parseChatTranscript(rawText) {
  if (!rawText) return [];
  const regex = /\[(\d{4}-\d{2}-\d{2}[^\]]*)\]\s*([^:]+):\s*([\s\S]*?)(?=\s*\[\d{4}-\d{2}-\d{2}|$)/g;
  const messages = [];
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const timestamp = match[1].trim();
    const sender = match[2].trim();
    const text = match[3].trim();
    if (sender || text) {
      messages.push({ timestamp, sender, text });
    }
  }

  // Fallback if not matched by regex (e.g. newline-separated lines)
  if (messages.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim());
    lines.forEach(l => {
      const lineMatch = l.match(/^\[(.*?)\]\s*(.*?):\s*(.*)$/);
      if (lineMatch) {
        messages.push({ timestamp: lineMatch[1], sender: lineMatch[2], text: lineMatch[3] });
      } else {
        messages.push({ timestamp: '', sender: '', text: l });
      }
    });
  }
  return messages;
}

function ChatTranscriptCard({ rawText, conversationId, t }) {
  const [expanded, setExpanded] = useState(true);
  const messages = useMemo(() => parseChatTranscript(rawText), [rawText]);

  if (messages.length === 0) {
    return <div className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{rawText}</div>;
  }

  return (
    <div className="mt-2 bg-gradient-to-b from-gray-50/90 to-slate-50 border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
      <div className="px-3.5 py-2 bg-gray-100/70 border-b border-gray-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare size={12} />
          </div>
          <span className="text-[11px] font-bold text-gray-800">{t('chat_transcript') || 'Chat Transcript'}</span>
          <span className="text-[10px] font-semibold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.2 rounded-full">
            {messages.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {conversationId && (
            <a
              href={`#/chats/${conversationId}`}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>{t('open_chat') || 'Open Chat'}</span>
              <ExternalLink size={10} />
            </a>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors cursor-pointer"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 max-h-72 overflow-y-auto space-y-2">
          {messages.map((msg, idx) => {
            const isManager = /manager|admin|support/i.test(msg.sender);
            return (
              <div key={idx} className={`flex flex-col ${isManager ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5 px-1 text-[10px] text-gray-400 font-medium">
                  <span className={`font-bold ${isManager ? 'text-primary' : 'text-gray-600'}`}>{msg.sender}</span>
                  {msg.timestamp && (
                    <span>• {msg.timestamp.includes(' ') ? msg.timestamp.split(' ')[1] : msg.timestamp}</span>
                  )}
                </div>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed shadow-2xs break-words ${
                    isManager
                      ? 'bg-primary text-white rounded-tr-xs'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-xs'
                  }`}
                >
                  {(() => {
                    const text = (msg.text || '').trim();
                    if (/^https?:\/\/[^\s]+$/.test(text)) {
                      return (
                        <a
                          href={text}
                          target="_blank"
                          rel="noreferrer"
                          className={`underline break-all ${isManager ? 'text-white font-semibold' : 'text-primary hover:underline'}`}
                        >
                          {text}
                        </a>
                      );
                    }
                    return <span className="whitespace-pre-wrap">{text}</span>;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LeadSidePanelComments({
  lead,
  t,
  permissions,
  createHistoryEntry,
  crmUsers,
  onUpdate,
  setConfirmAction
}) {
  const [activePanel, setActivePanel] = useState('comments');
  const [newComment, setNewComment] = useState('');

  const meta = lead.meta_data || {};

  // Support notes stored in entry_data by surfacing them in comments
  const comments = useMemo(() => {
    const list = [...(meta.comments || [])];
    if (lead.entry_data?.note && typeof lead.entry_data.note === 'string' && lead.entry_data.note.trim()) {
      const noteTrimmed = lead.entry_data.note.trim();
      const alreadyInComments = list.some(c => (c.text || '').trim() === noteTrimmed);
      if (!alreadyInComments) {
        list.unshift({
          id: 'note_from_entry',
          text: noteTrimmed,
          date: lead.created_at || new Date().toISOString(),
          author: t('note') || 'Note'
        });
      }
    }
    return list;
  }, [meta.comments, lead.entry_data?.note, lead.created_at, t]);

  const history = meta.history || [];

  const updateMeta = async (newMeta) => {
    const prevMeta = lead.meta_data;
    onUpdate({ ...lead, meta_data: newMeta });

    try {
      const res = await window.wp.apiFetch({
        path: `/qoracrm/v1/leads/${lead.id}`,
        method: 'PUT',
        data: { meta_data: newMeta }
      });
      if (res && res.lead) {
        onUpdate(res.lead);
      }
    } catch (e) {
      console.error('Error updating meta', e);
      onUpdate({ ...lead, meta_data: prevMeta });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const existing = meta.comments || [];
    const updatedComments = [...existing, {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment,
      date: new Date().toISOString(),
      author: getCurrentUserName(t)
    }];
    updateMeta({ ...meta, comments: updatedComments });
    setNewComment('');
  };

  const handleDeleteComment = (commentId) => {
    setConfirmAction({
      title: t('delete_comment') || 'Delete Comment',
      message: t('confirm_delete_comment') || 'Are you sure you want to delete this comment?',
      confirmText: t('delete') || 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        if (commentId === 'note_from_entry') {
          const updatedEntry = { ...lead.entry_data };
          delete updatedEntry.note;
          onUpdate({ ...lead, entry_data: updatedEntry });
          try {
            await window.wp.apiFetch({
              path: `/qoracrm/v1/leads/${lead.id}`,
              method: 'PUT',
              data: { entry_data: updatedEntry }
            });
          } catch (e) {
            console.error('Error clearing entry note', e);
          }
          return;
        }
        const updatedComments = (meta.comments || []).filter(c => c.id !== commentId);
        updateMeta({ ...meta, comments: updatedComments });
      }
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
      {/* Tab switcher */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActivePanel('comments')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${activePanel === 'comments' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          <Send size={12} /> {t('lead_comments')} {comments.length > 0 && `(${comments.length})`}
        </button>
        <button
          onClick={() => setActivePanel('history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${activePanel === 'history' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          <Clock size={12} /> {t('lead_history')} {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      <div className="space-y-4">
        {activePanel === 'comments' && (
          <>
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-2">{t('lead_no_comments')}</div>
              ) : (
                comments.map((comment, idx) => (
                  <div key={comment.id || idx} className="bg-gray-50/50 border border-gray-100/60 p-4 rounded-xl shadow-sm relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[11px] font-bold text-gray-500">{comment.author || (t('admin') || 'Admin')}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          {formatCrmDate(comment.date, t)}
                        </span>
                        {(permissions.is_admin || comment.author === (window.qoraCrmData?.currentUser?.name || 'Admin')) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-900 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {permissions.can_comment && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('lead_write_comment')}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-medium outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-primary text-white aspect-square w-[42px] flex items-center justify-center flex-shrink-0 rounded-xl hover:bg-primary-dark transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {activePanel === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">{t('no_history_yet') || 'No history yet.'}</div>
            ) : (
              [...history].reverse().map((entry, idx) => {
                const rawContent = entry.text || entry.note || '';
                const isChatHistory = entry.action === 'chat_transcript' || entry.author === 'Chat History' || (typeof rawContent === 'string' && rawContent.includes('[202') && (rawContent.includes('Visitor') || rawContent.includes('Manager')));

                return (
                  <div key={entry.id || idx} className="flex gap-3 items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isChatHistory ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isChatHistory ? <MessageSquare size={12} /> : <Clock size={11} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isChatHistory ? (
                        <div>
                          <div className="text-[12px] font-semibold text-gray-900 flex items-center gap-1.5">
                            <span>{t('chat_history') || 'Chat History'}</span>
                          </div>
                          <ChatTranscriptCard rawText={rawContent} conversationId={meta.conversation_id} t={t} />
                        </div>
                      ) : (
                        <div className="text-[12px] text-gray-700 leading-relaxed">
                          <span className="font-semibold text-gray-900">
                            {entry.author || entry.type}
                          </span>{' '}
                          {entry.action === 'marked_as_duplicate' ? (
                            <button
                              onClick={() => {
                                document.dispatchEvent(new CustomEvent('qoracrm_open_lead', { detail: entry.duplicate_id }));
                              }}
                              className="text-primary hover:underline font-medium"
                            >
                              {rawContent}
                            </button>
                          ) : (
                            rawContent
                          )}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 mt-0.5 block">{formatCrmDate(entry.date || entry.timestamp, t)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
