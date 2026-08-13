import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer } from './WidgetContainer';
import { X } from 'lucide-react';

export function LeadsChartWidget({ widget, onUpdateSettings, validLeads, t, onRemove }) {
  const [showSettings, setShowSettings] = useState(false);
  const period = widget.settings?.period || 'daily'; // hourly, daily, weekly, monthly

  const timelineData = useMemo(() => {
    const counts = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === 'daily') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        counts[key] = 0;
      }
      validLeads.forEach(l => {
        const d = new Date(l.created_at);
        const key = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (counts[key] !== undefined) counts[key]++;
      });
    } else if (period === 'hourly') {
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(d.getHours() - i);
        const key = `${d.getHours().toString().padStart(2, '0')}:00`;
        counts[key] = 0;
      }
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      validLeads.forEach(l => {
        const d = new Date(l.created_at);
        if (d >= dayAgo) {
          const key = `${d.getHours().toString().padStart(2, '0')}:00`;
          if (counts[key] !== undefined) counts[key]++;
        }
      });
    } else if (period === 'weekly') {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - (i * 7));
        const key = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`;
        counts[key] = 0;
      }
      // Simple approximation for grouping
      validLeads.forEach(l => {
        const d = new Date(l.created_at);
        const key = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`;
        if (counts[key] !== undefined) counts[key]++;
      });
    } else if (period === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
        counts[key] = 0;
      }
      validLeads.forEach(l => {
        const d = new Date(l.created_at);
        const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
        if (counts[key] !== undefined) counts[key]++;
      });
    }

    return Object.keys(counts).map(key => ({
      date: key,
      leads: counts[key]
    }));
  }, [validLeads, period]);

  const handlePeriodChange = (e) => {
    onUpdateSettings(widget.id, { ...widget.settings, period: e.target.value });
  };

  return (
    <WidgetContainer
      title={t('leads_over_time') || 'Leads Over Time'}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('chart_period') || 'Chart Period'}</label>
              <select
                value={period}
                onChange={handlePeriodChange}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="hourly">{t('hourly') || 'Hourly (Last 24h)'}</option>
                <option value="daily">{t('daily') || 'Daily (Last 14 days)'}</option>
                <option value="weekly">{t('weekly') || 'Weekly (Last 12 weeks)'}</option>
                <option value="monthly">{t('monthly') || 'Monthly (Last 12 months)'}</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar name={t('leads') || 'Leads'} dataKey="leads" fill="#d4af37" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </WidgetContainer>
  );
}
