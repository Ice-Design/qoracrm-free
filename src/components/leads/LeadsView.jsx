import React, { useState, useEffect } from 'react';
import { LayoutList, Kanban, ShieldAlert, Server, Ghost, RotateCcw, Filter, X, SlidersHorizontal } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useI18n } from '../../utils/I18nContext.jsx';
import { SearchInput } from '../ui/SearchInput';
import { CustomSelect } from '../ui/CustomSelect';
import { useSettingsStore } from '../../store/useSettingsStore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { ListView } from './ListView';
import { KanbanView } from './KanbanView';
import { LeadSidePanel } from './side-panel/LeadSidePanel';
import { CreateLeadSidebar } from './side-panel/CreateLeadSidebar';
import { getDefaultStatuses, getDefaultTags, createHistoryEntry, getPermissions, notifyLeadUpdated } from './leadHelpers';
import { useFeature } from '../../hooks/useFeature';

export function LeadsView({ viewMode, setViewMode, routeLeadId, onRouteLeadIdChange }) {
  const { t, language } = useI18n();
  const { isPro } = useFeature();
  const abandonedFormsSettings = useSettingsStore(s => s.abandonedForms) || {};
  const { generalBoardAutorefresh, generalBoardAutorefreshInterval, tags: globalTags, statuses: globalStatuses, fetchSettings: fetchStoreSettings } = useSettingsStore();
  const [leads, setLeads] = useState([]);
  const [fieldMap, setFieldMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [crmUsers, setCrmUsers] = useState([]);
  const [formsList, setFormsList] = useState([]);

  // Filter States
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const hasAbandoned = Array.isArray(leads) && leads.some(l => l.status === 'abandoned');
  const hasUnreadAbandoned = Array.isArray(leads) && leads.some(l => l.status === 'abandoned' && l.is_unread);
  const [tagFilter, setTagFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState([null, null]);
  const [startDate, endDate] = customDateRange;
  const [formFilter, setFormFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState(null);

  // Create Lead State
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const permissions = getPermissions();

  // Derive selectedLead from routeLeadId and leads array
  const selectedLead = leads.find(l => String(l.id) === String(routeLeadId)) || null;

  const routeLeadIdRef = React.useRef(routeLeadId);
  useEffect(() => {
    routeLeadIdRef.current = routeLeadId;
  }, [routeLeadId]);

  useEffect(() => {
    fetchFormsAndBuildSchema();
    fetchLeads();
    fetchStoreSettings(t);
    fetchCrmUsers();
  }, []);

  useEffect(() => {
    // Auto-refresh leads based on settings
    let intervalId;
    if (generalBoardAutorefresh) {
      intervalId = setInterval(() => {
        // Do not auto-refresh if a lead is currently open or creating to prevent blinking
        if (!routeLeadIdRef.current && !isCreatingLead) {
          fetchLeads();
        }
      }, generalBoardAutorefreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [generalBoardAutorefresh, generalBoardAutorefreshInterval]);

  useEffect(() => {
    const handleLeadRead = (e) => {
      const readLeadId = e.detail?.leadId;
      if (readLeadId) {
        setLeads(prev => prev.map(l => String(l.id) === String(readLeadId) ? { ...l, is_unread: false } : l));
      }
    };

    const handleOpenLead = (e) => {
      if (e.detail) {
        onRouteLeadIdChange(e.detail);
      }
    };

    const handleLeadUpdated = async (e) => {
      const updatedLeadId = e.detail?.leadId;
      const directLead = e.detail?.lead;
      if (directLead && directLead.id) {
        setLeads(prev => prev.map(l => String(l.id) === String(directLead.id) ? { ...l, ...directLead } : l));
      } else if (updatedLeadId) {
        try {
          const freshLead = await window.wp.apiFetch({ path: `/qoracrm/v1/leads/${updatedLeadId}` });
          if (freshLead && freshLead.id) {
            setLeads(prev => prev.map(l => String(l.id) === String(freshLead.id) ? { ...l, ...freshLead } : l));
          }
        } catch (err) {
          console.error('Failed to refresh updated lead', err);
        }
      }
      if (e.detail?.refreshAll) {
        fetchLeads();
      }
    };

    const handleRefreshAll = () => {
      fetchLeads();
    };

    const handleLeadsCreated = (e) => {
      const newLeads = e.detail?.leads;
      if (Array.isArray(newLeads) && newLeads.length > 0) {
        setLeads(prev => {
          const existingIds = new Set(prev.map(l => String(l.id)));
          const toAdd = newLeads.filter(nl => !existingIds.has(String(nl.id)));
          return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
        });
      }
    };

    window.addEventListener('qoracrm-lead-read', handleLeadRead);
    window.addEventListener('qoracrm-lead-updated', handleLeadUpdated);
    window.addEventListener('qoracrm-refresh-leads', handleRefreshAll);
    window.addEventListener('qoracrm-leads-created', handleLeadsCreated);
    document.addEventListener('qoracrm_open_lead', handleOpenLead);

    return () => {
      window.removeEventListener('qoracrm-lead-read', handleLeadRead);
      window.removeEventListener('qoracrm-lead-updated', handleLeadUpdated);
      window.removeEventListener('qoracrm-refresh-leads', handleRefreshAll);
      window.removeEventListener('qoracrm-leads-created', handleLeadsCreated);
      document.removeEventListener('qoracrm_open_lead', handleOpenLead);
    };
  }, []);

  const fetchCrmUsers = async () => {
    try {
      const users = await window.wp.apiFetch({ path: '/qoracrm/v1/settings/users' });
      setCrmUsers(users || []);
    } catch { /* non-fatal */ }
  };

  const fetchFormsAndBuildSchema = async () => {
    try {
      const response = await window.wp.apiFetch({ path: '/qoracrm/v1/forms' });
      const newFieldMap = {};
      if (Array.isArray(response)) {
        setFormsList(response);
        response.forEach(form => {
          let parsedSchema = [];
          try {
            parsedSchema = JSON.parse(form.fields_schema);
            if (typeof parsedSchema === 'string') parsedSchema = JSON.parse(parsedSchema);
          } catch (e) { }

          let fieldsArray = [];
          if (Array.isArray(parsedSchema)) fieldsArray = parsedSchema;
          else if (parsedSchema && parsedSchema.fields) fieldsArray = parsedSchema.fields;

          // Recursively find fields
          const extractFields = (fields) => {
            fields.forEach(f => {
              if (f.id) {
                newFieldMap[f.id] = f;
              }
              if (f.name) {
                newFieldMap[f.name] = f;
                newFieldMap[f.name.replace('field_', '')] = f;
              }
              if (f.label) {
                newFieldMap[f.label] = f;
                // Also index by label without "(1)" suffix
                const baseLabel = f.label.replace(/\s\(\d+\)$/, '');
                if (baseLabel !== f.label) {
                  newFieldMap[baseLabel] = f;
                }
              }
              if (f.fields && Array.isArray(f.fields)) {
                extractFields(f.fields);
              }
            });
          };
          extractFields(fieldsArray);
        });
      }
      setFieldMap(newFieldMap);
    } catch (e) {
      console.error('Failed to fetch forms schema', e);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await window.wp.apiFetch({ path: '/qoracrm/v1/leads' });
      setLeads(response);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };



  const handleLeadSelect = async (lead) => {
    onRouteLeadIdChange(lead.id);

    if (lead.is_unread) {
      setLeads(prev => prev.map(l => String(l.id) === String(lead.id) ? { ...l, is_unread: false } : l));

      try {
        await window.wp?.apiFetch?.({
          path: `/qoracrm/v1/notifications/${lead.id}/read`,
          method: 'POST'
        });

        window.dispatchEvent(new CustomEvent('qoracrm-lead-read', { detail: { leadId: lead.id } }));
      } catch (e) {
        console.error('Failed to mark lead as read', e);
      }
    }
  };

  const updateLeadStatus = async (id, newStatus, historyEntry = null) => {
    // Optimistic update
    setLeads(prev => prev.map(l => {
      if (String(l.id) !== String(id)) return l;
      const updatedMeta = historyEntry
        ? { ...(l.meta_data || {}), history: [...((l.meta_data?.history) || []), historyEntry] }
        : l.meta_data;
      return { ...l, status: newStatus, meta_data: updatedMeta };
    }));

    try {
      let res;
      if (historyEntry) {
        const lead = leads.find(l => String(l.id) === String(id));
        const currentMeta = lead?.meta_data || {};
        const updatedHistory = [...(currentMeta.history || []), historyEntry];
        res = await window.wp.apiFetch({
          path: `/qoracrm/v1/leads/${id}`,
          method: 'PUT',
          data: { status: newStatus, meta_data: { ...currentMeta, history: updatedHistory } }
        });
      } else {
        res = await window.wp.apiFetch({
          path: `/qoracrm/v1/leads/${id}`,
          method: 'PUT',
          data: { status: newStatus }
        });
      }

      if (res && res.lead) {
        setLeads(prev => prev.map(l => String(l.id) === String(res.lead.id) ? { ...l, ...res.lead } : l));
      }
      if (res && res.created_leads && res.created_leads.length > 0) {
        window.dispatchEvent(new CustomEvent('qoracrm-leads-created', { detail: { leads: res.created_leads } }));
        notifyLeadUpdated(id, { lead: res.lead, refreshAll: true });
      } else if (res && res.automations_run > 0) {
        notifyLeadUpdated(id, { lead: res.lead });
      }
    } catch (e) {
      console.error(e);
      fetchLeads(); // Revert on failure
    }
  };



  const handleLeadUpdate = (updatedLead) => {
    setLeads(prev => prev.map(l => String(l.id) === String(updatedLead.id) ? updatedLead : l));
  };

  const deleteLeadPermanently = (id) => {
    setConfirmAction({
      title: t('delete_permanently') || 'Delete Permanently',
      message: t('are_you_sure_delete') || 'Are you sure you want to permanently delete this lead? This cannot be undone.',
      confirmText: t('delete_forever') || 'Delete Forever',
      isDestructive: true,
      onConfirm: async () => {
        setLeads(prev => prev.filter(l => String(l.id) !== String(id)));
        if (selectedLead && String(selectedLead.id) === String(id)) {
          onRouteLeadIdChange(null);
        }

        try {
          await window.wp.apiFetch({
            path: `/qoracrm/v1/leads/${id}`,
            method: 'DELETE'
          });
        } catch (e) {
          console.error(e);
          fetchLeads(); // Revert on failure
        }
      }
    });
  };

  const handleMoveToArchive = (id) => {
    setConfirmAction({
      title: t('move_to_archive') || 'Move to Archive',
      message: t('are_you_sure_archive') || 'Are you sure you want to move this lead to the archive?',
      confirmText: t('move_to_archive') || 'Move to Archive',
      isDestructive: true,
      onConfirm: () => {
        const histEntry = createHistoryEntry(`${t('lead_history_moved_to_archive') || 'Moved to Archive'}`, t);
        updateLeadStatus(id, 'archive', histEntry);
      }
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    (dateRangeFilter && dateRangeFilter !== 'all') ||
    (customDateRange && (customDateRange[0] || customDateRange[1])) ||
    (formFilter && formFilter !== '' && formFilter !== 'all') ||
    (statusFilter && statusFilter !== '' && statusFilter !== 'all') ||
    (tagFilter && tagFilter !== '' && tagFilter !== 'all') ||
    (isPro && assigneeFilter && assigneeFilter !== '' && assigneeFilter !== 'all')
  );

  const resetFilters = () => {
    setSearchQuery('');
    setDateRangeFilter('all');
    setCustomDateRange([null, null]);
    setFormFilter('');
    setStatusFilter('');
    setTagFilter('');
    setAssigneeFilter('');
  };

  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(statusFilter),
    Boolean(tagFilter),
    dateRangeFilter !== 'all',
    Boolean(formFilter),
    Boolean(assigneeFilter)
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#f8fafc]">
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 md:px-8 py-3 sm:py-4 shrink-0 bg-white border-b border-gray-200 gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{t('leads') || 'Leads'}</h1>
          
          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs relative"
          >
            <SlidersHorizontal size={14} className="text-primary" />
            <span>{t('filters') || 'Filters'}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* DESKTOP FILTER BAR */}
        <div className="max-lg:hidden flex lg:flex flex-1 items-center justify-end gap-2 mx-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('search_all_fields') || 'Search all fields...'}
          />

          <CustomSelect
            value={dateRangeFilter}
            onChange={setDateRangeFilter}
            minWidth="w-36"
            options={[
              { value: 'all', label: t('all_time') || 'All Time' },
              { value: 'today', label: t('today') || 'Today' },
              { value: 'yesterday', label: t('yesterday') || 'Yesterday' },
              { value: 'week', label: t('last_7_days') || 'Last 7 Days' },
              { value: 'month', label: t('last_30_days') || 'Last 30 Days' },
              { value: 'this_month', label: t('this_month') || 'This Month' },
              { value: 'custom', label: t('custom_range') || 'Custom Range' },
            ]}
          />

          {dateRangeFilter === 'custom' && (
            <div className="flex items-center shrink-0 w-56 relative" style={{ zIndex: 50 }}>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setCustomDateRange(update)}
                isClearable={true}
                locale={language === 'ru' ? 'ru' : 'en'}
                placeholderText={t('select_date_range') || 'Select date range'}
                dateFormat="dd.MM.yyyy"
                className="!border !border-gray-200 !px-3 !py-1.5 !text-sm !font-medium !min-h-0 !bg-white !outline-none focus:!border-primary focus:!ring-1 focus:!ring-primary !text-gray-700 transition-colors !m-0 !h-auto !box-border w-full"
              />
            </div>
          )}

          <CustomSelect
            value={formFilter}
            onChange={setFormFilter}
            minWidth="w-32"
            allLabel={t('all_forms') || 'All Forms'}
            options={formsList.map(f => ({ value: f.id.toString(), label: f.title }))}
          />

          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            minWidth="w-32"
            allLabel={t('all_statuses') || 'All Statuses'}
            options={globalStatuses.map(s => ({ value: s.id, label: s.label, color: s.color }))}
          />

          <CustomSelect
            value={tagFilter}
            onChange={setTagFilter}
            minWidth="w-28"
            allLabel={t('all_tags') || 'All Tags'}
            options={globalTags.map(t => ({ value: t.id, label: t.label, color: t.color }))}
          />

          {isPro && (
            <CustomSelect
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              minWidth="w-32"
              allLabel={t('all_managers') || 'All Managers'}
              options={[
                { value: 'unassigned', label: t('unassigned') || 'Unassigned' },
                ...crmUsers.map(u => ({ value: String(u.id), label: u.name }))
              ]}
            />
          )}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
              title={t('reset_filters') || 'Reset Filters'}
            >
              <RotateCcw size={13} />
              <span>{t('reset_filters') || 'Reset Filters'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {permissions.can_edit_fields && (
            <button
              onClick={() => setIsCreatingLead(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
            >
              <span className="text-base sm:text-lg leading-none mt-[-2px]">+</span>
              <span className="max-sm:hidden inline sm:inline">{t('create_lead') || 'Create Lead'}</span>
              <span className="sm:hidden">{t('lead') || 'Lead'}</span>
            </button>
          )}

          {/* Main views (List/Kanban) */}
          <div className="flex bg-gray-100/80 rounded-lg p-0.5 sm:p-1 border border-gray-200/50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2.5 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              title={t('list_view') || 'List View'}
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 sm:p-2.5 flex items-center justify-center rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              title={t('kanban_view') || 'Kanban View'}
            >
              <Kanban size={18} />
            </button>
          </div>

          {/* Secondary views (Archive/Spam/Abandoned) */}
          <div className="flex bg-gray-50 rounded-md p-0.5 sm:p-1 border border-gray-100 gap-0.5">
            {(abandonedFormsSettings.enabled || hasAbandoned) && (
              <button
                onClick={() => setViewMode('abandoned')}
                className={`relative p-1.5 flex items-center justify-center rounded transition-all ${viewMode === 'abandoned' ? 'bg-white shadow-sm text-orange-500 border border-gray-200' : 'text-gray-400 hover:text-indigo-500'}`}
                title={t('abandoned_forms') || 'Abandoned'}
              >
                <Ghost size={16} />
                {hasUnreadAbandoned && (
                  <span className="absolute top-0.5 right-0.5 bg-primary w-2 h-2 rounded-full ring-2 ring-white"></span>
                )}
              </button>
            )}
            <button
              onClick={() => setViewMode('archive')}
              className={`p-1.5 flex items-center justify-center rounded transition-all ${viewMode === 'archive' ? 'bg-white shadow-sm text-red-500 border border-gray-200' : 'text-gray-400 hover:text-red-500'}`}
              title={t('move_to_archive') || 'Archive'}
            >
              <Server size={15} />
            </button>
            <button
              onClick={() => setViewMode('spam')}
              className={`p-1.5 flex items-center justify-center rounded transition-all ${viewMode === 'spam' ? 'bg-white shadow-sm text-orange-500 border border-gray-200' : 'text-gray-400 hover:text-orange-500'}`}
              title={t('spam') || 'Spam'}
            >
              <ShieldAlert size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className={`flex-1 overflow-hidden transition-all duration-300 ${(selectedLead || isCreatingLead) ? 'lg:pr-[700px]' : ''}`}>
          {(() => {
            const filteredLeads = leads.filter(l => {
              if (viewMode === 'archive') {
                if (l.status !== 'archive') return false;
              } else if (viewMode === 'spam') {
                if (l.status !== 'spam') return false;
              } else if (viewMode === 'abandoned') {
                if (l.status !== 'abandoned') return false;
              } else {
                if (l.status === 'archive' || l.status === 'spam' || l.status === 'abandoned') return false;
              }

              if (statusFilter && l.status !== statusFilter) return false;
              if (tagFilter && (!l.meta_data?.tags || !l.meta_data.tags.includes(tagFilter))) return false;

              if (isPro && assigneeFilter) {
                if (assigneeFilter === 'unassigned') {
                  if (l.assignee_id || l.assignee) return false;
                } else {
                  const aId = l.assignee_id || l.assignee?.id;
                  if (String(aId) !== String(assigneeFilter)) return false;
                }
              }

              if (dateRangeFilter !== 'all' && l.created_at) {
                const leadDate = new Date(l.created_at.replace(/-/g, '/'));
                const now = new Date();
                if (dateRangeFilter === 'today') {
                  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  if (leadDate < todayStart) return false;
                } else if (dateRangeFilter === 'yesterday') {
                  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                  const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
                  if (leadDate < yesterdayStart || leadDate > yesterdayEnd) return false;
                } else if (dateRangeFilter === 'week') {
                  const weekAgo = new Date(now.setDate(now.getDate() - 7));
                  if (leadDate < weekAgo) return false;
                } else if (dateRangeFilter === 'month') {
                  const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                  if (leadDate < monthAgo) return false;
                } else if (dateRangeFilter === 'this_month') {
                  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  if (leadDate < firstDayOfMonth) return false;
                } else if (dateRangeFilter === 'custom') {
                  const [start, end] = customDateRange;
                  if (start) {
                    const startDateFilter = new Date(start);
                    startDateFilter.setHours(0, 0, 0, 0);
                    if (leadDate < startDateFilter) return false;
                  }
                  if (end) {
                    const endDateFilter = new Date(end);
                    endDateFilter.setHours(23, 59, 59, 999);
                    if (leadDate > endDateFilter) return false;
                  }
                }
              }

              if (formFilter && String(l.form_id) !== String(formFilter)) return false;

              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                // Check basic fields
                if (String(l.id).includes(q)) return true;
                if (String(l.form_id).includes(q)) return true;

                // Check all text in entry_data
                let entryText = '';
                if (l.entry_data) {
                  Object.values(l.entry_data).forEach(val => {
                    if (typeof val === 'string' || typeof val === 'number') {
                      entryText += ' ' + String(val).toLowerCase();
                    }
                  });
                }
                if (entryText.includes(q)) return true;

                // Check UTMs
                let metaText = '';
                if (l.meta_data) {
                  Object.entries(l.meta_data).forEach(([k, v]) => {
                    if (k !== 'comments' && k !== 'tags' && (typeof v === 'string' || typeof v === 'number')) {
                      metaText += ' ' + String(v).toLowerCase();
                    }
                  });
                }
                if (metaText.includes(q)) return true;

                return false;
              }
              return true;
            });

            if (isLoading) return <div className="p-8 text-center text-gray-400">{t('loading') || 'Loading leads...'}</div>;

            if (viewMode === 'archive' && filteredLeads.length === 0) {
              return <div className="p-8 text-center text-gray-500 font-medium">{t('archive_is_empty') || 'Archive is empty'}</div>;
            }
            if (viewMode === 'spam' && filteredLeads.length === 0) {
              return <div className="p-8 text-center text-gray-500 font-medium">{t('no_spam_leads_found') || 'No spam leads found'}</div>;
            }

            return viewMode === 'kanban' ? (
              <KanbanView leads={filteredLeads} onSelect={handleLeadSelect} updateStatus={updateLeadStatus} selectedLeadId={routeLeadId} globalTags={globalTags} globalStatuses={globalStatuses} fieldMap={fieldMap} viewMode={viewMode} handleMoveToArchive={handleMoveToArchive} setLeads={setLeads} fetchLeads={fetchLeads} crmUsers={crmUsers} />
            ) : (
              <ListView leads={filteredLeads} onSelect={handleLeadSelect} updateStatus={updateLeadStatus} selectedLeadId={routeLeadId} globalTags={globalTags} globalStatuses={globalStatuses} fieldMap={fieldMap} viewMode={viewMode} deleteLeadPermanently={deleteLeadPermanently} handleMoveToArchive={handleMoveToArchive} setLeads={setLeads} fetchLeads={fetchLeads} setConfirmAction={setConfirmAction} crmUsers={crmUsers} />
            );
          })()}
        </div>

        {/* Backdrop for closing panel when clicking outside */}
        {(selectedLead || isCreatingLead) && (
          <>
            <div
              className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] lg:hidden"
              onClick={() => {
                if (selectedLead) onRouteLeadIdChange(null);
                if (isCreatingLead) setIsCreatingLead(false);
              }}
            />
            <div
              className="hidden lg:block absolute inset-0 z-[5] bg-transparent"
              onClick={() => {
                if (selectedLead) onRouteLeadIdChange(null);
                if (isCreatingLead) setIsCreatingLead(false);
              }}
            />
          </>
        )}

        {/* Side Panel (Non-blocking on desktop, modal drawer on mobile) */}
        <div className={`absolute top-0 right-0 bottom-0 w-full sm:w-[600px] lg:w-[700px] max-w-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.15)] border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-30 ${(selectedLead || isCreatingLead) ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedLead && !isCreatingLead && (
            <LeadSidePanel
              lead={selectedLead}
              onClose={() => onRouteLeadIdChange(null)}
              onUpdate={handleLeadUpdate}
              updateStatus={updateLeadStatus}
              globalTags={globalTags}
              globalStatuses={globalStatuses}
              deleteLeadPermanently={deleteLeadPermanently}
              handleMoveToArchive={handleMoveToArchive}
              crmUsers={crmUsers}
              viewMode={viewMode}
              setConfirmAction={setConfirmAction}
              t={t}
              createHistoryEntry={createHistoryEntry}
            />
          )}
          {isCreatingLead && (
            <CreateLeadSidebar
              onClose={() => setIsCreatingLead(false)}
              onCreated={(newLead) => {
                setLeads(prev => [newLead, ...prev]);
                onRouteLeadIdChange(newLead.id); // Open the newly created lead
              }}
              globalTags={globalTags}
              globalStatuses={globalStatuses}
              crmUsers={crmUsers}
              fieldMap={fieldMap}
              t={t}
            />
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-primary" />
                <span>{t('filters') || 'Filters'}</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('search') || 'Search'}</label>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t('search_all_fields') || 'Search all fields...'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('date_range') || 'Date Range'}</label>
                <CustomSelect
                  value={dateRangeFilter}
                  onChange={setDateRangeFilter}
                  minWidth="w-full"
                  options={[
                    { value: 'all', label: t('all_time') || 'All Time' },
                    { value: 'today', label: t('today') || 'Today' },
                    { value: 'yesterday', label: t('yesterday') || 'Yesterday' },
                    { value: 'week', label: t('last_7_days') || 'Last 7 Days' },
                    { value: 'month', label: t('last_30_days') || 'Last 30 Days' },
                    { value: 'this_month', label: t('this_month') || 'This Month' },
                    { value: 'custom', label: t('custom_range') || 'Custom Range' },
                  ]}
                />
                {dateRangeFilter === 'custom' && (
                  <div className="mt-2 w-full">
                    <DatePicker
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(update) => setCustomDateRange(update)}
                      isClearable={true}
                      locale={language === 'ru' ? 'ru' : 'en'}
                      placeholderText={t('select_date_range') || 'Select date range'}
                      dateFormat="dd.MM.yyyy"
                      className="!border !border-gray-200 !px-3 !py-1.5 !text-sm !font-medium !min-h-0 !bg-white !outline-none focus:!border-primary focus:!ring-1 focus:!ring-primary !text-gray-700 transition-colors !m-0 !h-auto !box-border w-full rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('form') || 'Form'}</label>
                <CustomSelect
                  value={formFilter}
                  onChange={setFormFilter}
                  minWidth="w-full"
                  allLabel={t('all_forms') || 'All Forms'}
                  options={formsList.map(f => ({ value: f.id.toString(), label: f.title }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('status') || 'Status'}</label>
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  minWidth="w-full"
                  allLabel={t('all_statuses') || 'All Statuses'}
                  options={globalStatuses.map(s => ({ value: s.id, label: s.label, color: s.color }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('tag') || 'Tag'}</label>
                <CustomSelect
                  value={tagFilter}
                  onChange={setTagFilter}
                  minWidth="w-full"
                  allLabel={t('all_tags') || 'All Tags'}
                  options={globalTags.map(t => ({ value: t.id, label: t.label, color: t.color }))}
                />
              </div>

              {isPro && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('assignee_manager') || 'Manager'}</label>
                  <CustomSelect
                    value={assigneeFilter}
                    onChange={setAssigneeFilter}
                    minWidth="w-full"
                    allLabel={t('all_managers') || 'All Managers'}
                    options={[
                      { value: 'unassigned', label: t('unassigned') || 'Unassigned' },
                      ...crmUsers.map(u => ({ value: String(u.id), label: u.name }))
                    ]}
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={() => { resetFilters(); }}
                  className="flex-1 py-2.5 px-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl"
                >
                  {t('reset') || 'Reset'}
                </button>
              )}
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm text-center"
              >
                {t('apply_filters') || 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          isDestructive={confirmAction.isDestructive}
        />
      )}
    </div>
  );
}
