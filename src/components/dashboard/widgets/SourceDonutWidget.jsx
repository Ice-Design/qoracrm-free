import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer } from './WidgetContainer';
import { X } from 'lucide-react';

export function SourceDonutWidget({ widget, onUpdateSettings, validLeads, t, onRemove }) {
  const [showSettings, setShowSettings] = useState(false);
  const period = widget.settings?.period || 'all'; // all, today, week, month

  const allSources = useMemo(() => {
    const sources = new Set();
    validLeads.forEach(l => {
      sources.add(l.meta_data?.utm_source || 'direct');
    });
    return Array.from(sources).sort();
  }, [validLeads]);

  const selectedSources = widget.settings?.sources || allSources;

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

  const sourceData = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(l => {
      const source = l.meta_data?.utm_source || 'direct';
      counts[source] = (counts[source] || 0) + 1;
    });

    const COLORS = ['#2dd4bf', '#ef4444', '#334155', '#f59e0b', '#8b5cf6'];

    return Object.keys(counts)
      .filter(key => selectedSources.includes(key))
      .map((key, idx) => ({
        name: key === 'direct' ? (t('direct_unknown') || 'Direct / Unknown') : key,
        value: counts[key],
        color: COLORS[idx % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLeads, selectedSources, t]);

  const handlePeriodChange = (e) => {
    onUpdateSettings(widget.id, { ...widget.settings, period: e.target.value });
  };

  const toggleSource = (src) => {
    let newSources;
    if (selectedSources.includes(src)) {
      newSources = selectedSources.filter(s => s !== src);
    } else {
      newSources = [...selectedSources, src];
    }
    onUpdateSettings(widget.id, { ...widget.settings, sources: newSources });
  };

  return (
    <WidgetContainer
      title={t('lead_sources') || 'Lead Sources'}
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

            {allSources.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">{t('sources') || 'Sources'}</label>
                <div className="space-y-1 border border-gray-100 rounded-lg p-2 bg-gray-50/50 max-h-[150px] overflow-y-auto custom-scrollbar">
                  {allSources.map(src => (
                    <label
                      key={src}
                      className="flex items-center gap-2 cursor-pointer"
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(src)}
                        onChange={() => toggleSource(src)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{src === 'direct' ? (t('direct_unknown') || 'Direct / Unknown') : src}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-[150px]">
            {sourceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {t('no_leads_found') || 'No leads found for this period.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {sourceData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {sourceData.slice(0, 4).map(item => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600 truncate" title={item.name}>{item.name}</span>
                  <span className="font-semibold text-gray-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
