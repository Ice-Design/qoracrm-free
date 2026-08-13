import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Tag, Link as LinkIcon, Shield, Users, MessageSquareWarning, Save, Download, Ghost, AlertCircle, Kanban, MessageCircle, CreditCard, Mail } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';
import { useSettingsStore } from '../../store/useSettingsStore';
import { NavTab } from '../ui/NavTab';
import { isAvailable, isPro, hasUsedTrial, plan } from '../../hooks/useFeature';
import { UpgradeModal } from '../common/ProBadge';

import { GeneralTab } from './tabs/GeneralTab';
import { TagsStatusesTab } from './tabs/TagsStatusesTab';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { SecurityTab } from './tabs/SecurityTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { FormErrorsTab } from './tabs/FormErrorsTab';
import { ImportTab } from './tabs/ImportTab';
import { MailSmtpTab } from './tabs/MailSmtpTab';
import ExtensionSlot from '../common/ExtensionSlot';

export function SettingsView() {
  const { t, setLanguage } = useI18n();
  const { fetchSettings, saveSettings, isLoading, isSaving, generalLang, securityCaptchas } = useSettingsStore();

  const [activeTab, setActiveTab] = useState(() => {
    const hashParts = window.location.hash.replace('#/', '').split('/');
    if (hashParts[0] === 'settings' && hashParts[1]) {
      return hashParts[1];
    }
    return 'general';
  });
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [wpUsers, setWpUsers] = useState([]);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: null });

  // Feature gate checks for settings tabs
  const canPermissions = isAvailable('settings_permissions');
  const canFloatingBtn = isAvailable('settings_floating_btn');
  const canAbandoned = isAvailable('settings_abandoned');
  const hasHadLicense = isPro || hasUsedTrial || plan === 'trial' || plan === 'pro' || plan === 'expired' || !!window.qoraCrmData?.isPro;

  const TABS = [
    { id: 'general', label: t('tab_general'), icon: <SettingsIcon size={16} /> },
    { id: 'tags', label: t('tab_tags') || 'Tags', icon: <Tag size={18} /> },
    { id: 'statuses', label: t('tab_statuses') || 'Statuses', icon: <Kanban size={18} /> },
    { id: 'integrations', label: t('tab_integrations'), icon: <LinkIcon size={16} /> },
    { id: 'mail_smtp', label: t('tab_mail_smtp') || 'Mail / SMTP', icon: <Mail size={16} /> },
    { id: 'import', label: t('tab_import') || 'Import', icon: <Download size={18} /> },
    { id: 'export', label: <span className="flex items-center gap-1">{t('tab_export') || 'Data & Export'}{!isAvailable('export_leads') && <span title={t('available_in_pro')}>🔒</span>}</span>, icon: <Download size={18} />, locked: !isAvailable('export_leads'), featureKey: 'export_leads', featureLabel: t('export_leads') || 'Export Leads' },
    { id: 'security', label: t('tab_security') || 'Security', icon: <Shield size={16} /> },
    { id: 'permissions', label: t('tab_permissions') || 'Permissions', icon: <Users size={16} /> },
    { id: 'form_errors', label: t('tab_form_errors') || 'Form Errors', icon: <AlertCircle size={18} /> },
    { id: 'floating_button', label: <span className="flex items-center gap-1">{t('floating_button') || 'Floating Button'}{!canFloatingBtn && <span title={t('available_in_pro')}>🔒</span>}</span>, icon: <MessageCircle size={18} />, locked: !canFloatingBtn, featureKey: 'settings_floating_btn', featureLabel: t('floating_button') || 'Floating Button' },
    { id: 'abandoned', label: <span className="flex items-center gap-1">{t('abandoned_forms') || 'Abandoned Forms'}{!canAbandoned && <span title={t('available_in_pro')}>🔒</span>}</span>, icon: <Ghost size={18} />, locked: !canAbandoned, featureKey: 'settings_abandoned', featureLabel: t('abandoned_forms') || 'Abandoned Forms' },
    { id: 'support', label: <span className="flex items-center gap-1">{t('tab_support') || 'Support'}{!isAvailable('premium_support') && <span title={t('available_in_pro')}>🔒</span>}</span>, icon: <MessageSquareWarning size={18} />, locked: !isAvailable('premium_support'), featureKey: 'premium_support', featureLabel: t('premium_support') || 'Premium Support' },
    ...(hasHadLicense ? [{ id: 'subscription', label: <span className="flex items-center gap-1">{t('tab_subscription') || 'License'}</span>, icon: <CreditCard size={18} /> }] : []),
  ];

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    fetchSettings(t);
    fetchWpUsers();
  }, [fetchSettings, t]);

  const fetchWpUsers = async () => {
    try {
      const users = await window.wp?.apiFetch?.({ path: '/qoracrm/v1/settings/all-users' });
      setWpUsers(users || []);
    } catch { /* non-fatal */ }
  };

  const handleSave = useCallback(async () => {
    // Validate Captchas
    if (securityCaptchas?.recaptcha?.enabled && (!securityCaptchas.recaptcha.siteKey || !securityCaptchas.recaptcha.secretKey)) {
      showToast(t('error_missing_captcha_keys') || 'Please enter Site Key and Secret Key for the enabled CAPTCHA.', 'error');
      return false;
    }
    if (securityCaptchas?.turnstile?.enabled && (!securityCaptchas.turnstile.siteKey || !securityCaptchas.turnstile.secretKey)) {
      showToast(t('error_missing_captcha_keys') || 'Please enter Site Key and Secret Key for the enabled CAPTCHA.', 'error');
      return false;
    }
    if (securityCaptchas?.hcaptcha?.enabled && (!securityCaptchas.hcaptcha.siteKey || !securityCaptchas.hcaptcha.secretKey)) {
      showToast(t('error_missing_captcha_keys') || 'Please enter Site Key and Secret Key for the enabled CAPTCHA.', 'error');
      return false;
    }

    const success = await saveSettings();
    if (success) {
      setLanguage(generalLang);
      showToast(t('settings_saved'), 'success');
    } else {
      showToast(t('settings_error'), 'error');
    }
    return success;
  }, [saveSettings, setLanguage, generalLang, securityCaptchas, t]);

  useEffect(() => {
    const handler = async (e) => {
      const ok = await handleSave();
      if (ok && e.detail?.onSuccess) e.detail.onSuccess();
      else if (!ok && e.detail?.onError) e.detail.onError();
    };
    window.addEventListener('qoracrm_request_save', handler);
    return () => window.removeEventListener('qoracrm_request_save', handler);
  }, [handleSave]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">{t('loading')}</div>;
  }

  return (
    <div className="pt-4 md:pt-12 px-3 md:px-8 pb-8 max-w-5xl mx-auto w-full flex flex-col h-full overflow-y-auto relative">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full shadow-lg z-[9999] text-sm font-semibold text-white ${toastType === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{t('settings_title')}</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">{t('settings_description')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-primary text-white shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:bg-primary-dark hover:-translate-y-[1px] transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? t('saving') : t('save_settings')}
        </button>
      </div>

      {/* Body */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Nav */}
        <div className="w-full md:w-56 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-3 md:p-4 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <NavTab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => {
                if (tab.locked) {
                  setUpgradeModal({ open: true, feature: tab.featureLabel });
                  return;
                }
                setActiveTab(tab.id);
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'tags' && <TagsStatusesTab type="tags" showToast={showToast} />}
          {activeTab === 'statuses' && <TagsStatusesTab type="statuses" showToast={showToast} />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'mail_smtp' && <MailSmtpTab />}
          {activeTab === 'import' && <ImportTab />}
          {activeTab === 'export' && <ExtensionSlot name="SettingsTab_export" />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'permissions' && <PermissionsTab wpUsers={wpUsers} />}
          {activeTab === 'form_errors' && <FormErrorsTab />}
          {activeTab === 'floating_button' && <ExtensionSlot name="SettingsTab_floating_button" />}
          {activeTab === 'abandoned' && <ExtensionSlot name="SettingsTab_abandoned" />}
          {activeTab === 'support' && <ExtensionSlot name="SettingsTab_support" />}
          {activeTab === 'subscription' && <ExtensionSlot name="SettingsTab_subscription" />}
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: null })}
        feature={upgradeModal.feature}
      />
    </div>
  );
}
