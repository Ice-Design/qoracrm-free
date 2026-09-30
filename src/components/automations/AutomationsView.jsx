import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Zap, Play, Pause, Trash2, Edit2, Clock,
  CheckCircle2, XCircle, Loader2, BarChart2, ChevronRight,
  FileText, AlertTriangle, ToggleLeft, ToggleRight, Copy, FlaskConical
} from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';
import { useFeature } from '../../hooks/useFeature';
import { NodeWorkflowBuilder } from './NodeWorkflowBuilder';
import { AutomationLogs } from './AutomationLogs';

const TRIGGER_LABELS = {
  form_submitted: { label: 'Form Submitted', color: '#6366f1', icon: '📋' },
  lead_created: { label: 'Lead Created', color: '#10b981', icon: '✨' },
  lead_status_changed: { label: 'Status Changed', color: '#f59e0b', icon: '🔄' },
  lead_tag_added: { label: 'Tag Added', color: '#8b5cf6', icon: '🏷️' },
  cron_schedule: { label: 'Scheduled', color: '#ec4899', icon: '⏱️' },
  webhook_received: { label: 'Incoming Webhook', color: '#0ea5e9', icon: '🔌' },
  stripe_payment: { label: 'Stripe Payment', color: '#22c55e', icon: '💳' },
};

