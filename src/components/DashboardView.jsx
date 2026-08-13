import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../utils/I18nContext';
import { getDefaultStatuses } from './leads/leadHelpers';
import { LayoutDashboard, Lock } from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { UpgradeModal } from './common/ProBadge';

// Import Lite Widgets
import { LeadsChartWidget } from './dashboard/widgets/LeadsChartWidget';
import { FunnelWidget } from './dashboard/widgets/FunnelWidget';
import { FormsWidget } from './dashboard/widgets/FormsWidget';
import { GettingStartedWidget } from './dashboard/widgets/GettingStartedWidget';
import { TopStatsWidget } from './dashboard/widgets/TopStatsWidget';
import { SourceDonutWidget } from './dashboard/widgets/SourceDonutWidget';
import ExtensionSlot from './common/ExtensionSlot';

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGETS_CONFIG = {
  top_stats: { id: 'top_stats', component: TopStatsWidget, title: 'Overview Statistics', defaultW: 12, defaultH: 1, minW: 6, minH: 1 },
  getting_started: { id: 'getting_started', component: GettingStartedWidget, title: 'Getting Started', defaultW: 12, defaultH: 2, minW: 6, minH: 2 },
  leads_chart: { id: 'leads_chart', component: LeadsChartWidget, title: 'Leads Over Time', defaultW: 6, defaultH: 2, minW: 4, minH: 2 },
  source_donut: { id: 'source_donut', component: SourceDonutWidget, title: 'Lead Sources', defaultW: 3, defaultH: 2, minW: 3, minH: 2 },
  funnel: { id: 'funnel', component: FunnelWidget, title: 'Sales Funnel', defaultW: 3, defaultH: 2, minW: 3, minH: 2 },
  forms: { id: 'forms', component: FormsWidget, title: 'Top Forms', defaultW: 3, defaultH: 2, minW: 3, minH: 2 },
};

const LITE_DEFAULT_LAYOUT = [
  { i: 'getting_started', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2, static: true, isDraggable: false, isResizable: false },
  { i: 'top_stats', x: 0, y: 2, w: 12, h: 1, minW: 6, minH: 1 },
  { i: 'leads_chart', x: 0, y: 3, w: 12, h: 2, minW: 4, minH: 2 },
  { i: 'source_donut', x: 0, y: 5, w: 4, h: 2, minW: 3, minH: 2 },
  { i: 'funnel', x: 4, y: 5, w: 4, h: 2, minW: 3, minH: 2 },
  { i: 'forms', x: 8, y: 5, w: 4, h: 2, minW: 3, minH: 2 },
];

