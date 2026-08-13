import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Settings as SettingsIcon, Maximize, Minimize } from 'lucide-react';

import { useFormStore } from './store/useFormStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useRouter } from './hooks/useRouter';

import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/leads/LeadsView';
import { SettingsView } from './components/settings/SettingsView';
import { FormsList } from './components/forms/FormsList';
import { FormBuilder } from './components/forms/FormBuilder';
import { NavItem } from './components/ui/NavItem';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { NotificationBell } from './components/ui/NotificationBell';
import { useI18n } from './utils/I18nContext';
import { PlanBadge, UpgradeModal } from './components/common/ProBadge';

function App() {
  const { t } = useI18n();


  const {
    activeTab,
    activeView,
    leadsViewMode,
    setLeadsViewMode,
    routeId,
    navigate,
    pendingNavigation,
    setPendingNavigation,
  } = useRouter();

  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState(null);

  const openUpgradeModal = (feature = null) => {
    setUpgradeModalFeature(feature);
    setUpgradeModalOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let urlChanged = false;
    let targetHash = window.location.hash;

    if (params.get('route')) {
      targetHash = '#' + params.get('route');
      params.delete('route');
      urlChanged = true;
    }

    if (params.get('open_upgrade') === '1') {
      openUpgradeModal();
      urlChanged = true;
    }

    if (params.get('license_refreshed') === '1') {
      localStorage.removeItem('qora_sec_downgrade');
      urlChanged = true;

      setTimeout(() => {
        if (window.QoraCRM && typeof window.QoraCRM.stealthCheck === 'function') {
          window.QoraCRM.stealthCheck(true);
        } else if (window.qoraCrmData?.ajaxUrl && window.qoraCrmData?.adminNonce) {
          // PRO is not active, trigger automatic installation
          const formData = new URLSearchParams();
          formData.append('action', 'qoracrm_install_pro');
          formData.append('nonce', window.qoraCrmData.adminNonce);

          fetch(window.qoraCrmData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setTimeout(() => { window.location.reload(); }, 1500);
              } else {
                console.error('Failed to automatically install Pro:', data.data?.message);
              }
            })
            .catch(err => console.error('Install Pro error:', err));
        }
      }, 1000);
    }

    if (urlChanged) {
      // Clean up parameter from URL but keep page=qoracrm
      params.delete('open_upgrade');
      params.delete('license_refreshed');
      const searchString = params.toString() ? '?' + params.toString() : '';
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + searchString + targetHash;
      window.history.replaceState({ path: newUrl }, '', newUrl);
      if (targetHash && window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, []);

  const confirmNavigation = () => {
    useFormStore.getState().markClean();
    useSettingsStore.getState().resetDirty();
    window.location.hash = pendingNavigation;
    setPendingNavigation(null);
  };

  const handleModalSave = () => {
    setIsSavingGlobal(true);
    const detail = {
      onSuccess: () => {
        setIsSavingGlobal(false);
        confirmNavigation();
      },
      onError: () => {
        setIsSavingGlobal(false);
      }
    };
    window.dispatchEvent(new CustomEvent('qoracrm_request_save', { detail }));

    // Fallback if nothing listens
    setTimeout(() => {
      if (isSavingGlobal) setIsSavingGlobal(false);
    }, 5000);
  };

  return (
    <div className={`flex flex-col overflow-hidden text-[#212121] ${isFullscreen ? 'fixed inset-0 z-[999999] bg-[#f5f6f8] h-screen w-screen' : 'h-screen bg-[#f5f6f8]'}`}>
      {/* Top Navigation */}
      <nav className="flex items-center px-3 md:px-8 h-16 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2 md:gap-3 font-bold text-lg text-gray-900 mr-3 md:mr-12 tracking-tight shrink-0">
          <div className="qoracrm-hidden-tablet">
            <svg width="120" viewBox="0 0 655 142" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M65.005 0.334253C83.229 -1.66575 102.802 5.47425 116.524 17.3383C130.81 29.7993 139.528 47.4492 140.74 66.3672C142.099 87.0082 135.782 102.723 122.427 117.957C129.725 124.763 138.529 133.746 145.43 140.978C129.809 141.172 113.968 140.838 98.301 140.824C70.328 141.083 48.411 143.666 25.345 124.465C11.061 112.522 2.07199 95.4222 0.332993 76.8852C-1.49501 58.2902 4.25599 39.7443 16.285 25.4463C28.885 10.4313 45.575 2.12525 65.005 0.334253Z
              M64.6244 34.9428C84.2154 31.8248 102.611 45.2198 105.659 64.8218C108.707 84.4238 95.2474 102.771 75.6344 105.749C56.1204 108.712 37.8854 95.3348 34.8534 75.8318C31.8204 56.3278 45.1324 38.0458 64.6244 34.9428Z
              M67.3343 13.3382C79.1093 12.3732 93.0863 16.5082 102.681 23.4252C115.308 32.4012 123.832 46.0452 126.361 61.3302C129.134 78.6982 124.189 93.8942 114.053 107.902C111.748 105.43 109.489 102.915 107.276 100.361C115.637 88.0672 119.288 78.2432 116.999 62.9012C115.218 50.5222 108.493 39.3932 98.3613 32.0602C87.7983 24.3202 75.1363 21.5162 62.2443 23.5522C50.1563 25.5602 39.3433 32.2442 32.1413 42.1582C23.3093 54.3232 21.7433 66.6162 24.0023 81.0522C25.2403 86.7902 27.6463 92.2112 31.0703 96.9792C46.4533 118.653 75.2823 124.871 97.1853 109.152C103.275 115.346 108.921 121.537 115.197 127.78C105.944 127.973 96.6893 128.064 87.4343 128.053C67.5293 128.067 51.2063 128.135 34.7213 114.889C23.0033 105.384 15.5283 91.6222 13.9343 76.6182C10.4813 43.2052 34.4593 16.5262 67.3343 13.3382Z" fill="#d4af37" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M312.762 52.3464C315.098 52.3244 317.433 52.4414 319.755 52.6984C330.21 53.7904 336.114 58.1544 342.535 66.0094C342.783 62.1934 342.704 57.7334 342.728 53.8624L350.937 53.6583L350.867 122.106L342.79 122.064L342.757 110.356C339.944 113.406 337.984 115.389 334.744 117.916C322.254 126.715 303.262 125.399 291.591 115.757C284.313 109.66 279.774 100.907 278.984 91.4464C276.944 69.4434 291.108 54.0564 312.762 52.3464Z
              M312.515 60.2276C327.965 58.6606 341.757 69.9206 343.314 85.3706C344.871 100.821 333.603 114.606 318.152 116.154C302.714 117.701 288.943 106.445 287.388 91.0076C285.832 75.5706 297.079 61.7926 312.515 60.2276Z" fill="#d4af37" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M190.688 51.9262C210.749 50.4612 228.181 65.5802 229.568 85.6472C230.954 105.715 215.767 123.087 195.695 124.395C175.732 125.696 158.476 110.611 157.097 90.6542C155.719 70.6972 170.736 53.3822 190.688 51.9262Z
              M189.875 60.3367C205.296 58.3747 219.37 69.3327 221.247 84.7647C223.124 100.196 212.088 114.209 196.646 116.001C181.325 117.779 167.444 106.847 165.582 91.5357C163.719 76.2237 174.574 62.2837 189.875 60.3367Z" fill="#d4af37" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M477.42 23.1233L496.44 23.0483C515.229 23.0023 533.529 23.9203 537.554 46.9093C541.103 67.1833 527.487 77.5933 509.649 80.2853C515.995 87.4853 522.033 97.0423 527.62 104.964C531.604 110.613 536.103 116.605 539.794 122.36L530.27 122.621L528.373 120.339C518.701 107.321 509.348 94.0703 500.321 80.5973C495.346 80.6203 490.372 80.7273 485.401 80.9163L485.346 122.388L476.973 122.425C477.297 89.3263 477.446 56.2243 477.42 23.1233Z
              M488.084 31.3919C504.554 30.9559 530.883 28.1749 529.386 54.4599C529.071 59.9769 525.9 64.1309 521.678 67.5179C512.011 73.6799 496.916 72.1269 485.426 72.1079C485.495 67.2579 484.929 33.7539 486.167 31.6099L488.084 31.3919Z" fill="#1d2327" stroke="#1d2327" stroke-width="3.2" stroke-linejoin="round" />
              <path d="M562.102 21.2695C564.898 22.5605 570.87 37.2096 572.499 40.7206C578.833 54.5916 585.24 68.4275 591.72 82.2305C595.311 89.8835 598.9 98.0685 603.009 105.406C606.374 97.5115 641.674 23.1675 643.692 21.7695C644.495 22.6095 644.74 23.9725 644.839 25.1325C647.615 57.6065 651.961 89.9966 654.279 122.503L646.289 122.474L640.434 60.7166C640.116 56.4136 639.847 52.5445 639.199 48.2625C629.679 65.7425 621.681 86.2726 612.528 104.177C609.162 110.763 606.171 118.397 602.393 124.715C598.947 116.617 595.295 109.366 591.63 101.44L567.131 48.4546C565.839 55.8006 565.062 66.8675 564.308 74.6035C562.817 90.6195 561.191 106.624 559.432 122.613L551.473 122.659C553.159 95.4486 557.421 67.8346 559.755 40.6046C560.288 34.3906 561.083 27.4115 562.102 21.2695Z" fill="#1d2327" stroke="#1d2327" stroke-width="3.2" stroke-linejoin="round" />
              <path d="M414.209 21.8184C416.81 21.4134 422.931 21.5094 425.602 21.7934C439.664 23.2044 452.584 30.1634 461.499 41.1294C459.349 43.0364 457.452 44.8284 455.066 46.4434C452.856 43.9164 451.036 42.0984 448.358 40.0294C438.298 32.1204 425.432 28.6874 412.769 30.5334C388.415 33.9214 373.284 54.7974 376.891 78.9984C378.541 90.3474 384.68 100.558 393.93 107.337C404.131 114.876 415.216 116.931 427.524 115.03C438.597 112.902 447.347 106.704 455.014 98.7394C457.027 100.149 459.154 101.853 461.121 103.361C453.083 113.621 439.856 121.502 426.919 123.345C413.108 125.338 399.068 121.808 387.842 113.519C377.272 105.581 370.023 92.5634 368.426 79.4844C364.745 49.3404 384.201 25.1804 414.209 21.8184Z" fill="#1d2327" stroke="#1d2327" stroke-width="3.2" stroke-linejoin="round" />
              <path d="M268.237 52.1938C273.417 52.0118 275.258 51.6898 280.122 53.7508C272.986 66.9258 276.284 57.8809 265.772 61.2559C251.275 65.9099 252.606 88.9619 252.652 101.183C252.712 108.171 252.688 115.16 252.581 122.147L245.334 122.21L244.544 121.933C243.678 120.046 244.107 60.7098 244.005 53.7678C246.941 53.7778 250.014 53.9008 252.959 53.9808L252.87 65.0568C257.577 58.4048 260.163 54.6718 268.237 52.1938Z" fill="#d4af37" />
            </svg>
          </div>
        </div>
        <div className="flex gap-2 h-full items-center flex-1 justify-between">
          <div className="flex gap-1 md:gap-2 h-full items-center">
            <NavItem icon={<LayoutDashboard size={18} />} label={t('dashboard') || "Dashboard"} isActive={activeTab === 'dashboard'} onClick={() => navigate('#/dashboard')} />
            {(window.qoraCrmData?.permissions?.is_admin || window.qoraCrmData?.permissions?.can_manage_forms) && (
              <NavItem icon={<FileText size={18} />} label={t('forms') || "Forms"} isActive={activeTab === 'forms'} onClick={() => navigate('#/forms/list')} />
            )}
            <NavItem icon={<Users size={18} />} label={t('leads') || "Leads"} isActive={activeTab === 'leads'} onClick={() => navigate(`#/leads/${leadsViewMode}`)} />
            {window.qoraCrmData?.permissions?.is_admin && (
              <NavItem icon={<SettingsIcon size={18} />} label={t('settings') || "Settings"} isActive={activeTab === 'settings'} onClick={() => navigate('#/settings')} />
            )}
          </div>

          <div className="flex gap-1 md:gap-2 h-full items-center">
            <div className="qoracrm-hidden-mobile">
              <PlanBadge onUpgradeClick={() => openUpgradeModal()} />
            </div>
            <NotificationBell
              onOpenLead={(id) => navigate(`#/leads/${leadsViewMode || 'kanban'}/${id}`)}
              onCloseLead={() => {
                if (activeTab === 'leads' && routeId) {
                  navigate(`#/leads/${leadsViewMode || 'kanban'}`);
                }
              }}
              t={t}
            />
            <div className="qoracrm-hidden-tablet">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center justify-center p-2.5 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all"
                title={isFullscreen ? (t('exit_fullscreen') || "Exit Fullscreen") : (t('enter_fullscreen') || "Enter Fullscreen")}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'dashboard' && <DashboardView onOpenLead={(id) => navigate(`#/leads/${leadsViewMode || 'kanban'}/${id}`)} />}
        {activeTab === 'forms' && activeView === 'list' && <FormsList onOpenBuilder={(id) => navigate(id ? `#/forms/builder/${id}` : '#/forms/builder')} />}
        {activeTab === 'forms' && activeView === 'builder' && <FormBuilder onBack={() => navigate('#/forms/list')} routeFormId={routeId} />}
        {activeTab === 'leads' && (
          <LeadsView
            viewMode={leadsViewMode}
            setViewMode={(mode) => navigate(`#/leads/${mode}`)}
            routeLeadId={routeId}
            onRouteLeadIdChange={(id) => {
              if (id) navigate(`#/leads/${leadsViewMode}/${id}`);
              else navigate(`#/leads/${leadsViewMode}`);
            }}
          />
        )}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Unsaved Changes Modal */}
      {pendingNavigation && (
        <ConfirmModal
          title={t('unsaved_changes') || "Unsaved Changes"}
          message={t('unsaved_changes_msg') || "You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost."}
          confirmText={t('discard_changes') || "Discard Changes"}
          isDestructive={true}
          onConfirm={confirmNavigation}
          onCancel={() => setPendingNavigation(null)}
          isBusy={isSavingGlobal}
          extraAction={{ label: t('save_and_continue') || 'Save & Continue', onClick: handleModalSave }}
        />
      )}

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeModalFeature}
      />
    </div>
  );
}

export default App;
