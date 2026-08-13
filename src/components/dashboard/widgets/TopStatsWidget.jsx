import React, { useMemo, useState } from 'react';
import { WidgetContainer } from './WidgetContainer';
import { X, Check } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { CURRENCIES } from '../../../utils/currencies';

export function TopStatsWidget({ widget, onUpdateSettings, validLeads, forms, globalStatuses, t, onRemove }) {
  const [showSettings, setShowSettings] = useState(false);

  // Default settings
  const defaultSettings = {
    showTotalLeads: true,
    showNewLeads: true,
    showConvertedLeads: true,
    showViews: true,
    showActiveForms: true,
    showIncome: true
  };
  const settings = { ...defaultSettings, ...(widget.settings || {}) };
  const { generalCurrency, generalCurrencyPos } = useSettingsStore();

  const formatPriceLocally = (amount) => {
    const currencyObj = CURRENCIES.find(c => c.code === generalCurrency) || { symbol: '$' };
    const sym = currencyObj.symbol;
    let formatted = Number(amount || 0).toFixed(2);
    if (generalCurrencyPos === 'left') return `${sym}${formatted}`;
    if (generalCurrencyPos === 'left_space') return `${sym} ${formatted}`;
    if (generalCurrencyPos === 'right') return `${formatted}${sym}`;
    if (generalCurrencyPos === 'right_space') return `${formatted} ${sym}`;
    return `${sym}${formatted}`;
  };

  const stats = useMemo(() => {
    let newCount = 0;
    let convertedCount = 0;
    let incomeCount = 0;

    validLeads.forEach(l => {
      if (l.status === 'new') {
        newCount++;
      } else {
        const statusObj = globalStatuses.find(s => s.id === l.status);
        if (statusObj && statusObj.is_converted) {
          convertedCount++;
        }
      }

      const payments = l.meta_data?.payments || [];
      payments.forEach(p => {
        incomeCount += parseFloat(p.amount) || 0;
      });
      if (l.meta_data?.stripe_payment_status === 'succeeded' && l.meta_data?.stripe_amount) {
        incomeCount += parseFloat(l.meta_data.stripe_amount) || 0;
      }
    });

    const views = forms.reduce((sum, f) => sum + (parseInt(f.views, 10) || 0), 0);
    const activeForms = forms.filter(f => f.is_active).length;

    return {
      totalLeads: validLeads.length,
      newLeads: newCount,
      convertedLeads: convertedCount,
      views,
      activeForms,
      income: incomeCount
    };
  }, [validLeads, forms, globalStatuses]);

  const toggleSetting = (key) => {
    onUpdateSettings(widget.id, { ...settings, [key]: !settings[key] });
  };

  const statCards = [
    { key: 'showTotalLeads', value: stats.totalLeads, label: t('stat_total_leads') || 'Total Leads', color: 'text-gray-900' },
    { key: 'showNewLeads', value: stats.newLeads, label: t('stat_new_leads') || 'New Leads', color: 'text-emerald-500' },
    { key: 'showConvertedLeads', value: stats.convertedLeads, label: t('stat_converted_leads') || 'Converted Leads', color: 'text-blue-500' },
    { key: 'showIncome', value: formatPriceLocally(stats.income), label: t('stat_income') || 'Income', color: 'text-green-600' },
    { key: 'showViews', value: stats.views, label: t('stat_views') || 'Views', color: 'text-purple-500' },
    { key: 'showActiveForms', value: stats.activeForms, label: t('stat_active_forms') || 'Active Forms', color: 'text-amber-500' }
  ];

  const visibleCards = statCards.filter(card => settings[card.key]);

  return (
    <WidgetContainer
      title={t('widget_top_stats') || 'Overview Statistics'}
      onSettingsClick={() => setShowSettings(true)}
      onRemove={onRemove}
      containerClass="p-3 sm:p-4"
      headerClass="mb-2"
    >
      {showSettings && (
        <div
          className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col animate-fade-in rounded-xl"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2 px-1">
            <div className="font-semibold text-gray-900 !m-0 text-sm">{t('widget_settings') || 'Widget Settings'}</div>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowSettings(false); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex flex-wrap gap-1.5">
              {statCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleSetting(card.key);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-gray-200 hover:border-primary/50 rounded-lg cursor-pointer transition-colors outline-none text-left"
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${settings[card.key] ? 'bg-primary text-white' : 'border border-gray-300 bg-white'}`}>
                    {settings[card.key] && <Check size={12} />}
                  </div>
                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{card.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto flex items-center h-full no-scrollbar pb-1">
        <div className="flex gap-2 min-w-max w-full items-center h-full">
          {visibleCards.length > 0 ? (
            visibleCards.map((card, idx) => (
              <div key={card.key} className="flex-1 h-full bg-white border border-gray-100 rounded-xl px-3 py-1 flex flex-col justify-center min-w-[120px] shadow-sm">
                <div className={`text-2xl font-bold leading-none mb-1 ${card.color}`}>
                  {card.value}
                </div>
                <div className="text-xs font-medium text-gray-500 leading-none truncate">
                  {card.label}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 italic">
              {t('no_stats_selected') || 'No stats selected'}
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
