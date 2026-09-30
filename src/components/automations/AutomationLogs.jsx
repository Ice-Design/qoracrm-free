import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, Clock, Zap } from 'lucide-react';

const STATUS_CONFIG = {
  success: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Success' },
  failed: { icon: <XCircle size={14} />, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Failed' },
  running: { icon: <Loader2 size={14} className="animate-spin" />, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', label: 'Running' },
};

const STEP_STATUS_DOT = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  skipped: 'bg-gray-300',
};

export function AutomationLogs({ automationId, automations, onSelectAutomation, t }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = useCallback(async (id) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await window.wp?.apiFetch?.({ path: `/qoracrm/v1/automations/${id}/logs?limit=50` });
      setLogs(res?.logs || []);
      setTotal(res?.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(automationId);
    setExpandedId(null);
  }, [automationId, fetchLogs]);

  return (
    <div className="space-y-4">
      {/* Automation Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <label className="block text-xs font-semibold text-gray-500 mb-2">{t('select_automation') || 'Select Automation'}</label>
        <select
          value={automationId || ''}
          onChange={e => onSelectAutomation(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">{t('all_automations') || '— All Automations —'}</option>
          {automations.map(a => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : !automationId ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Zap size={32} className="mx-auto mb-3 opacity-30" />
          {t('select_automation_for_logs') || 'Select an automation above to view its execution logs.'}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Clock size={32} className="mx-auto mb-3 opacity-30" />
          {t('no_logs_yet') || 'No logs yet. Trigger the automation to see results here.'}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <p className="text-xs text-gray-400">{total} {t('total_runs') || 'total runs'}</p>
          </div>
          {logs.map(log => {
            const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.running;
            const isExpanded = expandedId === log.id;

            return (
              <div key={log.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${cfg.bg}`}>
                {/* Log row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-black/2 transition-colors"
                >
                  <span className={cfg.color}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                      {log.lead_id && (
                        <span className="text-xs text-gray-400">Lead #{log.lead_id}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{log.exec_time_ms}ms</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                    {log.error_message && !isExpanded && (
                      <div className="text-xs text-red-500 mt-1 truncate">{log.error_message}</div>
                    )}
                  </div>
                  <span className="text-gray-400 shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>

                {/* Expanded steps */}
                {isExpanded && log.log_steps?.length > 0 && (
                  <div className="border-t border-inherit px-4 py-3 space-y-2">
                    {log.log_steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${STEP_STATUS_DOT[step.status] || 'bg-gray-300'}`} />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-700">{step.action_type}</span>
                          {step.message && <span className="text-gray-400 ml-2">{step.message}</span>}
                        </div>
                        <span className="text-gray-400 shrink-0">{step.timestamp}</span>
                      </div>
                    ))}
                    {log.error_message && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                        <strong>Error:</strong> {log.error_message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
