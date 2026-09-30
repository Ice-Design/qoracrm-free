export const getDefaultStatuses = (t) => [
  { id: 'new',      label: t('status_new')      || 'New Lead',   color: '#3B82F6', is_system: true },
  { id: 'complete', label: t('status_complete')  || 'Completed',  color: '#10b981', is_system: true, is_converted: true },
];

export const getDefaultTags = (t) => [
  { id: 'hot', label: t('tag_hot') || 'Hot', color: '#EF4444' },
  { id: 'cold', label: t('tag_cold') || 'Cold', color: '#3B82F6' }
];

export const getPermissions = () => window.qoraCrmData?.permissions || {
  is_admin: true, can_edit_fields: true, can_edit_status_tags: true, can_delete: true, can_comment: true, can_assign: true
};

export const getCurrentUserName = (t) => {
  return window.qoraCrmData?.currentUser?.name || window.wpApiSettings?.currentUser?.name || (t ? t('admin') : 'Admin');
};

export const createHistoryEntry = (text, t) => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'system',
  text,
  author: getCurrentUserName(t),
  date: new Date().toISOString(),
});

/**
 * Triggers a global event to refresh a specific lead (and/or all leads on the board).
 */
export const notifyLeadUpdated = (leadId, options = {}) => {
  if (!leadId) return;
  const { refreshAll = false, lead = null } = options;
  window.dispatchEvent(new CustomEvent('qoracrm-lead-updated', {
    detail: { leadId, refreshAll, lead }
  }));
};

/**
 * Triggers a global event to refresh all leads on the board.
 */
export const refreshAllLeads = () => {
  window.dispatchEvent(new CustomEvent('qoracrm-refresh-leads'));
};

/**
 * React hook to interact with lead and board synchronization
 */
export const useLeadSync = () => {
  return {
    syncLead: (leadId, options) => notifyLeadUpdated(leadId, options),
    syncAllLeads: () => refreshAllLeads(),
  };
};
