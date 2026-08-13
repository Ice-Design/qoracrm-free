import { useState } from 'react';
import { Clock, Send, Trash2 } from 'lucide-react';
import { formatCrmDate } from '../../../utils/helpers';
import { getCurrentUserName } from '../leadHelpers';

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
  const comments = meta.comments || [];
  const history = meta.history || [];

  const updateMeta = async (newMeta) => {
    try {
      await window.wp.apiFetch({
        path: `/qoracrm/v1/leads/${lead.id}`,
        method: 'PUT',
        data: { meta_data: newMeta }
      });
      onUpdate({ ...lead, meta_data: newMeta });
    } catch (e) {
      console.error('Error updating meta', e);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const updatedComments = [...comments, {
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
      onConfirm: () => {
        const updatedComments = comments.filter(c => c.id !== commentId);
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
              [...history].reverse().map((entry, idx) => (
                <div key={entry.id || idx} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={11} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
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
                          {entry.text || entry.note}
                        </button>
                      ) : (
                        entry.text || entry.note
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{formatCrmDate(entry.date || entry.timestamp, t)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
