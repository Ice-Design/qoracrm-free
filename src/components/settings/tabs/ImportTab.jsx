import { useState, useEffect } from 'react';
import { UploadCloud, FileText, Blocks, Plug } from 'lucide-react';
import { useI18n } from '../../../utils/I18nContext';
import { CsvImportModal } from './modals/CsvImportModal';
import { FormImportModal } from './modals/FormImportModal';
import { SubmissionsImportModal } from './modals/SubmissionsImportModal';
import { FORM_IMPORT_CONFIGS, SUBMISSIONS_IMPORT_CONFIGS } from './modals/importConfigs';
import { showGlobalToast } from '../../../utils/helpers';

export function ImportTab() {
  const { t } = useI18n();
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('openCf7Modal') === 'true') {
      localStorage.removeItem('openCf7Modal');
      const isCf7Active = window.qoraCrmData?.is_cf7_active || false;
      if (isCf7Active) {
        setActiveModal('cf7');
      }
    }
  }, []);

  const FORMS_PLUGINS = [
    { id: 'elementor', name: 'Elementor Forms', icon: '🌀' },
    { id: 'fluentforms', name: 'Fluent Forms', icon: '📝' },
    { id: 'wpforms', name: 'WPForms', icon: '🐻' },
    { id: 'ninja_forms', name: 'Ninja Forms', icon: '🥷' },
    { id: 'gravity_forms', name: 'Gravity Forms', icon: '🚀' },
    { id: 'cf7', name: 'Contact Form 7', icon: '🗻' },
    { id: 'formidable', name: 'Formidable Forms', icon: '📋' },
    { id: 'forminator', name: 'Forminator Forms', icon: '🤖' },
    { id: 'sureforms', name: 'SureForms', icon: '✨' },
  ];

  const LEADS_PLUGINS = [
    { id: 'elementor_leads', name: 'Elementor Leads', icon: '🌀' },
    { id: 'fluentforms_leads', name: 'Fluent Forms Leads', icon: '📝' },
    { id: 'wpforms_leads', name: 'WPForms Leads', icon: '🐻' },
    { id: 'ninja_leads', name: 'Ninja Forms Leads', icon: '🥷' },
    { id: 'gravity_leads', name: 'Gravity Forms Leads', icon: '🚀' },
    { id: 'flamingo', name: 'Flamingo', icon: '🦩' },
    { id: 'formidable_leads', name: 'Formidable Forms Leads', icon: '📋' },
    { id: 'forminator_leads', name: 'Forminator Forms Leads', icon: '🤖' },
    { id: 'sureforms_leads', name: 'SureForms Leads', icon: '✨' },
  ];

  const CRMS = [
    { id: 'amocrm', name: 'AmoCRM', icon: '☁️' },
    { id: 'hubspot', name: 'HubSpot', icon: '☁️' },
    { id: 'bitrix24', name: 'Bitrix24', icon: '☁️' },
  ];

  const openCsvModal = () => setActiveModal('csv');

  const openPluginModal = (plugin) => {
    // CF7 requires active plugin check
    if (plugin.id === 'cf7') {
      const isCf7Active = window.qoraCrmData?.is_cf7_active || false;
      if (!isCf7Active) {
        showGlobalToast(t('cf7_not_installed') || 'Contact Form 7 plugin is not installed or active on this site.', 'error');
        return;
      }
    }

    // Check if this plugin has a config (form import or submissions import)
    if (FORM_IMPORT_CONFIGS[plugin.id] || SUBMISSIONS_IMPORT_CONFIGS[plugin.id]) {
      setActiveModal(plugin.id);
      return;
    }

    showGlobalToast(`Import from ${plugin.name} will be available in future updates!`, 'info');
  };

  const closeModal = () => setActiveModal(null);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('import_export') || 'Import / Export'}</h2>
        <p className="text-sm text-gray-500 mb-8">{t('import_export_desc') || 'Import leads and forms from external files or other systems.'}</p>

        {/* File Upload Section */}
        <div className="mb-10">
          <div className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={16} />
            {t('file_upload') || 'File Upload'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={openCsvModal}
              className="bg-white border border-gray-200 hover:border-primary hover:shadow-sm rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-primary-light text-gray-400 group-hover:text-primary flex items-center justify-center mb-3 transition-colors">
                <UploadCloud size={24} />
              </div>
              <span className="font-semibold text-gray-900">{t('csv_excel') || 'CSV / Excel'}</span>
              <span className="text-xs text-gray-500 mt-1">{t('import_csv_desc') || 'Upload .csv file with leads data'}</span>
            </button>
          </div>
        </div>

        {/* WordPress Forms Section */}
        <div className="mb-10">
          <div className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Blocks size={16} />
            {t('wordpress_forms') || 'WordPress Forms'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FORMS_PLUGINS.map(plugin => (
              <button
                key={plugin.id}
                onClick={() => openPluginModal(plugin)}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-gray-100 transition-colors">
                  {plugin.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{plugin.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* WordPress Leads Section */}
        <div className="mb-10">
          <div className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Blocks size={16} />
            {t('wordpress_leads') || 'WordPress Leads'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LEADS_PLUGINS.map(plugin => (
              <button
                key={plugin.id}
                onClick={() => openPluginModal(plugin)}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-gray-100 transition-colors">
                  {plugin.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{plugin.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* External CRMs Section (Hidden for now) */}
        {/*
        <div>
          <div className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plug size={16} />
            {t('external_crms') || 'External CRMs'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {CRMS.map(crm => (
              <button
                key={crm.id}
                onClick={() => openPluginModal(crm)}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-gray-100 transition-colors">
                  {crm.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{crm.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        */}

        {/* ── Modal rendering ── */}
        {activeModal === 'csv' && (
          <CsvImportModal onClose={closeModal} t={t} />
        )}

        {FORM_IMPORT_CONFIGS[activeModal] && (
          <FormImportModal
            config={FORM_IMPORT_CONFIGS[activeModal]}
            onClose={closeModal}
            t={t}
          />
        )}

        {SUBMISSIONS_IMPORT_CONFIGS[activeModal] && (
          <SubmissionsImportModal
            config={SUBMISSIONS_IMPORT_CONFIGS[activeModal]}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
}
