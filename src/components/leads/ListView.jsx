import React, { useState, useEffect } from 'react';
import { Trash2, Server, X, ChevronUp, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext.jsx';
import { formatCrmDate, formatLeadName, getLeadDisplayName, getLeadEmail, getLeadPhone, getLeadTotalValue } from '../../utils/helpers';
import { StatusDropdown } from '../ui/StatusDropdown';
import { CustomSelect } from '../ui/CustomSelect';
import { getPermissions, createHistoryEntry } from './leadHelpers';
import { useSettingsStore } from '../../store/useSettingsStore';
import { isPro } from '../../hooks/useFeature';
import { UpgradeModal, ProLockIcon } from '../common/ProBadge';
import ExtensionSlot from '../common/ExtensionSlot';

export function ListView({ leads, onSelect, updateStatus, selectedLeadId, globalTags, globalStatuses, fieldMap, viewMode, deleteLeadPermanently, handleMoveToArchive, setLeads, fetchLeads, setConfirmAction, crmUsers }) {
  const { t } = useI18n();
  const permissions = getPermissions();
  const { generalCurrency } = useSettingsStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkActionType, setBulkActionType] = useState('status'); // 'status', 'assign', 'tag'
  const [bulkActionValue, setBulkActionValue] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [hiddenCols, setHiddenCols] = useState(() => {
    try {
      const saved = localStorage.getItem('qoracrm_hidden_columns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('qoracrm_column_order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleColumn = (key) => {
    setHiddenCols(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      try { localStorage.setItem('qoracrm_hidden_columns', JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const moveColumn = (key, direction) => {
    setColumnOrder(prevOrder => {
      let currentList = prevOrder.length > 0 ? [...prevOrder] : allSelectableCols.map(c => c.key);
      allSelectableCols.forEach(c => {
        if (!currentList.includes(c.key)) currentList.push(c.key);
      });
      const index = currentList.indexOf(key);
      if (index === -1) return currentList;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= currentList.length) return currentList;
      const item = currentList.splice(index, 1)[0];
      currentList.splice(newIndex, 0, item);
      try { localStorage.setItem('qoracrm_column_order', JSON.stringify(currentList)); } catch { }
      return currentList;
    });
  };

  const resetColumns = () => {
    setHiddenCols([]);
    setColumnOrder([]);
    try {
      localStorage.removeItem('qoracrm_hidden_columns');
      localStorage.removeItem('qoracrm_column_order');
    } catch { }
  };

  // Reset selection and page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedLeads([]);
    setLastSelectedId(null);
  }, [leads.length, viewMode]);

  // Unified column definitions (merges Email, Phone, Name across all forms)
  const columnDefs = React.useMemo(() => {
    const cols = [];
    const seenLabels = new Set();

    let hasEmail = false;
    let hasPhone = false;
    let hasName = false;
    let hasValue = false;

    leads.forEach(l => {
      if (getLeadEmail(l)) hasEmail = true;
      if (getLeadPhone(l)) hasPhone = true;
      const dName = getLeadDisplayName(l, t);
      if (dName && dName !== (t ? (t('unnamed_lead') || 'Unnamed Lead') : 'Unnamed Lead')) hasName = true;
      if (getLeadTotalValue(l) > 0) hasValue = true;
    });

    if (hasName) {
      cols.push({ key: 'unified_name', label: t('name_label') || 'Name', getValue: l => getLeadDisplayName(l, t) });
      seenLabels.add('name');
      seenLabels.add('имя');
      seenLabels.add('your-name');
    }
    if (hasEmail) {
      cols.push({ key: 'unified_email', label: t('email_label') || 'Email', getValue: l => getLeadEmail(l) });
      seenLabels.add('email');
      seenLabels.add('e-mail');
      seenLabels.add('your-email');
      seenLabels.add('почта');
    }
    if (hasPhone) {
      cols.push({ key: 'unified_phone', label: t('phone') || 'Phone', getValue: l => getLeadPhone(l) });
      seenLabels.add('phone');
      seenLabels.add('your phone');
      seenLabels.add('your-phone');
      seenLabels.add('телефон');
      seenLabels.add('тел');
    }
    if (hasValue) {
      cols.push({ key: 'unified_value', label: t('budget') || 'Budget', getValue: l => getLeadTotalValue(l) > 0 ? `${getLeadTotalValue(l)} ${generalCurrency}` : '-' });
      seenLabels.add('value');
      seenLabels.add('total');
      seenLabels.add('budget');
      seenLabels.add('qoracrm_form_total');
    }

    // Process custom fields, grouped by label
    const customColMap = {};

    leads.forEach(l => {
      if (!l.entry_data) return;
      const metaLabels = l.meta_data?.field_labels || {};

      Object.keys(l.entry_data).forEach(key => {
        if (key === 'value' || key === 'total' || key === 'qoracrm_form_total' || key.endsWith('_quantity')) return;
        if (key.startsWith('_') || ['session_id', 'qora_token', 'abandoned_type', 'qoracrm_tracking_data'].includes(key)) return;
        // Skip repeater sub-fields (e.g. "field_yl7u43yy6 [1] [xj69406wf]") from table columns
        if (key.match(/^([a-zA-Z0-9_-]+)\s*\[\d+\]/)) return;

        const fieldId = key.replace('field_', '');
        const f = fieldMap[fieldId] || fieldMap[key];

        // Skip repeater parent fields and array entries from table columns
        if (f && f.type === 'repeater') return;
        if (Array.isArray(l.entry_data[key])) return;

        const rawLabel = metaLabels[key] || f?.label || key;
        const normLabel = String(rawLabel).trim().toLowerCase();

        if (seenLabels.has(normLabel)) return;

        if (!customColMap[normLabel]) {
          let displayLabel = f?.label || metaLabels[key] || rawLabel;
          if (!key.startsWith('field_') && !displayLabel) {
            displayLabel = key.charAt(0).toUpperCase() + key.slice(1);
          }
          customColMap[normLabel] = {
            key: 'custom_' + normLabel,
            label: displayLabel || rawLabel,
            keys: new Set([key])
          };
        } else {
          customColMap[normLabel].keys.add(key);
        }
      });
    });

    const renderFileOrTextCell = (val, f, key) => {
      if (!val) return '-';
      let parsed = val;
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { parsed = JSON.parse(val); } catch (e) { }
      }

      const isWebsiteField = (f && (f.type === 'url' || f.type === 'website')) ||
        (key && (key.toLowerCase().includes('url') || key.toLowerCase().includes('website') || key.toLowerCase().includes('site')));

      if (typeof val === 'string' && val.trim().startsWith('http')) {
        const cleanUrl = val.trim();

        // 1) Website / URL field or non-attachment web link -> Render as a text link with icon
        if (isWebsiteField || (!cleanUrl.includes('/uploads/') && !cleanUrl.includes('wp-content/uploads') && !cleanUrl.match(/\.(png|jpg|jpeg|gif|webp|svg|pdf|doc|docx|xls|xlsx|zip|csv|txt|mp3|mp4|mov)(\?.*)?$/i))) {
          return (
            <a
              href={cleanUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary font-medium hover:underline truncate max-w-[220px] inline-flex items-center gap-1 text-xs"
              onClick={(e) => e.stopPropagation()}
              title={cleanUrl}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              <span className="truncate">{cleanUrl}</span>
            </a>
          );
        }

        // 2) Image attachment -> Thumbnail preview
        const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null || (f && f.type === 'image_upload');
        if (isImage) {
          const fileName = cleanUrl.split('/').pop()?.split('?')[0] || 'Image';
          return (
            <a
              href={cleanUrl}
              target="_blank"
              rel="noreferrer"
              className="block shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shadow-2xs hover:opacity-80 transition-opacity bg-gray-50"
              onClick={(e) => e.stopPropagation()}
              title={fileName}
            >
              <img src={cleanUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </a>
          );
        }

        // 3) File Attachment -> File button
        const fileName = cleanUrl.split('/').pop()?.split('?')[0] || 'File';
        return (
          <a
            href={cleanUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg shadow-2xs hover:border-primary transition-colors !text-primary font-semibold text-xs truncate max-w-[160px]"
            onClick={(e) => e.stopPropagation()}
            title={fileName}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="truncate">{fileName}</span>
          </a>
        );
      }

      return formatLeadName(val);
    };

    Object.values(customColMap).forEach(c => {
      const keysArr = Array.from(c.keys);
      cols.push({
        key: c.key,
        label: c.label,
        getValue: l => {
          if (!l.entry_data) return '-';
          for (const k of keysArr) {
            if (l.entry_data[k] !== undefined && l.entry_data[k] !== '') {
              const val = l.entry_data[k];
              const fieldId = k.replace('field_', '');
              const f = fieldMap[fieldId] || fieldMap[k];
              if (f && f.type === 'product') {
                let optName = val;
                if (f.options) {
                  const opt = f.options.find(o => String(o.value) === String(val));
                  if (opt && opt.label) optName = opt.label;
                }
                const qty = l.entry_data[k + '_quantity'] || 1;
                return `${optName} x${qty}`;
              }
              return renderFileOrTextCell(val, f, k);
            }
          }
          return '-';
        }
      });
    });

    return cols;
  }, [leads, fieldMap, t, generalCurrency]);

  const allSelectableCols = React.useMemo(() => {
    return [
      { key: 'col_id', label: t('id') || 'ID' },
      { key: 'col_created_at', label: t('date') || 'Date' },
      { key: 'col_form_id', label: t('form_id') || 'Form ID' },
      ...columnDefs.map(c => ({ key: c.key, label: c.label })),
      { key: 'col_tags', label: t('lead_tags') || 'Tags' },
      { key: 'col_status', label: t('lead_status') || 'Status' },
      { key: 'col_assignee', label: t('assign_to') || 'Assignee' },
    ];
  }, [columnDefs, t]);

  const orderedSelectableCols = React.useMemo(() => {
    const map = new Map(allSelectableCols.map(c => [c.key, c]));
    const result = [];
    columnOrder.forEach(key => {
      if (map.has(key)) {
        result.push(map.get(key));
        map.delete(key);
      }
    });
    allSelectableCols.forEach(c => {
      if (map.has(c.key)) {
        result.push(c);
      }
    });
    return result;
  }, [allSelectableCols, columnOrder]);

  const sortedLeads = React.useMemo(() => {
    let sortable = [...leads];
    sortable.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortField === 'id') {
        return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
      } else if (sortField === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (sortField === 'status') {
        aVal = a.status || '';
        bVal = b.status || '';
      } else if (sortField === 'form_id') {
        aVal = a.form_id || '';
        bVal = b.form_id || '';
      } else {
        const colDef = columnDefs.find(c => c.key === sortField);
        if (colDef) {
          aVal = colDef.getValue(a) || '';
          bVal = colDef.getValue(b) || '';
        } else {
          aVal = a.entry_data?.[sortField] || '';
          bVal = b.entry_data?.[sortField] || '';
        }
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [leads, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const currentPageLeads = React.useMemo(() => {
    return sortedLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedLeads, currentPage, itemsPerPage]);

  const handleSelectLead = (id, e) => {
    e.stopPropagation();

    if (e.nativeEvent.shiftKey && lastSelectedId) {
      const currentIndex = currentPageLeads.findIndex(l => l.id === id);
      const lastIndex = currentPageLeads.findIndex(l => l.id === lastSelectedId);

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const idsInRange = currentPageLeads.slice(start, end + 1).map(l => l.id);

        setSelectedLeads(prev => {
          const newSet = new Set(prev);
          idsInRange.forEach(i => newSet.add(i));
          return Array.from(newSet);
        });
        setLastSelectedId(id);
        return;
      }
    }

    setSelectedLeads(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
    setLastSelectedId(id);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(currentPageLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const isAllCurrentPageSelected = currentPageLeads.length > 0 && currentPageLeads.every(l => selectedLeads.includes(l.id));

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <div className="w-3" />;
    return sortDirection === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  const handleBulkDelete = () => {
    const doDelete = window.QoraCRM?.getExtension?.('ProBulkDelete');
    const doUpdate = window.QoraCRM?.getExtension?.('ProBulkUpdate');
    if (viewMode === 'archive' || viewMode === 'spam') {
      setConfirmAction({
        title: t('delete_permanently') || 'Delete Permanently',
        message: t('are_you_sure_delete_selected') || 'Are you sure you want to delete selected leads?',
        confirmText: t('delete_forever') || 'Delete Forever',
        isDestructive: true,
        onConfirm: () => {
          if (doDelete) doDelete(selectedLeads, setLeads, fetchLeads);
          setSelectedLeads([]);
        }
      });
    } else {
      const updates = selectedLeads.map(id => {
        const lead = leads.find(l => l.id === id);
        const currentMeta = lead?.meta_data || {};
        const histEntry = createHistoryEntry(`${t('lead_history_moved_to_archive') || 'Moved to Archive'}`, t);
        return {
          id,
          status: 'archive',
          meta_data: { ...currentMeta, history: [...(currentMeta.history || []), histEntry] }
        };
      });
      if (doUpdate) doUpdate(updates, setLeads, fetchLeads);
      setSelectedLeads([]);
    }
  };

  const handleBulkApply = () => {
    const applyBulk = window.QoraCRM?.getExtension?.('ProBulkActions');
    if (applyBulk) {
      applyBulk({
        bulkActionType,
        bulkActionValue,
        selectedLeads,
        leads,
        globalStatuses,
        globalTags,
        crmUsers,
        t,
        createHistoryEntry,
        setLeads,
        fetchLeads,
        setSelectedLeads,
        setBulkActionValue,
        isPro
      });
    }
  };

  const handleEmptyArchive = () => {
    setConfirmAction({
      title: viewMode === 'spam' ? (t('empty_spam') || 'Empty Spam') : (t('empty_archive') || 'Empty Archive'),
      message: viewMode === 'spam' ? (t('are_you_sure_empty_spam') || 'Are you sure you want to permanently empty the spam folder?') : (t('are_you_sure_empty_archive') || 'Are you sure you want to permanently empty the archive?'),
      confirmText: t('delete_forever') || 'Delete Forever',
      isDestructive: true,
      onConfirm: () => {
        const archivedIds = leads.map(l => l.id);
        const doDelete = window.QoraCRM?.getExtension?.('ProBulkDelete');
        if (doDelete) {
          doDelete(archivedIds, setLeads, fetchLeads);
        } else {
          setLeads(prev => prev.filter(l => !archivedIds.includes(l.id)));
          window.wp?.apiFetch?.({
            path: '/qoracrm/v1/leads/bulk-delete',
            method: 'POST',
            data: { ids: archivedIds }
          }).then(() => {
            fetchLeads();
          }).catch(console.error);
        }
        setSelectedLeads([]);
      }
    });
  };

  const bulkActionOptions = [
    { value: 'status', label: t('change_status') || 'Change Status' }
  ];
  if (permissions.can_assign) {
    bulkActionOptions.push({ value: 'assign', label: t('assign_user') || 'Assign User' });
  }
  if (permissions.can_edit_status_tags) {
    bulkActionOptions.push({ value: 'tag', label: t('add_tag') || 'Add Tag' });
  }

  return (
    <div className="p-8 overflow-y-auto h-full flex flex-col gap-4">
      {/* Archive View Header Actions */}
      {(viewMode === 'archive' || viewMode === 'spam') && permissions.is_admin && leads.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleEmptyArchive}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors shadow-sm"
          >
            <Trash2 size={16} />
            {viewMode === 'spam' ? (t('empty_spam') || 'Empty Spam') : (t('empty_archive') || 'Empty Archive')}
          </button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <ExtensionSlot
          name="ProBulkActionsBar"
          selectedLeads={selectedLeads}
          setSelectedLeads={setSelectedLeads}
          viewMode={viewMode}
          leads={leads}
          setLeads={setLeads}
          fetchLeads={fetchLeads}
          globalStatuses={globalStatuses}
          globalTags={globalTags}
          crmUsers={crmUsers}
          permissions={permissions}
          t={t}
          handleBulkApply={handleBulkApply}
          handleBulkDelete={handleBulkDelete}
          setProUpgradeOpen={setProUpgradeOpen}
          bulkActionType={bulkActionType}
          setBulkActionType={setBulkActionType}
          bulkActionValue={bulkActionValue}
          setBulkActionValue={setBulkActionValue}
          bulkActionOptions={bulkActionOptions}
          createHistoryEntry={createHistoryEntry}
          fallback={
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-fade-in gap-6 w-auto min-w-max">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary">{selectedLeads.length} {t('selected') || 'selected'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                    <ProLockIcon /> {t('bulk_actions_pro') || 'Bulk actions are available in Pro'}
                  </span>
                  <button onClick={() => setProUpgradeOpen(true)} className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
                    {t('upgrade_to_pro') || 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedLeads([])} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
          }
        />
      )}

      {/* Table Action Toolbar (Column Customizer) */}
      <div className="flex justify-end items-center mb-1">
        <div className="relative">
          <button
            onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <SlidersHorizontal size={14} className="text-gray-500" />
            <span>{t('customize_columns') || 'Columns'}</span>
            {hiddenCols.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                {allSelectableCols.length - hiddenCols.length}/{allSelectableCols.length}
              </span>
            )}
          </button>

          {columnsMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setColumnsMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-800">{t('customize_columns') || 'Columns'}</span>
                  {(hiddenCols.length > 0 || columnOrder.length > 0) && (
                    <button
                      onClick={resetColumns}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      {t('show_all') || 'Reset'}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1 py-1 pr-1">
                  {orderedSelectableCols.map((col, idx) => {
                    const isVisible = !hiddenCols.includes(col.key);
                    return (
                      <div
                        key={col.key}
                        className="flex items-center justify-between p-1.5 hover:bg-gray-50 rounded-lg text-xs transition-colors group"
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                          <div className="flex flex-col text-gray-400 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveColumn(col.key, 'up')}
                              className="hover:text-primary disabled:opacity-20 disabled:hover:text-gray-400 p-0.5"
                              title="Move Up"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              disabled={idx === orderedSelectableCols.length - 1}
                              onClick={() => moveColumn(col.key, 'down')}
                              className="hover:text-primary disabled:opacity-20 disabled:hover:text-gray-400 p-0.5"
                              title="Move Down"
                            >
                              <ChevronDown size={12} />
                            </button>
                          </div>
                          <span className="text-gray-700 font-medium truncate">{col.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumn(col.key)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm whitespace-nowrap">
              {(permissions.is_admin || permissions.can_edit_status_tags) && (
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
              )}
              {orderedSelectableCols.filter(col => !hiddenCols.includes(col.key)).map(col => {
                if (col.key === 'col_id') {
                  return (
                    <th key={col.key} className="font-semibold p-4 w-16 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('id')}>
                      <div className="flex items-center justify-center gap-1">{t('id') || 'ID'} <SortIcon field="id" /></div>
                    </th>
                  );
                }
                if (col.key === 'col_created_at') {
                  return (
                    <th key={col.key} className="font-semibold p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center gap-1">{t('date') || 'Date'} <SortIcon field="created_at" /></div>
                    </th>
                  );
                }
                if (col.key === 'col_form_id') {
                  return (
                    <th key={col.key} className="font-semibold p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('form_id')}>
                      <div className="flex items-center gap-1">{t('form_id') || 'Form ID'} <SortIcon field="form_id" /></div>
                    </th>
                  );
                }
                if (col.key === 'col_tags') {
                  return <th key={col.key} className="font-semibold p-4">{t('lead_tags') || 'Tags'}</th>;
                }
                if (col.key === 'col_status') {
                  return <th key={col.key} className="font-semibold p-4 text-center">{t('lead_status') || 'Status'}</th>;
                }
                if (col.key === 'col_assignee') {
                  return <th key={col.key} className="font-semibold p-4 text-center">{t('assign_to') || 'Assignee'}</th>;
                }

                const dynamicCol = columnDefs.find(c => c.key === col.key);
                if (!dynamicCol) return null;

                return (
                  <th key={col.key} className="font-semibold p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort(col.key)}>
                    <div className="flex items-center gap-1">{dynamicCol.label} <SortIcon field={col.key} /></div>
                  </th>
                );
              })}
              <th className="font-semibold p-4 text-center w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr><td colSpan={2 + orderedSelectableCols.filter(c => !hiddenCols.includes(c.key)).length} className="p-8 text-center text-gray-400">{t('no_data') || 'No leads found.'}</td></tr>
            ) : (
              currentPageLeads.map(lead => {
                const leadTags = (lead.meta_data?.tags || []).map(tId => globalTags.find(gt => gt.id === tId)).filter(Boolean);
                return (
                  <tr
                    key={lead.id}
                    className={`border-b border-gray-100 transition-colors cursor-pointer ${String(selectedLeadId) === String(lead.id) ? 'bg-primary/10 hover:bg-primary/20' : (lead.is_unread ? 'bg-primary/5 hover:bg-primary/10 font-semibold' : 'hover:bg-gray-50')}`}
                    onClick={() => onSelect(lead)}
                  >
                    {(permissions.is_admin || permissions.can_edit_status_tags) && (
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => handleSelectLead(lead.id, e)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                    )}
                    {orderedSelectableCols.filter(col => !hiddenCols.includes(col.key)).map(col => {
                      if (col.key === 'col_id') {
                        return (
                          <td key={col.key} className="p-4 text-center font-medium text-gray-500 relative">
                            {lead.is_unread && <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-sm" title={t('unread') || 'Unread'}></span>}
                            {lead.id}
                          </td>
                        );
                      }
                      if (col.key === 'col_created_at') {
                        return <td key={col.key} className="p-4 whitespace-nowrap">{formatCrmDate(lead.created_at, t)}</td>;
                      }
                      if (col.key === 'col_form_id') {
                        return (
                          <td key={col.key} className="p-4">
                            <a
                              href={`#/forms/builder/${lead.form_id}`}
                              className="text-primary hover:underline hover:text-primary-dark font-medium transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              #{lead.form_id}
                            </a>
                          </td>
                        );
                      }
                      if (col.key === 'col_tags') {
                        return (
                          <td key={col.key} className="p-4 flex gap-1 flex-wrap">
                            {leadTags.map(tag => (
                              <span
                                key={tag.id}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </td>
                        );
                      }
                      if (col.key === 'col_status') {
                        return (
                          <td key={col.key} className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <StatusDropdown
                              value={lead.status}
                              onChange={(newStatus) => updateStatus(lead.id, newStatus)}
                              statuses={globalStatuses}
                              onLockClick={() => setProUpgradeOpen(true)}
                            />
                          </td>
                        );
                      }
                      if (col.key === 'col_assignee') {
                        const isProPlan = isPro;
                        const currentAssigneeName = lead.assignee_id 
                          ? (crmUsers?.find(u => String(u.id) === String(lead.assignee_id))?.name || (t('lead_assignee') || 'Assigned'))
                          : (t('select_user') || 'Not assigned');

                        return (
                          <td key={col.key} className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            {!isProPlan ? (
                              <div
                                onClick={() => setProUpgradeOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-400 cursor-pointer hover:border-primary/50 transition-colors"
                              >
                                <span>{currentAssigneeName}</span>
                                <ProLockIcon />
                              </div>
                            ) : (
                              <CustomSelect
                                value={lead.assignee_id ? String(lead.assignee_id) : (lead.meta_data?.assigned_to ? String(lead.meta_data.assigned_to) : '')}
                                onChange={(newAssigneeVal) => {
                                  const newAssigneeId = newAssigneeVal ? Number(newAssigneeVal) : null;
                                  const currentAssigneeId = lead.assignee_id ? Number(lead.assignee_id) : null;
                                  if (currentAssigneeId === newAssigneeId) return;
                                  const currentMeta = lead.meta_data || {};
                                  const assigneeName = crmUsers?.find(u => String(u.id) === String(newAssigneeVal))?.name || (newAssigneeVal ? newAssigneeVal : (t('unassigned') || 'Unassigned'));
                                  const histText = newAssigneeVal ? `${t('lead_history_assigned')} ${assigneeName}` : (t('lead_history_unassigned') || 'Unassigned');
                                  const histEntry = createHistoryEntry(histText, t);
                                  const applyBulk = window.QoraCRM?.ProBulkActions;
                                  if (applyBulk) {
                                    applyBulk({
                                      actionType: 'assignee',
                                      actionValue: newAssigneeId,
                                      selectedLeadIds: [lead.id],
                                      leads,
                                      crmUsers,
                                      globalStatuses,
                                      globalTags,
                                      setLeads,
                                      fetchLeads,
                                      t,
                                      setConfirmAction
                                    });
                                  }
                                }}
                                options={crmUsers?.map(u => ({ value: String(u.id), label: u.name })) || []}
                                allLabel={t('select_user') || 'Not assigned'}
                                minWidth="w-36"
                                disabled={!permissions.can_assign}
                              />
                            )}
                          </td>
                        );
                      }

                      const dynamicCol = columnDefs.find(c => c.key === col.key);
                      if (!dynamicCol) return null;
                      const cellValue = dynamicCol.getValue(lead) || '-';

                      return (
                        <td key={col.key} className="p-4 max-w-[200px] truncate" title={cellValue}>
                          {cellValue}
                        </td>
                      );
                    })}
                    <td className="p-4 text-center w-10" onClick={(e) => e.stopPropagation()}>
                      {viewMode === 'archive' || viewMode === 'spam' ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(lead.id, 'new');
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title={viewMode === 'spam' ? (t('not_spam') || 'Not Spam') : (t('restore') || 'Restore')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLeadPermanently(lead.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title={t('delete_permanently') || 'Delete Permanently'}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToArchive(lead.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title={t('move_to_archive') || 'Move to Archive'}
                        >
                          <Server size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {leads.length > 0 && (
        <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <div>
              {t('showing') || 'Showing'} <span className="font-semibold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> {t('to') || 'to'} <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, leads.length)}</span> {t('of') || 'of'} <span className="font-semibold text-gray-900">{leads.length}</span> {t('leads_count_label') || 'leads'}
            </div>
            <div className="flex items-center gap-2">
              <span>{t('per_page') || 'Per page:  '}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                  setSelectedLeads([]);
                }}
                className="border border-gray-300 rounded text-sm px-2 py-1 outline-none focus:border-primary"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('prev') || 'Prev'}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(leads.length / itemsPerPage) }).map((_, idx) => {
                const pageNum = idx + 1;

                if (pageNum === 1 || pageNum === Math.ceil(leads.length / itemsPerPage) || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${currentPage === pageNum ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(leads.length / itemsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(leads.length / itemsPerPage)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('next') || 'Next'}
            </button>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={proUpgradeOpen}
        onClose={() => setProUpgradeOpen(false)}
        feature={t('premium_features') || 'Premium Features'}
      />
    </div>
  );
}
