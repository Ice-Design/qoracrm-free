import { useState, useEffect } from 'react';
import { useFormStore } from '../store/useFormStore';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Hash-based router hook.
 * Parses window.location.hash and returns the current active tab, view, and route ID.
 * Also provides a `navigate` helper that respects unsaved form state.
 *
 * @returns {{
 *   activeTab: string,
 *   activeView: string,
 *   leadsViewMode: string,
 *   routeId: number|null,
 *   navigate: (path: string) => void,
 *   pendingNavigation: string|null,
 *   setPendingNavigation: Function,
 *   setLeadsViewMode: Function,
 * }}
 */
export function useRouter() {
  const [activeTab, setActiveTab] = useState('leads');
  const [activeView, setActiveView] = useState('list');
  const [leadsViewMode, setLeadsViewMode] = useState('kanban');
  const [routeId, setRouteId] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (!hash) {
        window.location.hash = '#/leads/kanban';
        return;
      }
      
      const parts = hash.split('/');
      const tab = parts[0];
      const view = parts[1] || 'list';
      const idStr = parts[2];
      
      if (tab === 'forms') {
        const canManageForms = window.qoraCrmData?.permissions?.is_admin || window.qoraCrmData?.permissions?.can_manage_forms;
        if (!canManageForms) {
          window.location.hash = '#/leads/kanban';
          return;
        }
        setActiveTab('forms');
        setActiveView(view);
        if (idStr) setRouteId(parseInt(idStr));
        else setRouteId(null);
      } else if (tab === 'leads') {
        setActiveTab('leads');
        setLeadsViewMode(view || 'kanban');
        if (idStr) setRouteId(parseInt(idStr));
        else setRouteId(null);
      } else if (tab === 'settings') {
        if (!window.qoraCrmData?.permissions?.is_admin) {
          window.location.hash = '#/leads/kanban';
          return;
        }
        setActiveTab('settings');
      } else if (tab === 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Init on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path) => {
    const isFormDirty = useFormStore.getState().isDirty;
    const isSettingsDirty = useSettingsStore.getState().isDirty;
    if (isFormDirty || isSettingsDirty) {
      setPendingNavigation(path);
      return;
    }
    window.location.hash = path;
  };

  return {
    activeTab,
    activeView,
    leadsViewMode,
    setLeadsViewMode,
    routeId,
    navigate,
    pendingNavigation,
    setPendingNavigation,
  };
}
