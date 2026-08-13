import { useMemo, useState } from 'react';
import { WidgetContainer } from './WidgetContainer';
import { X, Eye, CheckCircle2 } from 'lucide-react';

export function FormsWidget({ widget, onUpdateSettings, validLeads, forms, t, onRemove }) {
  const [showSettings, setShowSettings] = useState(false);
  const period = widget.settings?.period || 'all'; // all, today, week, month

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

  const topFormsData = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(l => {
      const fId = l.form_id;
      if (fId) counts[fId] = (counts[fId] || 0) + 1;
    });

    forms.forEach(f => {
      const fId = String(f.id);
      if (!counts[fId] && parseInt(f.views) > 0) {
        counts[fId] = 0;
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return Object.keys(counts).map(key => {
      const form = forms.find(f => String(f.id) === String(key));
      if (!form) return null;

      const count = counts[key];
      // Note: Views are lifetime, so they don't perfectly align with the date filter, 
      // but it's still a good metric to show alongside submissions.
      const views = parseInt(form.views) || 0;
      return {
        id: key,
        name: form.title,
        views: views,
        submissions: count,
        percentage: Math.round((count / maxCount) * 100)
      };
    }).filter(item => item !== null && (item.submissions > 0 || item.views > 0)).sort((a, b) => {
      if (b.submissions !== a.submissions) return b.submissions - a.submissions;
      return b.views - a.views;
    });
  }, [filteredLeads, forms]);

  const handlePeriodChange = (e) => {
    onUpdateSettings(widget.id, { ...widget.settings, period: e.target.value });
  };

  return (
    <WidgetContainer
      title={t('top_performing_forms') || 'Top Performing Forms'}
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
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('date_range_submissions') || 'Date Range (Submissions)'}</label>
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
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {topFormsData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              {t('no_forms_data') || 'No form data available.'}
            </div>
          ) : (
            topFormsData.map(form => (
              <div key={form.id} className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-800 truncate pr-2">{form.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-gray-500" title={t('views') || 'Views'}>
                      <Eye size={14} /> {form.views}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-semibold" title={t('submissions') || 'Submissions'}>
                      <CheckCircle2 size={14} /> {form.submissions}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${form.percentage}%` }}
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
