import { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, ArrowRight, CheckCircle, AlertCircle, Loader2, ArrowDown } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useI18n } from '../../../../utils/I18nContext';
import { showGlobalToast } from '../../../../utils/helpers';
import { useSettingsStore } from '../../../../store/useSettingsStore';
import { ColorPickerInput } from '../../../ui/ColorPickerInput';
import ExtensionSlot from '../../../common/ExtensionSlot';
import { isPro } from '../../../../hooks/useFeature';
import { getDefaultStatuses } from '../../../leads/leadHelpers';

export function CsvImportModal({ onClose }) {
  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const { tags: globalTags, setTags, statuses: configuredStatuses, generalLang } = useSettingsStore();

  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Importing, 4: Done
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [forms, setForms] = useState([]);

  const [unmatchedAssignees, setUnmatchedAssignees] = useState([]);
  const [newUserForms, setNewUserForms] = useState({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Mapping state
  const [selectedFormId, setSelectedFormId] = useState('');
  const [mapping, setMapping] = useState({
    name: '',
    email: '',
    phone: '',
    status: '',
    value: '',
    tags: '',
    comment: '',
    assignee: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    ip: '',
    created_at: '',
  });

  const [customFields, setCustomFields] = useState([]);
  const [statusMapping, setStatusMapping] = useState({});
  const [tagMapping, setTagMapping] = useState({});

  const uniqueCsvStatuses = mapping.status ? Array.from(new Set(
    csvData
      .map(row => row[mapping.status])
      .filter(val => val !== undefined && val !== null && String(val).trim() !== '')
      .map(val => String(val).trim())
  )) : [];

  const uniqueCsvTags = mapping.tags ? Array.from(new Set(
    csvData.flatMap(row => {
      const val = row[mapping.tags];
      if (val === undefined || val === null || String(val).trim() === '') return [];
      return String(val).split(',').map(t => t.trim()).filter(Boolean);
    })
  )) : [];

  useEffect(() => {
    if (!mapping.status || uniqueCsvStatuses.length === 0) {
      setStatusMapping({});
      return;
    }

    const allCrmStatuses = [
      ...getDefaultStatuses(t),
      ...(configuredStatuses || [])
    ];

    const initialMap = {};
    uniqueCsvStatuses.forEach(csvStatus => {
      const lower = csvStatus.toLowerCase();
      const matched = allCrmStatuses.find(s =>
        s.id.toLowerCase() === lower || s.label.toLowerCase() === lower
      );

      if (matched) {
        initialMap[csvStatus] = matched.id;
      } else {
        initialMap[csvStatus] = 'new';
      }
    });

    setStatusMapping(initialMap);
  }, [mapping.status, csvData.length]);

  useEffect(() => {
    if (!mapping.tags || uniqueCsvTags.length === 0) {
      setTagMapping({});
      return;
    }

    const initialTagMap = {};
    uniqueCsvTags.forEach(csvTag => {
      const lower = csvTag.toLowerCase();
      const matched = (globalTags || []).find(tg =>
        tg.id.toLowerCase() === lower || tg.label.toLowerCase() === lower
      );

      if (matched) {
        initialTagMap[csvTag] = matched.id;
      } else {
        initialTagMap[csvTag] = isPro ? '_create_new_' : (globalTags && globalTags[0] ? globalTags[0].id : '');
      }
    });

    setTagMapping(initialTagMap);
  }, [mapping.tags, csvData.length]);

  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 });

  const LEAD_FIELDS = [
    { id: 'name', label: t('name_label') || 'Name' },
    { id: 'email', label: t('email_label') || 'Email' },
    { id: 'phone', label: t('phone') || 'Phone' },
    { id: 'status', label: t('status') || 'Status' },
    { id: 'value', label: t('budget') || 'Budget' },
    { id: 'tags', label: t('tags') || 'Tags (comma separated)' },
    { id: 'comment', label: t('comments') || 'Comment / Note' },
    { id: 'assignee', label: t('assignee') || 'Assignee / Responsible' },
    { id: 'utm_source', label: 'UTM Source' },
    { id: 'utm_medium', label: 'UTM Medium' },
    { id: 'utm_campaign', label: 'UTM Campaign' },
    { id: 'utm_term', label: 'UTM Term' },
    { id: 'utm_content', label: 'UTM Content' },
    { id: 'ip', label: 'IP Address' },
    { id: 'created_at', label: t('creation_date') || 'Creation Date' },
  ];

  useEffect(() => {
    // Fetch forms to populate the dropdown
    window.wp?.apiFetch?.({ path: '/qoracrm/v1/forms' })
      .then(res => {
        setForms(res);
        if (res.length > 0) setSelectedFormId(res[0].id);
      })
      .catch(console.error);
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (!isCsv && !isExcel) {
      showGlobalToast(t('error_invalid_csv') || 'Please upload a valid .csv or .xlsx file.', 'error');
      return;
    }
    setFile(file);

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: handleParsedData,
        error: (err) => {
          console.error(err);
          showGlobalToast('Error parsing CSV', 'error');
        }
      });
    } else if (isExcel) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert sheet to JSON array of objects (using first row as header)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length > 0) {
          const fields = Object.keys(jsonData[0]);
          handleParsedData({ meta: { fields }, data: jsonData });
        } else {
          showGlobalToast('Excel file is empty or missing headers.', 'error');
        }
      } catch (error) {
        console.error(error);
        showGlobalToast('Error parsing Excel file', 'error');
      }
    }
  };

  const handleParsedData = (results) => {
    if (results.meta && results.meta.fields) {
      setCsvHeaders(results.meta.fields);
      setCsvData(results.data);

      // Auto-guess mapping based on common names
      const newMapping = { ...mapping };
      results.meta.fields.forEach(header => {
        const h = String(header).toLowerCase();
        if (h.includes('name')) newMapping.name = header;
        else if (h.includes('email') || h.includes('e-mail')) newMapping.email = header;
        else if (h.includes('phone') || h.includes('tel')) newMapping.phone = header;
        else if (h.includes('status')) newMapping.status = header;
        else if (h.includes('value') || h.includes('price')) newMapping.value = header;
        else if (h.includes('comment') || h.includes('note')) newMapping.comment = header;
        else if (h.includes('assignee') || h.includes('responsible')) newMapping.assignee = header;
        else if (h.includes('source')) newMapping.utm_source = header;
        else if (h.includes('medium')) newMapping.utm_medium = header;
        else if (h.includes('campaign')) newMapping.utm_campaign = header;
        else if (h.includes('term')) newMapping.utm_term = header;
        else if (h.includes('content')) newMapping.utm_content = header;
        else if (h.includes('tag')) newMapping.tags = header;
        else if (h.includes('ip') && !h.includes('zip') && !h.includes('script')) newMapping.ip = header;
        else if (h.includes('date') || h.includes('created')) newMapping.created_at = header;
      });
      setMapping(newMapping);
      setStep(2);
    } else {
      showGlobalToast('Could not read headers.', 'error');
    }
  };

  const proceedToAssignees = async () => {
    if (!selectedFormId) {
      showGlobalToast('Please select a target form.', 'error');
      return;
    }

    if (mapping.assignee) {
      const uniqueAssignees = new Set();
      csvData.forEach(row => {
        const val = row[mapping.assignee];
        if (val && String(val).trim() !== '') {
          uniqueAssignees.add(String(val).trim());
        }
      });

      if (uniqueAssignees.size > 0) {
        try {
          const wpUsers = await window.wp.apiFetch({ path: '/qoracrm/v1/settings/all-users' });
          const unmatched = [];

          uniqueAssignees.forEach(csvName => {
            const lowerCsv = csvName.toLowerCase();
            const matched = wpUsers.find(u =>
              String(u.name).toLowerCase() === lowerCsv ||
              String(u.email).toLowerCase() === lowerCsv
            );
            if (!matched) {
              unmatched.push(csvName);
            }
          });

          if (unmatched.length > 0) {
            setUnmatchedAssignees(unmatched);
            setStep(3);
            return;
          }
        } catch (e) {
          console.error('Failed to fetch users', e);
        }
      }
    }

    executeImport();
  };

  const executeImport = async () => {
    setStep(4);

    // 1. Pre-process Tags
    let currentTags = [...globalTags];
    let tagsChanged = false;

    if (mapping.tags && uniqueCsvTags.length > 0) {
      uniqueCsvTags.forEach(tagName => {
        if (tagMapping[tagName] === '_create_new_' && isPro) {
          const existing = currentTags.find(t => t.label.toLowerCase() === tagName.toLowerCase());
          if (!existing) {
            const newId = 'tag_' + Math.random().toString(36).substr(2, 9);
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            currentTags.push({ id: newId, label: tagName, color });
            tagMapping[tagName] = newId;
            tagsChanged = true;
          } else {
            tagMapping[tagName] = existing.id;
          }
        }
      });

      if (tagsChanged) {
        setTags(currentTags);
        try {
          const currentSettingsRes = await window.wp.apiFetch({ path: '/qoracrm/v1/settings' });
          const newSettings = { ...currentSettingsRes, tags: currentTags };
          await window.wp.apiFetch({
            path: '/qoracrm/v1/settings',
            method: 'POST',
            data: newSettings
          });
        } catch (e) {
          console.error('Failed to save new tags', e);
        }
      }
    }

    // Prepare data based on mapping
    const leadsToImport = csvData.map(row => {
      const meta_data = {};
      const custom_entry_data = {};

      // Process Tags for this row
      if (mapping.tags && row[mapping.tags]) {
        const rowTags = String(row[mapping.tags]).split(',').map(t => t.trim()).filter(Boolean);
        const tagIds = [];

        rowTags.forEach(tagName => {
          const mappedVal = tagMapping[tagName];
          if (mappedVal && mappedVal !== '_create_new_') {
            tagIds.push(mappedVal);
          } else {
            const matched = currentTags.find(t => t.label.toLowerCase() === tagName.toLowerCase());
            if (matched) {
              tagIds.push(matched.id);
            }
          }
        });

        if (tagIds.length > 0) {
          meta_data.tags = tagIds;
        }
      }

      // Unmapped columns are ignored as requested by user

      // Handle custom fields mapped into custom_entry_data
      customFields.forEach(cf => {
        if (cf.label && cf.csvColumn) {
          const val = row[cf.csvColumn];
          if (val && String(val).trim() !== '') {
            custom_entry_data[cf.label] = val;
          }
        }
      });

      return {
        name: row[mapping.name] || '',
        email: row[mapping.email] || '',
        phone: row[mapping.phone] || '',
        status: row[mapping.status] || 'new',
        value: row[mapping.value] || '0',
        comment: row[mapping.comment] || '',
        assignee: row[mapping.assignee] || '',
        utm_source: row[mapping.utm_source] || '',
        utm_medium: row[mapping.utm_medium] || '',
        utm_campaign: row[mapping.utm_campaign] || '',
        utm_term: row[mapping.utm_term] || '',
        utm_content: row[mapping.utm_content] || '',
        ip: row[mapping.ip] || '',
        created_at: row[mapping.created_at] || '',
        tags: row[mapping.tags] || '',
        custom_entry_data,
        meta_data
      };
    });

    const BATCH_SIZE = 50;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < leadsToImport.length; i += BATCH_SIZE) {
      const batch = leadsToImport.slice(i, i + BATCH_SIZE);
      try {
        const response = await window.wp.apiFetch({
          path: '/qoracrm/v1/import/csv',
          method: 'POST',
          data: {
            form_id: selectedFormId,
            leads: batch,
            status_mapping: statusMapping
          }
        });
        successCount += response.success || batch.length;
      } catch (e) {
        console.error('Batch import error:', e);
        failedCount += batch.length;
      }
      setImportProgress(Math.round(((i + batch.length) / leadsToImport.length) * 100));
    }

    setImportStats({ success: successCount, failed: failedCount });
    setStep(5);
  };

  const handleCreateUser = async (assigneeName) => {
    const formData = newUserForms[assigneeName];
    if (!formData || !formData.email) {
      showGlobalToast('Email is required', 'error');
      return;
    }

    setIsCreatingUser(true);
    try {
      await window.wp.apiFetch({
        path: '/qoracrm/v1/settings/create-user',
        method: 'POST',
        data: {
          name: assigneeName,
          email: formData.email,
          role: formData.role || 'qoracrm_manager',
          color: formData.color || '#3b82f6'
        }
      });
      showGlobalToast(t('user_created') || 'User created successfully', 'success');
      setUnmatchedAssignees(prev => prev.filter(a => a !== assigneeName));

      // If all matched, proceed
      if (unmatchedAssignees.length <= 1) {
        executeImport();
      }
    } catch (e) {
      showGlobalToast(e.message || 'Error creating user', 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] min-h-[600px] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UploadCloud size={20} className="text-primary" />
            {t('import_csv') || 'Import CSV / Excel'}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="w-full max-w-lg border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-primary">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('drag_drop_csv') || 'Drag & drop CSV or Excel file here'}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('or_click_to_browse') || 'or click to browse from your computer'}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-white border border-gray-200 shadow-sm rounded-full text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                  {t('select_file') || 'Select File'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{t('csv_loaded_success') || 'File loaded successfully!'}</p>
                  <p className="text-sm opacity-80 mt-1">Found {csvData.length} rows. Please map your columns to the CRM fields.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('select_target_form') || 'Target Form'}</label>
                <select
                  value={selectedFormId}
                  onChange={e => setSelectedFormId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all mb-6"
                >
                  <option value="" disabled>{t('select_form') || 'Select a form...'}</option>
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>{f.title} (ID: {f.id})</option>
                  ))}
                </select>
              </div>

              {((mapping.status && uniqueCsvStatuses.length > 0) || (mapping.tags && uniqueCsvTags.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                  {mapping.status && uniqueCsvStatuses.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white p-4 flex flex-col">
                      <div className="mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{t('status_mapping_title') || 'Status Mapping'}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        {t('status_mapping_desc') || 'Map the unique status values found in your CSV file to existing pipeline statuses in QoraCRM.'}
                      </p>
                      {!isPro && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 mb-1">
                          🔒 {t('create_status_pro_only') || 'Creating new statuses requires Pro'}
                        </span>
                      )}
                      <div className="space-y-3 flex-1">
                        {uniqueCsvStatuses.map(csvStatus => {
                          const allCrmStatuses = [
                            ...getDefaultStatuses(t),
                            ...(configuredStatuses || [])
                          ];
                          const uniqueCrmStatuses = Array.from(new Map(allCrmStatuses.map(s => [s.id, s])).values());

                          return (
                            <div key={csvStatus} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-stretch">
                              <div className="font-semibold text-gray-800 text-sm truncate text-center" title={csvStatus}>
                                "{csvStatus}"
                              </div>
                              <div className="flex justify-center text-gray-400 py-1">
                                <ArrowDown size={14} />
                              </div>
                              <select
                                value={statusMapping[csvStatus] || 'new'}
                                onChange={e => setStatusMapping({ ...statusMapping, [csvStatus]: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                              >
                                {uniqueCrmStatuses.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.label} ({s.id})
                                  </option>
                                ))}
                                <ExtensionSlot name="CsvCreateNewStatusOption" csvStatus={csvStatus} t={t} fallback={null} />
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {mapping.tags && uniqueCsvTags.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white p-4 flex flex-col">
                      <div className="mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{t('tag_mapping_title') || 'Tag Mapping'}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        {t('tag_mapping_desc') || 'Map the unique tag values found in your CSV file to existing tags in QoraCRM.'}
                      </p>
                      {!isPro && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          🔒 {t('create_tag_pro_only') || 'Creating new tags requires Pro'}
                        </span>
                      )}
                      <div className="space-y-3 flex-1">
                        {uniqueCsvTags.map(csvTag => {
                          return (
                            <div key={csvTag} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-stretch">
                              <div className="font-semibold text-gray-800 text-sm truncate text-center" title={csvTag}>
                                "{csvTag}"
                              </div>
                              <div className="flex justify-center text-gray-400 py-1">
                                <ArrowDown size={14} />
                              </div>
                              <select
                                value={tagMapping[csvTag] || ''}
                                onChange={e => setTagMapping({ ...tagMapping, [csvTag]: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                              >
                                <option value="">-- {t('ignore') || 'Ignore'} --</option>
                                {(globalTags || []).map(tg => (
                                  <option key={tg.id} value={tg.id}>
                                    {tg.label}
                                  </option>
                                ))}
                                <ExtensionSlot name="CsvCreateNewTagOption" csvTag={csvTag} t={t} fallback={null} />
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('map_columns') || 'Map Columns'}</h3>
              <p className="text-gray-500 mb-6 max-w-lg mx-auto">
                {t('map_columns_desc') || 'Match the columns from your file to the fields in QoraCRM.'}<br />
                <span className="text-sm font-medium text-red-500">{t('unmapped_ignored') || 'Unmapped columns will not be imported.'}</span>
              </p>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                      <th className="font-semibold px-4 py-3 w-1/2">QoraCRM Field</th>
                      <th className="font-semibold px-4 py-3 w-1/2">{t('file_column') || 'File Column'}</th>
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
                            {csvHeaders.map(h => {
                              let example = '';
                              for (const row of csvData) {
                                if (row[h] !== undefined && row[h] !== null && String(row[h]).trim() !== '') {
                                  example = String(row[h]).trim();
                                  if (example.length > 20) example = example.substring(0, 20) + '...';
                                  break;
                                }
                              }
                              return (
                                <option key={h} value={h}>
                                  {h} {example ? `(${example})` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {customFields.map((cf, index) => (
                      <tr key={`cf_${index}`} className="hover:bg-gray-50/50 bg-blue-50/20">
                        <td className="px-4 py-3 font-medium text-gray-700">
                          <input
                            type="text"
                            placeholder="Custom Field Name"
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
                            value={cf.csvColumn}
                            onChange={e => {
                              const newCf = [...customFields];
                              newCf[index].csvColumn = e.target.value;
                              setCustomFields(newCf);
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                          >
                            <option value="">-- {t('ignore') || 'Ignore'} --</option>
                            {csvHeaders.map(h => {
                              let example = '';
                              for (const row of csvData) {
                                if (row[h] !== undefined && row[h] !== null && String(row[h]).trim() !== '') {
                                  example = String(row[h]).trim();
                                  if (example.length > 20) example = example.substring(0, 20) + '...';
                                  break;
                                }
                              }
                              return (
                                <option key={h} value={h}>
                                  {h} {example ? `(${example})` : ''}
                                </option>
                              );
                            })}
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
                    onClick={() => setCustomFields([...customFields, { label: '', csvColumn: '' }])}
                    className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    {t('add_custom_field') || '+ Add Custom Field'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('map_assignees') || 'Map Assignees'}</h3>
                <p className="text-gray-500">{t('map_assignees_desc') || 'We found users in your file that do not exist in the CRM.'}</p>
              </div>

              <div className="space-y-4">
                {unmatchedAssignees.map(assignee => (
                  <div key={assignee} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{t('name_label') || 'Name'}</label>
                      <input type="text" disabled value={assignee} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{t('email_label') || 'Email'}</label>
                      <input type="email"
                        value={newUserForms[assignee]?.email || ''}
                        onChange={e => setNewUserForms(prev => ({ ...prev, [assignee]: { ...prev[assignee], email: e.target.value } }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="shrink-0">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{t('color') || 'Color'}</label>
                      <div className="h-[38px] flex items-center">
                        <ColorPickerInput
                          color={newUserForms[assignee]?.color || '#3b82f6'}
                          onChange={newColor => setNewUserForms(prev => ({ ...prev, [assignee]: { ...prev[assignee], color: newColor } }))}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{t('role') || 'Role'}</label>
                      <select
                        value={newUserForms[assignee]?.role || 'qoracrm_manager'}
                        onChange={e => setNewUserForms(prev => ({ ...prev, [assignee]: { ...prev[assignee], role: e.target.value } }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary"
                      >
                        <option value="qoracrm_manager">{t('crm_manager') || 'CRM Manager'}</option>
                        <option value="administrator">{t('administrator') || 'Administrator'}</option>
                      </select>
                    </div>
                    <button
                      disabled={isCreatingUser || !newUserForms[assignee]?.email}
                      onClick={() => handleCreateUser(assignee)}
                      className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {t('create_user') || 'Create User'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 size={48} className="text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('importing_data') || 'Importing Data...'}</h3>
              <p className="text-gray-500 mb-8">Please wait while we process your leads. Do not close this window.</p>

              <div className="w-full max-w-md bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                <div className="bg-primary h-3 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
              </div>
              <span className="text-sm font-bold text-gray-700">{importProgress > 100 ? 100 : importProgress}%</span>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('import_complete') || 'Import Complete!'}</h3>
              <p className="text-gray-600 mb-8 max-w-sm">
                Successfully imported <strong>{importStats.success}</strong> leads.
                {importStats.failed > 0 && <span className="text-red-500 ml-1">Failed to import {importStats.failed} leads.</span>}
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
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              {t('back') || 'Back'}
            </button>
            <button
              onClick={proceedToAssignees}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-semibold rounded-full shadow-sm hover:bg-primary-dark transition-colors"
            >
              {t('start_import') || 'Start Import'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
              disabled={isCreatingUser}
            >
              {t('back') || 'Back'}
            </button>
            <button
              onClick={executeImport}
              className="flex items-center gap-2 px-6 py-2 bg-white text-gray-700 border border-gray-200 text-sm font-semibold rounded-full shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isCreatingUser}
            >
              {t('skip_and_import') || 'Skip & Import'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
