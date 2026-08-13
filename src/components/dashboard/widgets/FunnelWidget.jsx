import { useMemo, useState } from 'react';
import { WidgetContainer } from './WidgetContainer';
import { X } from 'lucide-react';

export function FunnelWidget({ widget, onUpdateSettings, validLeads, globalStatuses, t, onRemove }) {
  const [showSettings, setShowSettings] = useState(false);
  const period = widget.settings?.period || 'all'; // all, today, week, month
  const selectedStatuses = widget.settings?.statuses || globalStatuses.map(s => s.id);

  const filteredLeads = useMemo(() => {
    if (period === 'all') return validLeads;

    const now = new Date();
    const cutoff = new Date();
    if (period === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      cutoff.setDate(now.getDate() - 30);
    }

    return validLeads.filter(l => new Date(l.created_at) >= cutoff);
  }, [validLeads, period]);

  const funnelData = useMemo(() => {
    const totalLeads = filteredLeads.length;
    if (totalLeads === 0) return [];

    return globalStatuses
      .filter(status => selectedStatuses.includes(status.id))
      .map(status => {
        const count = filteredLeads.filter(l => l.status === status.id).length;
        const percentage = Math.round((count / totalLeads) * 100) || 0;
        return {
          id: status.id,
          label: status.label,
          color: status.color,
          count,
          percentage
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [globalStatuses, filteredLeads, selectedStatuses]);

  const handlePeriodChange = (e) => {
    onUpdateSettings(widget.id, { ...widget.settings, period: e.target.value });
  };

  const toggleStatus = (id) => {
    let newStatuses;
    if (selectedStatuses.includes(id)) {
      newStatuses = selectedStatuses.filter(s => s !== id);
    } else {
      newStatuses = [...selectedStatuses, id];
    }
    onUpdateSettings(widget.id, { ...widget.settings, statuses: newStatuses });
  };

  return (
    <WidgetContainer
      title={t('sales_funnel') || 'Sales Funnel'}
      onSettingsClick={() => setShowSettings(true)} onRemove={onRemove}
    >
      {showSettings ? (
        <div
          className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold text-gray-900">{t('widget_settings') || 'Widget Settings'}</div>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowSettings(false); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('date_range') || 'Date Range'}</label>
              <select
                value={period}
                onChange={handlePeriodChange}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="all">{t('all_time') || 'All Time'}</option>
                <option value="today">{t('today') || 'Today'}</option>
                <option value="week">{t('last_7_days') || 'Last 7 Days'}</option>
                <option value="month">{t('last_30_days') || 'Last 30 Days'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">{t('statuses') || 'Statuses'}</label>
              <div className="space-y-1 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                {globalStatuses.map(s => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(s.id)}
                      onChange={() => toggleStatus(s.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                    <span className="text-sm text-gray-700">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {funnelData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              {t('no_leads_found') || 'No leads found for this period.'}
            </div>
          ) : (
            funnelData.map(item => (
              <div key={item.id} className="relative">
                <div className="flex justify-between text-xs mb-1.5 px-1 relative z-10 font-medium">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="text-gray-900">{item.count} <span className="text-gray-400 font-normal ml-1">({item.percentage}%)</span></span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color || '#e5e7eb'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
