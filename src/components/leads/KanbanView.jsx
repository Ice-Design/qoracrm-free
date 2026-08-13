import { useState, useRef, useEffect } from 'react';
import { MessageSquare, User, MessageCircle, CheckCircle2, Calculator } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext.jsx';
import { formatCrmDate, formatLeadName, getLeadDisplayName, getLeadTotalValue } from '../../utils/helpers';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CURRENCIES } from '../../utils/currencies';
import { isPro } from '../../hooks/useFeature';
import ExtensionSlot from '../common/ExtensionSlot';

export function KanbanView({ leads, onSelect, updateStatus, selectedLeadId, globalTags, globalStatuses, fieldMap, crmUsers, setLeads, fetchLeads }) {
  const { t } = useI18n();
  const { generalCurrency, generalCurrencyPos } = useSettingsStore();

  const [renderLimits, setRenderLimits] = useState({});
  const [dragOverLeadId, setDragOverLeadId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);

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



  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', String(leadId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e, targetLeadId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isTopHalf = y < rect.height / 2;
    setDragOverLeadId(targetLeadId);
    setDropPosition(isTopHalf ? 'top' : 'bottom');
  };

  const handleCardDragLeave = (e) => {
    setDragOverLeadId(null);
    setDropPosition(null);
  };

  const handleDrop = (e, statusId) => {
    e.preventDefault();
    const draggedLeadId = e.dataTransfer.getData('leadId');
    if (!draggedLeadId) return;

    if (window.QoraCRM?.checkKanbanDropLimit?.(statusId, globalStatuses, isPro, t)) {
      setDragOverLeadId(null);
      setDropPosition(null);
      return;
    }

    let targetColumnLeads = leads
      .filter(l => l.status === statusId && String(l.id) !== String(draggedLeadId))
      .sort((a, b) => {
        if (statusId === globalStatuses[0]?.id) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        const orderA = a.meta_data?.order !== undefined && a.meta_data?.order !== null ? Number(a.meta_data.order) : null;
        const orderB = b.meta_data?.order !== undefined && b.meta_data?.order !== null ? Number(b.meta_data.order) : null;
        if (orderA !== null && orderB !== null && orderA !== orderB) return orderA - orderB;
        if (orderA !== null) return 1;
        if (orderB !== null) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

    let newIndex = targetColumnLeads.length;

    if (dragOverLeadId) {
      const index = targetColumnLeads.findIndex(l => String(l.id) === String(dragOverLeadId));
      if (index !== -1) {
        newIndex = dropPosition === 'top' ? index : index + 1;
      }
    }

    const draggedLead = leads.find(l => String(l.id) === String(draggedLeadId));
    if (!draggedLead) return;

    targetColumnLeads.splice(newIndex, 0, draggedLead);

    const updates = targetColumnLeads.map((l, index) => {
      const isDragged = String(l.id) === String(draggedLeadId);
      const updateData = {
        id: l.id,
        status: statusId,
        meta_data: { ...(l.meta_data || {}), order: index }
      };

      if (isDragged && l.status !== statusId) {
        const oldStatusObj = globalStatuses.find(s => s.id === l.status);
        const oldStatus = oldStatusObj?.label || (l.status?.startsWith('status_') ? (t('status_deleted') || 'Deleted Status') : l.status);
        const newStatusLabel = globalStatuses.find(s => s.id === statusId)?.label || statusId;
        const histEntry = {
          date: new Date().toLocaleString('sv').replace('T', ' '), // MySQL format
          author: window.qoraCrmData?.currentUser?.name || 'System',
          text: `${t('lead_history_status_changed')} "${oldStatus}" → "${newStatusLabel}"`
        };
        updateData.meta_data.history = [...(updateData.meta_data.history || []), histEntry];
      }
      return updateData;
    });

    const oldStatusObj = globalStatuses.find(s => s.id === draggedLead.status);
    const oldStatus = oldStatusObj?.label || (draggedLead.status?.startsWith('status_') ? (t('status_deleted') || 'Deleted Status') : draggedLead.status);
    const newStatusLabel = globalStatuses.find(s => s.id === statusId)?.label || statusId;
    const histEntry = {
      date: new Date().toLocaleString('sv').replace('T', ' '),
      author: window.qoraCrmData?.currentUser?.name || 'System',
      text: `${t('lead_history_status_changed')} "${oldStatus}" → "${newStatusLabel}"`
    };

    // 1. Immediately update UI state in React store
    if (setLeads) {
      setLeads(prevLeads => {
        const updateMap = new Map(updates.map(u => [String(u.id), u]));
        return prevLeads.map(l => {
          const upd = updateMap.get(String(l.id));
          return upd ? { ...l, status: upd.status, meta_data: upd.meta_data } : l;
        });
      });
    }

    // 2. Persist new lead order and status to backend DB
    window.wp?.apiFetch?.({
      path: '/qoracrm/v1/leads/bulk-update',
      method: 'POST',
      data: { leads: updates }
    }).catch(err => console.error('Failed to save lead order:', err));

    setDragOverLeadId(null);
    setDropPosition(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    // Clear card drop targets if hovered over the column directly
    if (e.target === e.currentTarget) {
      setDragOverLeadId(null);
      setDropPosition(null);
    }
  };

  const loadMore = (statusId) => {
    setRenderLimits(prev => ({ ...prev, [statusId]: (prev[statusId] || 15) + 15 }));
  };

  return (
    <>
      <div className="flex gap-6 p-8 h-full overflow-x-auto items-start custom-scroll">
        {globalStatuses.map((status, index) => {
          const isFirstColumn = index === 0;
          const columnLeads = leads
            .filter(l => l.status === status.id)
            .sort((a, b) => {
              if (isFirstColumn) {
                return new Date(b.created_at) - new Date(a.created_at);
              }
              const orderA = a.meta_data?.order !== undefined && a.meta_data?.order !== null ? Number(a.meta_data.order) : null;
              const orderB = b.meta_data?.order !== undefined && b.meta_data?.order !== null ? Number(b.meta_data.order) : null;
              if (orderA !== null && orderB !== null && orderA !== orderB) return orderA - orderB;
              if (orderA !== null) return 1;
              if (orderB !== null) return -1;
              return new Date(b.created_at) - new Date(a.created_at);
            });
          const limit = renderLimits[status.id] || 15;
          const visibleLeads = columnLeads.slice(0, limit);

          const statusColor = status.color || '#3b82f6';
          return (
            <div
              key={status.id}
              className="flex-1 min-w-[300px] max-w-[350px] rounded-xl shadow-sm border flex flex-col h-full max-h-full overflow-hidden transition-all"
              style={{
                backgroundColor: `${statusColor}08`,
                borderColor: `${statusColor}30`,
                borderTop: `3px solid ${statusColor}`
              }}
              onDrop={(e) => handleDrop(e, status.id)}
              onDragOver={handleDragOver}
            >
              {/* Status Header */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between transition-colors"
                style={{
                  backgroundColor: `${statusColor}18`,
                  borderColor: `${statusColor}30`
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: statusColor }}></span>
                  <h3 className="font-bold text-gray-900 text-sm">{status.label}</h3>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full shadow-xs border"
                  style={{
                    backgroundColor: `${statusColor}25`,
                    borderColor: `${statusColor}40`,
                    color: '#1e293b'
                  }}
                >
                  {columnLeads.length}
                </span>
              </div>

              {/* Leads List */}
              <div
                className="p-3 flex-1 overflow-y-auto space-y-3 custom-scroll"
                onScroll={(e) => {
                  const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 50;
                  if (bottom && columnLeads.length > limit) {
                    loadMore(status.id);
                  }
                }}
              >
                {visibleLeads.map(lead => {
                  const leadTags = (lead.meta_data?.tags || []).map(tId => globalTags.find(gt => gt.id === tId)).filter(Boolean);

                  // Extract dynamic fields for card preview
                  const allPreviewFields = [];
                  if (lead.entry_data) {
                    const metaLabels = lead.meta_data?.field_labels || {};

                    // Explicitly process standard fields first so they can be selected as primary identifier
                    if (lead.entry_data.name) allPreviewFields.push({ label: t('name') || 'Name', value: formatLeadName(lead.entry_data.name), isPrimary: true });
                    if (lead.entry_data.email) allPreviewFields.push({ label: t('email') || 'Email', value: lead.entry_data.email, isEmail: true });
                    if (lead.entry_data.phone) allPreviewFields.push({ label: t('phone') || 'Phone', value: lead.entry_data.phone, isPhone: true });

                    Object.keys(lead.entry_data).forEach(key => {
                      if (['name', 'email', 'phone', 'value', 'total', 'custom_fields', 'qoracrm_form_total'].includes(key) || key.endsWith('_quantity')) return;

                      const val = lead.entry_data[key];
                      if (val === null || val === undefined || val === '') return;

                      const isPluginField = key.startsWith('field_') || key.startsWith('frmt_') || key.startsWith('frm_');
                      const fieldId = key.replace('field_', '');
                      const f = fieldMap[fieldId] || fieldMap[key];

                      let labelText = f?.label || metaLabels[key] || metaLabels[fieldId];

                      if (f) {
                        if (['text', 'email', 'phone', 'name', 'textarea'].includes(f.type)) {
                          allPreviewFields.push({ label: labelText || f.label || key, value: formatLeadName(val) });
                        } else if (f.type === 'product') {
                          let optName = val;
                          if (f.options) {
                            const opt = f.options.find(o => String(o.value) === String(val));
                            if (opt && opt.label) optName = opt.label;
                          }
                          const qty = lead.entry_data[key + '_quantity'] || 1;
                          const pLabel = f.label || t('product') || 'Product';
                          allPreviewFields.push({ label: pLabel, value: `${optName} x${qty}` });
                        }
                      } else {
                        // Form was deleted or non-schema field
                        if (!labelText && !isPluginField) {
                          labelText = key.charAt(0).toUpperCase() + key.slice(1);
                        }
                        if (labelText) {
                          allPreviewFields.push({ label: labelText, value: formatLeadName(val) });
                        }
                      }
                    });
                  }

                  // Determine Main Identifier
                  let mainIdentifier = getLeadDisplayName(lead, t);
                  let remainingFields = allPreviewFields;

                  if (allPreviewFields.length > 0) {
                    let primaryIndex = allPreviewFields.findIndex(f =>
                      f.isPrimary ||
                      f.value === mainIdentifier ||
                      f.label.toLowerCase().includes('name') ||
                      f.label.toLowerCase().includes('title')
                    );

                    if (primaryIndex === -1) {
                      primaryIndex = allPreviewFields.findIndex(f => f.isEmail || f.label.toLowerCase().includes('email'));
                    }

                    if (primaryIndex === -1) {
                      primaryIndex = allPreviewFields.findIndex(f => f.isPhone || f.label.toLowerCase().includes('phone'));
                    }

                    if (primaryIndex !== -1) {
                      if (mainIdentifier === (t('new_lead') || 'New Lead') || mainIdentifier === (t('unnamed_lead') || 'Unnamed Lead')) {
                        mainIdentifier = allPreviewFields[primaryIndex].value;
                      }
                      remainingFields = allPreviewFields.filter((f, i) => i !== primaryIndex && f.value !== mainIdentifier);
                    } else {
                      remainingFields = allPreviewFields.filter(f => f.value !== mainIdentifier);
                    }
                  } else if (lead.entry_data && Object.values(lead.entry_data).length > 0) {
                    mainIdentifier = getLeadDisplayName(lead, t);
                  }

                  const limitedPreviewFields = remainingFields.slice(0, 3);

                  const isDragOver = dragOverLeadId && String(dragOverLeadId) === String(lead.id);

                  const payments = lead.meta_data?.payments || [];
                  let totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                  if (lead.meta_data?.stripe_payment_status === 'succeeded' && lead.meta_data?.stripe_amount) {
                    totalPaid += parseFloat(lead.meta_data.stripe_amount) || 0;
                  }

                  // Find calculator field if any
                  let calcValue = null;
                  let calcPrefix = '';
                  let calcSuffix = '';
                  if (lead.entry_data) {
                    Object.keys(lead.entry_data).forEach(key => {
                      const isPluginField = key.startsWith('field_');
                      if (isPluginField) {
                        const fieldId = key.replace('field_', '');
                        const f = fieldMap[fieldId];
                        if (f && f.type === 'calculator') {
                          calcValue = lead.entry_data[key];
                          calcPrefix = f.prefix || '';
                          calcSuffix = f.suffix || '';
                        }
                      }
                    });
                  }

                  return (
                    <div key={lead.id} className="relative">
                      {isDragOver && dropPosition === 'top' && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full transform -translate-y-2" />
                      )}

                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragOver={(e) => handleCardDragOver(e, lead.id)}
                        onDragLeave={handleCardDragLeave}
                        onClick={() => onSelect(lead)}
                        className={`bg-white border p-4 rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md ${String(selectedLeadId) === String(lead.id) ? 'border-primary ring-1 ring-primary/20' : (lead.is_unread ? 'border-primary/50 hover:border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')}`}
                      >
                        {/* Assignee at the very top */}
                        {(() => {
                          if (!lead.assignee_id || !crmUsers) return null;
                          const assignee = crmUsers.find(u => String(u.id) === String(lead.assignee_id));
                          if (!assignee) return null;
                          const color = assignee.color || '#b89528';
                          const isHex = /^#[0-9A-F]{6}$/i.test(color);
                          const bgCol = isHex ? color + '1a' : '#f9f4e5';
                          const borderCol = isHex ? color + '33' : '#b89528';
                          const textCol = isHex ? color : '#b89528';
                          return (
                            <div className="mb-3 -mt-1 -mx-1">
                              <span
                                className="text-[11px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 w-max max-w-full"
                                style={{ backgroundColor: bgCol, borderColor: borderCol, color: textCol }}
                              >
                                <User size={12} className="opacity-80 shrink-0" />
                                <span className="truncate">{assignee.name}</span>
                              </span>
                            </div>
                          );
                        })()}

                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="font-semibold text-gray-900 text-[13px] leading-snug truncate flex items-center gap-1.5 min-w-0">
                            {lead.is_unread && <span className="w-2 h-2 rounded-full bg-primary shadow-sm shrink-0" title={t('unread') || 'Unread'}></span>}
                            <span className="truncate" title={mainIdentifier}>{mainIdentifier}</span>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[10px] text-gray-400 font-semibold mt-0.5 whitespace-nowrap">{formatCrmDate(lead.created_at, t)}</span>
                          </div>
                        </div>

                        {limitedPreviewFields.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {limitedPreviewFields.map((pf, idx) => (
                              <div key={idx} className="text-sm flex items-start w-full">
                                <span className="text-gray-400 text-xs mr-1 shrink-0">{pf.label}:</span>
                                <span className="text-gray-900 text-xs font-medium line-clamp-1 break-words flex-1" title={pf.value}>{pf.value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 items-center mt-3">
                          {leadTags.map(tag => (
                            <span
                              key={tag.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.label}
                            </span>
                          ))}
                          {Number(lead.pending_tasks_count) > 0 && (
                            <span
                              className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-1 border border-primary/20 ml-auto"
                              title={`${t('pending_tasks') || 'Pending Tasks'}: ${lead.pending_tasks_count}`}
                            >
                              <CheckCircle2 size={10} className="opacity-70" />
                              {lead.pending_tasks_count}
                            </span>
                          )}
                          {lead.meta_data?.comments?.length > 0 && (
                            <span
                              className={`text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-200/60 ${Number(lead.pending_tasks_count) > 0 ? '' : 'ml-auto'}`}
                              title={`${t('comments') || 'Comments'}: ${lead.meta_data.comments.length}`}
                            >
                              <MessageCircle size={10} className="opacity-70" />
                              {lead.meta_data.comments.length}
                            </span>
                          )}
                          {(() => {
                            const leadTotal = getLeadTotalValue(lead);
                            if (totalPaid <= 0 && leadTotal <= 0 && calcValue === null) return null;
                            return (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border shadow-sm cursor-help ${totalPaid > 0
                                  ? 'bg-green-50 text-green-600 border-green-200/60'
                                  : (calcValue !== null ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200')
                                  } ${Number(lead.pending_tasks_count) > 0 || lead.meta_data?.comments?.length > 0 ? '' : 'ml-auto'}`}
                                title={totalPaid > 0 ? `${t('paid') || 'Paid'}: ${totalPaid}` : (calcValue !== null ? t('calculator') || 'Calculator' : t('budget') || 'Budget')}
                              >
                                {calcValue !== null && totalPaid <= 0 ? <Calculator size={10} className="opacity-70" /> : null}
                                {calcValue !== null && totalPaid <= 0 ? `${calcPrefix}${calcValue}${calcSuffix}` : formatPriceLocally(totalPaid > 0 ? totalPaid : leadTotal)}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnLeads.length === 0 && (
                  <div className="h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">
                    {t('drop_here') || 'Drop here'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pro: Add Status Column — rendered by the Pro extension */}
      <ExtensionSlot name="KanbanAddStatus" globalStatuses={globalStatuses} />

    </>
  );
}