function LiteDashboardGrid({ onOpenLead }) {
  const { t } = useI18n();
  const [leads, setLeads] = useState([]);
  const [forms, setForms] = useState([]);
  const [globalStatuses, setGlobalStatuses] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);
  const [widgetsSettings, setWidgetsSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, formsRes, settingsRes, usersRes, prefsRes] = await Promise.all([
          window.wp.apiFetch({ path: '/qoracrm/v1/leads' }),
          window.wp.apiFetch({ path: '/qoracrm/v1/forms' }),
          window.wp.apiFetch({ path: '/qoracrm/v1/settings' }),
          window.wp.apiFetch({ path: '/qoracrm/v1/settings/users' }),
          window.wp.apiFetch({ path: '/qoracrm/v1/settings/dashboard' }).catch(() => ({}))
        ]);

        setLeads(leadsRes || []);
        setForms(formsRes || []);
        setCrmUsers(usersRes || []);
        if (prefsRes && prefsRes.settings) {
          setWidgetsSettings(prefsRes.settings);
        }

        const defaultStatuses = getDefaultStatuses(t);
        let loadedStatuses = settingsRes?.statuses || [];
        defaultStatuses.forEach(defStatus => {
          if (!loadedStatuses.some(s => s.id === defStatus.id)) {
            loadedStatuses.unshift(defStatus);
          }
        });
        setGlobalStatuses(loadedStatuses);
      } catch (err) {
        console.error("Lite Dashboard error:", err);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [t]);

  const updateWidgetSettings = (widgetId, newSettings) => {
    const updatedSettings = { ...widgetsSettings, [widgetId]: newSettings };
    setWidgetsSettings(updatedSettings);
    window.wp.apiFetch({
      path: '/qoracrm/v1/settings/dashboard',
      method: 'POST',
      data: {
        settings: updatedSettings
      }
    }).catch(e => console.error("Failed to save dashboard preferences", e));
  };

  const validLeads = useMemo(() => leads.filter(l => l.status !== 'spam' && l.status !== 'archive'), [leads]);
  const totalLeads = validLeads.length;
  const totalForms = forms.length;

  const activeCrmUsers = useMemo(() => {
    return crmUsers.filter(u => validLeads.some(l => String(l.assignee_id) === String(u.id)));
  }, [crmUsers, validLeads]);

  const tasks = useMemo(() => [
    { id: 'form', label: t('create_form') || 'Create Form', done: totalForms > 0, link: '#/forms/list' },
    { id: 'lead', label: t('receive_first_lead') || 'Receive First Lead', done: totalLeads > 0, link: '#/leads/kanban' }
  ], [totalLeads, totalForms, t]);

  const isGettingStartedDone = tasks.filter(task => task.done).length === tasks.length;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-gray-50/50">
        <div className="flex flex-col items-center text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
          <span className="font-medium text-sm animate-pulse">{t('loading_dashboard') || 'Loading Dashboard...'}</span>
        </div>
      </div>
    );
  }

  const displayLayout = isGettingStartedDone
    ? LITE_DEFAULT_LAYOUT.filter(l => l.i !== 'getting_started')
    : LITE_DEFAULT_LAYOUT;

  return (
    <div className="relative h-full flex flex-col bg-gray-50/30 overflow-hidden">
      {/* Floating Edit Dashboard Button -> opens Pro upgrade modal in Lite */}
      <button
        onClick={() => setProUpgradeOpen(true)}
        className="absolute top-4 right-6 z-30 flex items-center justify-center w-12 h-12 bg-white border border-gray-200 shadow-lg text-gray-600 rounded-full hover:border-primary hover:text-primary hover:scale-105 transition-all cursor-pointer"
        title={t('edit_dashboard') || 'Edit Dashboard'}
      >
        <LayoutDashboard size={20} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs">
          <Lock size={9} strokeWidth={2.5} />
        </div>
      </button>

      {/* Fixed Grid Layout Container for Lite */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 ">
        <ResponsiveGridLayout
          className="layout -mx-2"
          layouts={{ lg: displayLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 1, xxs: 1 }}
          rowHeight={160}
          isDraggable={false}
          isResizable={false}
        >
          {displayLayout.map((item) => {
            const config = WIDGETS_CONFIG[item.i];
            if (!config) return null;
            const WidgetComponent = config.component;

            return (
              <div key={item.i} className="flex flex-col group/item relative h-full">
                <WidgetComponent
                  widget={{ id: item.i, settings: widgetsSettings[item.i] || {} }}
                  onUpdateSettings={updateWidgetSettings}
                  onRemove={undefined}
                  validLeads={validLeads}
                  forms={forms}
                  globalStatuses={globalStatuses}
                  activeCrmUsers={activeCrmUsers}
                  crmUsers={crmUsers}
                  tasks={tasks}
                  t={t}
                  onOpenLead={onOpenLead}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>

      <UpgradeModal
        isOpen={proUpgradeOpen}
        onClose={() => setProUpgradeOpen(false)}
        feature={t('dashboard_customization') || 'Dashboard Customization'}
      />
    </div>
  );
}

export function DashboardView({ onOpenLead }) {
  return (
    <ExtensionSlot
      name="ProDashboardContainer"
      onOpenLead={onOpenLead}
      fallback={<LiteDashboardGrid onOpenLead={onOpenLead} />}
    />
  );
}