export function AutomationsView({ openUpgradeModal, routeAutomationId, activeView, navigate }) {
  const { t } = useI18n();
  const { isPro } = useFeature();

  const [activeTab, setActiveTab] = useState('workflows'); // 'workflows' | 'logs'
  const [automations, setAutomations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [directAutomation, setDirectAutomation] = useState(null);
  const [logsForId, setLogsForId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [testingId, setTestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchAutomations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await window.wp?.apiFetch?.({ path: '/qoracrm/v1/automations' });
      const list = Array.isArray(res) ? res : (res?.automations || []);
      setAutomations(list);
    } catch (e) {
      showToast(e.message || 'Failed to load automations.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // Deep-linking / Routing logic:
  useEffect(() => {
    if (activeView === 'builder' || routeAutomationId) {
      if (routeAutomationId === 'new') {
        setEditingId(null);
        setDirectAutomation(null);
        setBuilderOpen(true);
      } else if (routeAutomationId && !isNaN(Number(routeAutomationId))) {
        const numId = Number(routeAutomationId);
        setEditingId(numId);
        setBuilderOpen(true);
        if (directAutomation && directAutomation.id === numId) {
          return;
        }
        const existing = automations.find(a => a.id === numId);
        if (existing) {
          setDirectAutomation(existing);
        } else {
          window.wp?.apiFetch?.({ path: `/qoracrm/v1/automations/${numId}` })
            .then(res => {
              if (res?.automation) {
                setDirectAutomation(res.automation);
              }
            })
            .catch((err) => {
              showToast(err.message || 'Workflow not found.', 'error');
              closeBuilder();
            });
        }
      }
    }
  }, [routeAutomationId, activeView]);

  // ── Actions ──────────────────────────────────────────────────────────

  const handleToggle = async (automation) => {
    try {
      const res = await window.wp?.apiFetch?.({
        path: `/qoracrm/v1/automations/${automation.id}/toggle`,
        method: 'PATCH',
      });
      setAutomations(prev => prev.map(a => a.id === automation.id ? res.automation : a));
      showToast(res.automation.is_active
        ? (t('automation_activated') || 'Automation activated')
        : (t('automation_paused') || 'Automation paused'));
    } catch (e) {
      showToast(e.message || 'Failed to toggle.', 'error');
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async (id) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await window.wp?.apiFetch?.({ path: `/qoracrm/v1/automations/${id}`, method: 'DELETE' });
      setAutomations(prev => prev.filter(a => a.id !== id));
      showToast(t('automation_deleted') || 'Automation deleted.');
    } catch (e) {
      showToast(e.message || 'Failed to delete.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestRun = async (automation) => {
    setTestingId(automation.id);
    try {
      await window.wp?.apiFetch?.({
        path: `/qoracrm/v1/automations/${automation.id}/test`,
        method: 'POST',
        data: {},
      });
      showToast(t('automation_test_done') || 'Test run executed. Check logs for results.');
    } catch (e) {
      showToast(e.message || 'Test failed.', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const closeBuilder = () => {
    window.__qoracrm_automation_is_dirty = false;
    setBuilderOpen(false);
    setEditingId(null);
    setDirectAutomation(null);
    if (navigate) navigate('#/automations');
    else window.location.hash = '#/automations';
  };

  const handleSave = async (data) => {
    try {
      let res;
      if (editingId) {
        res = await window.wp?.apiFetch?.({
          path: `/qoracrm/v1/automations/${editingId}`,
          method: 'PUT',
          data,
        });
        setAutomations(prev => prev.map(a => a.id === editingId ? res.automation : a));
        showToast(t('automation_updated') || 'Automation updated.');
      } else {
        res = await window.wp?.apiFetch?.({
          path: '/qoracrm/v1/automations',
          method: 'POST',
          data,
        });
        setAutomations(prev => [res.automation, ...prev]);
        showToast(t('automation_created') || 'Automation created!');
      }
      closeBuilder();
    } catch (e) {
      if (e?.data?.status === 403 && openUpgradeModal) {
        closeBuilder();
        openUpgradeModal('automations');
      } else {
        showToast(e.message || 'Failed to save.', 'error');
      }
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setDirectAutomation(null);
    setBuilderOpen(true);
    if (navigate) navigate('#/automations/builder/new');
    else window.location.hash = '#/automations/builder/new';
  };

  const openEdit = (automation) => {
    setEditingId(automation.id);
    setDirectAutomation(automation);
    setBuilderOpen(true);
    if (navigate) navigate(`#/automations/builder/${automation.id}`);
    else window.location.hash = `#/automations/builder/${automation.id}`;
  };

  const editingAutomation = editingId
    ? (directAutomation && directAutomation.id === editingId ? directAutomation : automations.find(a => a.id === editingId))
    : null;
  const isAutomationLoading = Boolean(editingId && !editingAutomation);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f5f6f8]">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-[99999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${toastType === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toastType === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
            <Zap size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-bold text-gray-900 truncate">{t('automations') || 'Automations'}</div>
            <span className="text-[11px] sm:text-xs text-gray-500 hidden xs:inline-block truncate">{t('automations_desc') || 'Set up automatic workflows triggered by CRM events'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'workflows' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Zap size={13} /> {t('workflows') || 'Workflows'}
              <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">{automations.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('logs'); setLogsForId(null); }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BarChart2 size={13} /> {t('execution_logs') || 'Logs'}
            </button>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-primary-dark transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus size={15} /> <span>{t('create_automation') || 'New Automation'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">

        {/* ── Workflows tab ── */}
        {activeTab === 'workflows' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-indigo-500" />
              </div>
            ) : automations.length === 0 ? (
              <EmptyState onCreate={openCreate} t={t} />
            ) : (
              <div className="space-y-3">
                {automations.map(automation => (
                  <AutomationCard
                    key={automation.id}
                    automation={automation}
                    onEdit={() => openEdit(automation)}
                    onToggle={() => handleToggle(automation)}
                    onDelete={() => handleDelete(automation.id)}
                    onTest={() => handleTestRun(automation)}
                    onLogs={() => { setLogsForId(automation.id); setActiveTab('logs'); }}
                    isDeleting={deletingId === automation.id}
                    isTesting={testingId === automation.id}
                    t={t}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Logs tab ── */}
        {activeTab === 'logs' && (
          <AutomationLogs
            automationId={logsForId}
            automations={automations}
            onSelectAutomation={setLogsForId}
            t={t}
          />
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-fade-in p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <div className="text-base font-bold text-gray-900 mb-1">
              {t('delete_automation') || 'Delete Automation?'}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              {t('confirm_delete_automation') || 'Delete this automation workflow and all execution logs? This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => executeDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                {deletingId === confirmDeleteId && <Loader2 size={13} className="animate-spin" />}
                {t('delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Builder Modal */}
      {builderOpen && (
        isAutomationLoading ? (
          <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#f8fafc]/90 backdrop-blur-sm">
            <Loader2 size={36} className="animate-spin text-indigo-600 mb-3" />
            <div className="text-sm font-medium text-gray-700">{t('loading_workflow') || 'Loading workflow...'}</div>
          </div>
        ) : (
          <NodeWorkflowBuilder
            key={editingAutomation?.id ? `auto_${editingAutomation.id}` : 'auto_new'}
            automation={editingAutomation}
            onSave={handleSave}
            onClose={closeBuilder}
            openUpgradeModal={openUpgradeModal}
            t={t}
          />
        )
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function AutomationCard({ automation, onEdit, onToggle, onDelete, onTest, onLogs, isDeleting, isTesting, t }) {
  const trigger = TRIGGER_LABELS[automation.trigger_type] || { label: automation.trigger_type, color: '#6b7280', icon: '⚡' };

  return (
    <div
      onClick={onEdit}
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer group ${automation.is_active ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-75'}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4">

        {/* Trigger badge */}
        <div className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-sm"
          style={{ background: trigger.color + '18' }}>
          {trigger.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{automation.title}</span>
            <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium" style={{ background: trigger.color + '15', color: trigger.color }}>
              {trigger.label}
            </span>
            {!automation.is_active && (
              <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Paused</span>
            )}
          </div>
          {automation.description && (
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">{automation.description}</p>
          )}
          <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-gray-400">
            <span className="flex items-center gap-1"><Play size={11} /> {automation.execution_count} {t('runs') || 'runs'}</span>
            {automation.last_run_at && (
              <span className="hidden xs:flex items-center gap-1"><Clock size={11} /> {new Date(automation.last_run_at).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-0.5 sm:gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ActionBtn title={t('edit') || 'Edit'} onClick={onEdit} icon={<Edit2 size={13} className="sm:w-3.5 sm:h-3.5" />} />
          <ActionBtn
            title={isTesting ? 'Running...' : (t('test_run') || 'Test Run')}
            onClick={onTest}
            icon={isTesting ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} className="sm:w-3.5 sm:h-3.5" />}
            disabled={isTesting}
            className="text-amber-600 hover:bg-amber-50 hidden xs:flex"
          />
          <ActionBtn title={t('execution_logs') || 'Logs'} onClick={onLogs} icon={<BarChart2 size={13} className="sm:w-3.5 sm:h-3.5" />} className="text-indigo-600 hover:bg-indigo-50 hidden xs:flex" />
          <ActionBtn
            title={isDeleting ? 'Deleting...' : (t('delete') || 'Delete')}
            onClick={onDelete}
            icon={isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />}
            disabled={isDeleting}
            className="text-red-500 hover:bg-red-50"
          />
        </div>

        {/* Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`shrink-0 transition-colors cursor-pointer ${automation.is_active ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
          title={automation.is_active ? (t('pause') || 'Pause') : (t('activate') || 'Activate')}
        >
          {automation.is_active ? <ToggleRight size={26} className="sm:w-[30px] sm:h-[30px]" /> : <ToggleLeft size={26} className="sm:w-[30px] sm:h-[30px]" />}
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ title, onClick, icon, disabled, className = 'text-gray-500 hover:bg-gray-100' }) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      disabled={disabled}
      className={`p-1.5 sm:p-2 rounded-lg transition-colors disabled:opacity-40 cursor-pointer ${className}`}
    >
      {icon}
    </button>
  );
}

function EmptyState({ onCreate, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 shadow-inner">
        <Zap size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{t('no_automations') || 'No automations yet'}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {t('no_automations_desc') || 'Create your first workflow to automatically handle CRM events — status changes, emails, webhooks and more.'}
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-md hover:bg-primary-dark transition-all active:scale-[0.98]"
      >
        <Plus size={16} /> {t('create_automation') || 'Create Automation'}
      </button>
    </div>
  );
}
