import { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '../../../../utils/I18nContext';
import { showGlobalToast, parseComplexFieldValue } from '../../../../utils/helpers';

/**
 * Universal Submissions Import Modal — replaces 8 individual *SubmissionsImportModal.jsx files.
 * Handles two patterns:
 *   1. Channel-based (Flamingo): useChannels=true → loads channels → picks one → map fields → import
 *   2. Form-based (all others): pick source form + target form → fetch stats/fields → map → import
 * And two field formats:
 *   - 'string': fields are plain strings
 *   - 'object': fields are {id/key, label} objects
 */
export function SubmissionsImportModal({ config, onClose }) {
  const { t } = useI18n();

  const [step, setStep] = useState(1); // 1: Select, 2: Map, 3: Importing, 4: Done

  // Source plugin forms (non-Flamingo)
  const [sourceForms, setSourceForms] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [isLoadingSource, setIsLoadingSource] = useState(true);

  // QoraCRM target forms
  const [qoraForms, setQoraForms] = useState([]);
  const [selectedQoraFormId, setSelectedQoraFormId] = useState('');

  // Flamingo channels
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isFetchingFields, setIsFetchingFields] = useState(false);

  // Fields & mapping
  const [sourceFields, setSourceFields] = useState([]);
  const [sourceExamples, setSourceExamples] = useState({});
  const [mapping, setMapping] = useState({
    name: '', email: '', phone: '', status: '', value: '', tags: '', comment: '', assignee: '', created_at: '',
  });
  const [customFields, setCustomFields] = useState([]);

  // Import stats
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, spam: 0 });
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [isCheckingStats, setIsCheckingStats] = useState(false);

  const LEAD_FIELDS = [
    { id: 'name', label: t('name_label') || 'Name' },
    { id: 'email', label: t('email_label') || 'Email' },
    { id: 'phone', label: t('phone') || 'Phone' },
    { id: 'status', label: t('status') || 'Status' },
    { id: 'value', label: t('budget') || 'Budget' },
    { id: 'tags', label: t('lead_tags') || 'Tags (comma separated)' },
    { id: 'comment', label: t('comments') || 'Comment / Note' },
    { id: 'assignee', label: t('lead_assignee') || 'Assignee / Responsible' },
    { id: 'utm_source', label: 'UTM Source' },
    { id: 'utm_medium', label: 'UTM Medium' },
    { id: 'utm_campaign', label: 'UTM Campaign' },
    { id: 'utm_term', label: 'UTM Term' },
    { id: 'utm_content', label: 'UTM Content' },
  ];

  // ─── Helpers for field format abstraction ──────────────────────────
  const getFieldId = (field) => {
    if (config.fieldFormat === 'object') {
      return field[config.fieldIdKey || 'id'];
    }
    return field; // string format
  };

  const getFieldLabel = (field) => {
    if (config.fieldFormat === 'object') {
      return field[config.fieldLabelKey || 'label'] || getFieldId(field);
    }
    return field; // string format
  };

  const getFieldExample = (field) => {
    if (config.useObjectExamples && config.fieldFormat === 'object') {
      return field.example || '';
    }
    if (config.useComplexExamples && sourceExamples && sourceExamples.length > 0) {
      const raw = sourceExamples[0]?.[getFieldId(field)];
      if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
        return parseComplexFieldValue(raw);
      }
      return raw || '';
    }
    return sourceExamples[getFieldId(field)] || '';
  };

  const autoMapFields = (fields) => {
    const newMapping = { ...mapping };
    const autoMapped = new Set();

    fields.forEach(field => {
      const label = String(getFieldLabel(field)).toLowerCase();
      const id = getFieldId(field);
      if (label.includes('name')) { newMapping.name = id; autoMapped.add(id); }
      else if (label.includes('email') || label.includes('e-mail')) { newMapping.email = id; autoMapped.add(id); }
      else if (label.includes('phone') || label.includes('tel')) { newMapping.phone = id; autoMapped.add(id); }
    });
    setMapping(newMapping);

    const newCustomFields = [];
    fields.forEach(field => {
      const id = getFieldId(field);
      if (!autoMapped.has(id)) {
        newCustomFields.push({ label: getFieldLabel(field), flamingoField: id });
      }
    });
    setCustomFields(newCustomFields);
  };

  // ─── Data fetching ─────────────────────────────────────────────────
  useEffect(() => {
    // Fetch QoraCRM forms (always needed)
    window.wp?.apiFetch?.({ path: '/qoracrm/v1/forms' })
      .then(res => {
        setQoraForms(res);
        if (res.length > 0) setSelectedQoraFormId(res[0].id);
      })
      .catch(console.error);

    if (config.useChannels) {
      // Flamingo: fetch channels
      window.wp?.apiFetch?.({ path: config.fetchChannelsPath })
        .then(res => {
          setChannels(res);
          if (res.length > 0) setSelectedChannel(res[0]?.channel || 'All Flamingo Submissions');
          setIsLoadingChannels(false);
        })
        .catch(err => {
          console.error(err);
          showGlobalToast(t(config.errorFetchKey) || config.errorFetchFallback, 'error');
          setIsLoadingChannels(false);
        });
    } else {
      // Standard: fetch source plugin forms
      window.wp?.apiFetch?.({ path: config.sourceFormsPath })
        .then(res => {
          setSourceForms(res);
          if (res.length > 0) setSelectedSourceId(res[0].id);
          setIsLoadingSource(false);
        })
        .catch(err => {
          console.error(err);
          showGlobalToast(t(config.errorFetchKey) || config.errorFetchFallback, 'error');
          setIsLoadingSource(false);
        });
    }
  }, [t, config]);

  // ─── Step transitions ──────────────────────────────────────────────

  // Flamingo: channel selected → fetch fields → step 2
  const handleSelectChannel = async () => {
    if (!selectedChannel || !selectedQoraFormId) {
      showGlobalToast(t('select_both_forms') || 'Please select both a source channel and a target form.', 'error');
      return;
    }
    setIsFetchingFields(true);
    try {
      const res = await window.wp.apiFetch({
        path: `${config.fetchFieldsPath}?${config.fetchFieldsParam}=${encodeURIComponent(selectedChannel)}`
      });
      setSourceFields(res.fields || []);
      setSourceExamples(res.examples || {});
      autoMapFields(res.fields || []);
      setStep(2);
    } catch (e) {
      showGlobalToast(e.message || 'Failed to fetch fields', 'error');
    } finally {
      setIsFetchingFields(false);
    }
  };

  // Standard: forms selected → check stats → fetch fields → step 2
  const handleSelectForms = async () => {
    if (!selectedSourceId || !selectedQoraFormId) {
      showGlobalToast('Please select both forms.', 'error');
      return;
    }
    setIsCheckingStats(true);
    try {
      const statsRes = await window.wp.apiFetch({
        path: `${config.statsPath}?${config.statsParam}=${encodeURIComponent(selectedSourceId)}`
      });
      const count = statsRes[config.statsCountField] || 0;
      setSubmissionsCount(count);

      if (count === 0) {
        showGlobalToast(t(config.noSubmissionsKey) || config.noSubmissionsFallback, 'error');
        setIsCheckingStats(false);
        return;
      }

      const fieldsRes = await window.wp.apiFetch({
        path: `${config.fieldsPath}?${config.fieldsParam}=${encodeURIComponent(selectedSourceId)}`
      });

      const fields = fieldsRes.fields || fieldsRes || [];
      setSourceFields(fields);
      setSourceExamples(fieldsRes.examples || {});
      autoMapFields(fields);
      setStep(2);
    } catch (e) {
      showGlobalToast(e.message || 'Failed to fetch stats', 'error');
    } finally {
      setIsCheckingStats(false);
    }
  };

  // Execute import
  const executeImport = async () => {
    if (!config.useChannels && !selectedQoraFormId) {
      showGlobalToast('Please select a target form.', 'error');
      return;
    }
    setStep(3);
    try {
      const data = {
        mapping: mapping,
        custom_fields: customFields.filter(f => f.label && f.flamingoField),
      };

      if (config.useChannels) {
        data[config.executeIdParam] = selectedChannel;
        data.form_id = selectedQoraFormId;
      } else {
        data[config.executeIdParam] = selectedSourceId;
        data.qoracrm_form_id = selectedQoraFormId;
      }

      const response = await window.wp.apiFetch({
        path: config.executePath,
        method: 'POST',
        data,
      });

      setImportStats({
        success: response.success_count || response.success || response.imported || 0,
        failed: response.failed_count || response.failed || 0,
        spam: response.spam_count || response.spam || 0,
      });
      setStep(4);
    } catch (e) {
      console.error('Import error:', e);
      showGlobalToast(e.message || 'Import failed', 'error');
      setStep(1);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────

  const renderFieldOption = (field) => {
    const id = getFieldId(field);
    const label = getFieldLabel(field);
    const example = getFieldExample(field);
    const exampleStr = example
      ? `(${String(example).length > 40 ? String(example).substring(0, 40) + '...' : example})`
      : '';
    return (
      <option key={id} value={id}>
        {label} {exampleStr}
      </option>
    );
  };

  // ─── JSX ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            {t(config.titleKey) || config.titleFallback}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">

          {/* ═══ STEP 1: SELECT ═══ */}
          {step === 1 && config.useChannels && (
            /* Flamingo: channel-based step 1 */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(config.titleKey) || config.titleFallback}</h3>

                {isLoadingChannels ? (
                  <div className="flex items-center gap-2 text-gray-500 mb-6">
                    <Loader2 size={16} className="animate-spin" /> {t('loading_channels') || 'Loading channels...'}
                  </div>
                ) : channels.length === 0 || channels[0]?.count === 0 ? (
                  <div className="bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{t(config.noDataKey) || config.noDataFallback}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="qoracrm-csv-loaded-msg bg-green-50/50 border border-green-100 rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <strong className="text-gray-900 text-lg block mb-1">
                          {t(config.titleKey) || 'Data Loaded'}
                        </strong>
                        <p className="text-gray-600">
                          {(channels.find(c => c.channel === selectedChannel) || channels[0])?.count || 0} {t('submissions') || 'submissions'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{!t('source_channel') || t('source_channel') === 'source_channel' ? 'Источник: Форма / Канал Flamingo' : t('source_channel')}</label>
                      <select
                        value={selectedChannel}
                        onChange={e => setSelectedChannel(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                      >
                        {channels.map(c => (
                          <option key={c.channel} value={c.channel}>
                            {c.channel} ({c.count} {t('submissions') || 'submissions'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{t('select_target_form') || 'Target Form'}</label>
                      <select
                        value={selectedQoraFormId}
                        onChange={e => setSelectedQoraFormId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                      >
                        <option value="" disabled>{t('select_form') || 'Select a form...'}</option>
                        {qoraForms.map(f => (
                          <option key={f.id} value={f.id}>{f.title} (ID: {f.id})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleSelectChannel}
                      disabled={isFetchingFields || !selectedChannel || !selectedQoraFormId}
                      className="w-full px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {isFetchingFields ? (t('loading') || 'Loading...') : (t('next_step') || 'Next Step')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && !config.useChannels && (
            /* Standard: form-based step 1 */
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                {t(config.descKey) || config.descFallback}
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('source_form') || config.sourceFormLabel || 'Source Form'}</label>
                {isLoadingSource ? (
                  <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 animate-pulse">Loading forms...</div>
                ) : (
                  <select
                    value={selectedSourceId}
                    onChange={e => setSelectedSourceId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                  >
                    <option value="" disabled>{t('select_form') || 'Select a form...'}</option>
                    {sourceForms.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.title || `Form #${f.id}`}{config.sourceFormShowId ? ` (ID: ${f.id})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('target_qoracrm_form') || 'Target: QoraCRM Form'}</label>
                <select
                  value={selectedQoraFormId}
                  onChange={e => setSelectedQoraFormId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                >
                  <option value="" disabled>{t('select_form') || 'Select a form...'}</option>
                  {qoraForms.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSelectForms}
                  disabled={isCheckingStats || isLoadingSource || sourceForms.length === 0 || qoraForms.length === 0}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCheckingStats ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ArrowRight size={16} />}
                  {t('next_step') || 'Next Step'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: MAP FIELDS ═══ */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-semibold text-sm">
                    {config.useChannels
                      ? `${channels[0]?.count || 0} ${t('submissions') || 'submissions'}`
                      : `Found ${submissionsCount} ${t('submissions') || 'submissions'}`
                    }
                  </p>
                  <p className="text-sm opacity-80 mt-1">{t('map_source_fields') || 'Please map fields to QoraCRM fields.'}</p>
                </div>
              </div>

              {/* Target form selector (Flamingo already selected in step 1, but show for standard if not) */}
              {config.useChannels && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('select_target_form') || 'Target Form'}</label>
                  <select
                    value={selectedQoraFormId}
                    onChange={e => setSelectedQoraFormId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                  >
                    <option value="" disabled>{t('select_form') || 'Select a form...'}</option>
                    {qoraForms.map(f => (
                      <option key={f.id} value={f.id}>{f.title} (ID: {f.id})</option>
                    ))}
                  </select>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('map_fields') || 'Map Fields'}</h3>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                      <th className="font-semibold px-4 py-3 w-1/2">QoraCRM Field</th>
                      <th className="font-semibold px-4 py-3 w-1/2">{config.sourceColumnLabel || 'Source Field'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {LEAD_FIELDS.map(field => (
                      <tr key={field.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-700">{field.label}</td>
                        <td className="px-4 py-3">
                          <select
                            value={mapping[field.id]}
                            onChange={(e) => setMapping({ ...mapping, [field.id]: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                          >
                            <option value="">-- {t('ignore') || 'Ignore'} --</option>
                            {sourceFields.map(f => renderFieldOption(f))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {customFields.map((cf, index) => (
                      <tr key={`cf_${index}`} className="hover:bg-gray-50/50 bg-blue-50/20">
                        <td className="px-4 py-3 font-medium text-gray-700">
                          <input
                            type="text"
                            placeholder={t('custom_field_name') || 'Custom Field Name'}
                            value={cf.label}
                            onChange={e => {
                              const newCf = [...customFields];
                              newCf[index].label = e.target.value;
                              setCustomFields(newCf);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <select
                            value={cf.flamingoField}
                            onChange={e => {
                              const newCf = [...customFields];
                              newCf[index].flamingoField = e.target.value;
                              setCustomFields(newCf);
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                          >
                            <option value="">-- {t('ignore') || 'Ignore'} --</option>
                            {sourceFields.map(f => renderFieldOption(f))}
                          </select>
                          <button
                            onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => setCustomFields([...customFields, { label: '', flamingoField: '' }])}
                    className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    {t('add_custom_field') || '+ Add Custom Field'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: IMPORTING ═══ */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 size={48} className="text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('importing_data') || 'Importing Data...'}</h3>
              <p className="text-gray-500 mb-8">{t('please_wait_import') || 'Please wait while we process your leads. Do not close this window.'}</p>
            </div>
          )}

          {/* ═══ STEP 4: DONE ═══ */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('import_complete') || 'Import Complete!'}</h3>
              <p className="text-gray-600 mb-8 max-w-sm">
                {t('successfully_imported') || 'Successfully imported'} <strong>{importStats.success}</strong> {t('leads') || 'leads.'}
                {importStats.failed > 0 && <span className="text-red-500 ml-1">{t('failed_to_import') || 'Failed to import'} {importStats.failed} {t('leads') || 'leads.'}</span>}
                {importStats.spam > 0 && <span className="block mt-2 text-orange-600 font-medium text-sm border-t border-gray-100 pt-2">{importStats.spam} {t('imported_as_spam') || 'leads were automatically moved to Spam.'}</span>}
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-md hover:bg-primary-dark transition-colors"
              >
                {t('close') || 'Close'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              {t('back') || 'Back'}
            </button>
            <button
              onClick={executeImport}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-semibold rounded-full shadow-sm hover:bg-primary-dark transition-colors"
            >
              {t('start_import') || 'Start Import'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
