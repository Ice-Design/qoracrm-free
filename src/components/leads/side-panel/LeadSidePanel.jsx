import { useState, useEffect } from 'react';
import { X, Server, Trash2, Tag as TagIcon, Hash, FileText, UserCheck, Ghost, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../../utils/I18nContext.jsx';
import { formatCrmDate, getLeadTotalValue } from '../../../utils/helpers';
import { StatusDropdown } from '../../ui/StatusDropdown';
import { getPermissions } from '../leadHelpers';
import { LeadSidePanelData } from './LeadSidePanelData';
import { LeadSidePanelComments } from './LeadSidePanelComments';
import ExtensionSlot from '../../common/ExtensionSlot';

import { LeadAssigneeBar } from '../LeadAssigneeBar';
import { LeadTasks } from '../LeadTasks';
import { LeadPayments } from '../LeadPayments';

export function LeadSidePanel({ lead, onClose, onUpdate, updateStatus, globalTags, globalStatuses, deleteLeadPermanently, handleMoveToArchive, crmUsers, viewMode, setConfirmAction, t, createHistoryEntry }) {
  const permissions = getPermissions();
  const [schema, setSchema] = useState([]);
  const [formTitle, setFormTitle] = useState('');
  const [formExists, setFormExists] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);

  const [editingFields, setEditingFields] = useState(lead.entry_data || {});
  const [isSaving, setIsSaving] = useState(false);

  const meta = lead.meta_data || {};
  const assignedTags = meta.tags || [];
  const history = meta.history || [];

  useEffect(() => {
    setEditingFields(lead.entry_data || {});
    setFormTitle('');
    setFormExists(false);
    setSchema([]);
    fetchFormSchema();
  }, [lead.id, lead.entry_data]);

  const fetchFormSchema = async () => {
    if (!lead.form_id || String(lead.form_id) === '0') {
      setFormExists(false);
      setIsLoadingSchema(false);
      return;
    }
    setIsLoadingSchema(true);
    try {
      const response = await window.wp.apiFetch({ path: `/qoracrm/v1/forms/${lead.form_id}` });
      if (!response || response.code || response.status === 404 || (!response.id && !response.title && !response.name && !response.data)) {
        setFormExists(false);
        setFormTitle('');
        return;
      }
      setFormExists(true);
      const fTitle = response.name || response.title || response.data?.title || response.data?.name || '';
      if (fTitle) setFormTitle(fTitle);

      let schemaStr = null;
      if (response.fields_schema) {
        schemaStr = response.fields_schema;
      } else if (response.success && response.data && response.data.fields_schema) {
        schemaStr = response.data.fields_schema;
      }

      if (schemaStr) {
        let parsed = schemaStr;
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }

        let fieldsArray = [];
        if (Array.isArray(parsed)) {
          fieldsArray = parsed;
        } else if (parsed && parsed.fields) {
          fieldsArray = parsed.fields;
        }

        // Flatten fields
        const flatFields = [];
        const extract = (fields) => {
          fields.forEach(f => {
            flatFields.push(f);
            if (f.fields) extract(f.fields);
          });
        };
        extract(fieldsArray);
        setSchema(flatFields);
      }
    } catch (e) {
      if (e?.code !== 'qoracrm_form_not_found' && e?.status !== 404) {
        console.error('Failed to fetch schema', e);
      }
      setFormExists(false);
      setFormTitle('');
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setEditingFields(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getFieldLabel = (key) => {
    let id = key.replace('field_', '');
    let suffix = '';
    if (key.endsWith('_min')) {
      id = key.replace('field_', '').replace('_min', '');
      suffix = ` (${t('min') || 'Min'})`;
    } else if (key.endsWith('_max')) {
      id = key.replace('field_', '').replace('_max', '');
      suffix = ` (${t('max') || 'Max'})`;
    } else if (id.endsWith('_single')) {
      id = id.replace('_single', '');
    }

    const savedLabels = lead?.meta_data?.field_labels;
    if (savedLabels) {
      if (savedLabels[key]) return savedLabels[key] + suffix;
      if (savedLabels[`field_${id}`]) return savedLabels[`field_${id}`] + suffix;
      if (savedLabels[id]) return savedLabels[id] + suffix;
    }

    let fieldDef = schema.find(f => String(f.id) === String(id));
    if (!fieldDef) fieldDef = schema.find(f => f.name === key);
    if (!fieldDef) {
      for (const f of schema) {
        if (f.type === 'repeater' && f.fields) {
          const sub = f.fields.find(sf => String(sf.id) === String(id) || sf.name === key);
          if (sub) { fieldDef = sub; break; }
        }
      }
    }

    if (!fieldDef) {
      fieldDef = schema.find(f => f.label === key);
      if (!fieldDef) {
        for (const f of schema) {
          if (f.type === 'repeater' && f.fields) {
            const sub = f.fields.find(sf => sf.label === key);
            if (sub) { fieldDef = sub; break; }
          }
        }
      }
    }

    if (fieldDef?.type === 'consent') return t('consent') || 'Policy';
    if (fieldDef?.label) return fieldDef.label + suffix;

    const addressLabels = { street: t('street_address') || 'Street Address', line2: t('address_line_2') || 'Address Line 2', city: t('city') || 'City', state: t('state_province') || 'State / Province', zip: t('zip_postal_code') || 'ZIP / Postal Code', country: t('country') || 'Country' };
    if (addressLabels[id]) return addressLabels[id] + suffix;

    if (suffix) {
      return (t('slider_settings') ? t('slider_settings').split(' ')[0] : 'Slider') + suffix;
    }

    const standardLabels = {
      name: t('name_label') || 'Name',
      email: t('email_label') || 'Email',
      phone: t('phone') || 'Phone',
      value: t('budget') || 'Budget',
      company: t('company_label') || 'Company',
      message: t('message_label') || 'Message',
      status: t('status') || 'Status',
      total: t('total_field') || t('total') || 'Total',
      total_amount: t('total_field') || t('total') || 'Total',
      total_price: t('total_field') || t('total') || 'Total',
      session_id: t('session_id') || 'Session ID',
      qora_token: t('qora_token') || 'Qora Token',
      abandoned_type: t('abandoned_type') || 'Abandoned Type'
    };
    if (standardLabels[key]) return standardLabels[key];

    if (key.startsWith('product_') || key.startsWith('field_product_')) {
      const matchNum = key.match(/\d+/);
      const numStr = matchNum ? ` ${matchNum[0]}` : '';
      if (key.endsWith('_quantity')) {
        return (t('quantity') || 'Quantity') + numStr;
      }
      return (t('product_field') || t('product') || 'Product') + numStr;
    }

    if (key.startsWith('quantity_') || key.startsWith('field_quantity_')) {
      const matchNum = key.match(/\d+/);
      const numStr = matchNum ? ` ${matchNum[0]}` : '';
      return (t('quantity') || 'Quantity') + numStr;
    }

    if (!key.startsWith('field_')) {
      return key.charAt(0).toUpperCase() + key.slice(1);
    }

    return t('field') || 'Field';
  };

  const handleSaveFields = async () => {
    setIsSaving(true);
    try {
      const changedEntries = [];
      Object.entries(editingFields).forEach(([key, newVal]) => {
        const oldVal = lead.entry_data?.[key];
        if (String(oldVal) !== String(newVal) && typeof newVal === 'string') {
          const label = getFieldLabel(key);
          changedEntries.push(createHistoryEntry(
            `${t('lead_history_field_changed')} "${label}": "${oldVal}" → "${newVal}"`, t
          ));
        }
      });
      const newMeta = changedEntries.length > 0
        ? { ...meta, history: [...history, ...changedEntries] }
        : meta;

      const payload = { entry_data: editingFields };
      if (changedEntries.length > 0) payload.meta_data = newMeta;

      await window.wp.apiFetch({
        path: `/qoracrm/v1/leads/${lead.id}`,
        method: 'PUT',
        data: payload
      });
      onUpdate({ ...lead, entry_data: editingFields, meta_data: newMeta });
    } catch (e) {
      console.error('Error saving fields', e);
    }
    setIsSaving(false);
  };

  const handleStatusChange = (newStatus) => {
    const oldStatus = globalStatuses.find(s => s.id === lead.status)?.label || lead.status;
    const newStatusLabel = globalStatuses.find(s => s.id === newStatus)?.label || newStatus;
    const histEntry = createHistoryEntry(
      `${t('lead_history_status_changed')} "${oldStatus}" → "${newStatusLabel}"`, t
    );
    updateStatus(lead.id, newStatus, histEntry);
  };

  const updateMeta = async (newMeta) => {
    try {
      await window.wp.apiFetch({
        path: `/qoracrm/v1/leads/${lead.id}`,
        method: 'PUT',
        data: { meta_data: newMeta }
      });
      onUpdate({ ...lead, meta_data: newMeta });
    } catch (e) {
      console.error('Error updating meta', e);
    }
  };

  const toggleTag = (tagId) => {
    const isAssigned = assignedTags.includes(tagId);
    const newTags = isAssigned
      ? assignedTags.filter(id => id !== tagId)
      : [...assignedTags, tagId];

    const tagObj = globalTags.find(t => t.id === tagId);
    const tagName = tagObj ? tagObj.label : tagId;
    const actionText = isAssigned
      ? (t('lead_history_tag_removed') || 'Removed tag')
      : (t('lead_history_tag_added') || 'Added tag');

    const histEntry = createHistoryEntry(`${actionText} "${tagName}"`, t);

    updateMeta({ ...meta, tags: newTags, history: [...history, histEntry] });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0 bg-white/80 backdrop-blur-xs">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight shrink-0">Lead #{lead.id}</h2>
          <span className="text-xs text-gray-400 font-medium shrink-0">{formatCrmDate(lead.created_at, t)}</span>
          {lead.status === 'archive' || lead.status === 'spam' || lead.status === 'abandoned' ? (
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
              <span className={`w-2 h-2 rounded-full shrink-0 ${lead.status === 'spam' ? 'bg-amber-500' : lead.status === 'abandoned' ? 'bg-indigo-500' : 'bg-gray-400'}`}></span>
              <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                {lead.status === 'spam' ? (t('spam') || 'Spam') : lead.status === 'abandoned' ? (t('abandoned_forms') || 'Abandoned') : (t('archived') || 'Archived')}
              </span>
            </div>
          ) : (
            <StatusDropdown
              value={lead.status}
              onChange={handleStatusChange}
              statuses={globalStatuses}
              disabled={!permissions.can_edit_status_tags}
              menuPosition="bottom"
            />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lead.status === 'archive' || lead.status === 'spam' || lead.status === 'abandoned' ? (
            permissions.is_admin && (
              <div className="flex items-center gap-2 mr-2">
                <button
                  onClick={() => {
                    let histText = t('lead_history_restored') || 'Restored from archive';
                    if (lead.status === 'abandoned') histText = t('lead_history_converted') || 'Converted from abandoned form';
                    if (lead.status === 'spam') histText = t('lead_history_restored_spam') || 'Restored from spam';
                    updateStatus(lead.id, 'new', createHistoryEntry(histText, t));
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  <UserCheck size={15} />
                  <span>{lead.status === 'spam' ? (t('not_spam') || 'Not Spam') : lead.status === 'abandoned' ? (t('convert_to_lead') || 'Convert to Lead') : (t('restore') || 'Restore')}</span>
                </button>
                <button
                  onClick={() => deleteLeadPermanently(lead.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-200/80 shadow-2xs active:scale-95 cursor-pointer"
                  title={t('delete_permanently') || 'Delete Permanently'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          ) : (
            permissions.can_delete && (
              <button
                onClick={() => handleMoveToArchive(lead.id)}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-colors mr-2"
                title={t('move_to_archive') || 'Move to Archive'}
              >
                <Server size={18} />
              </button>
            )
          )}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Assignee Bar (Pro feature via ExtensionSlot) */}
      <ExtensionSlot
        name="LeadAssigneeBar"
        lead={lead}
        crmUsers={crmUsers}
        onUpdate={onUpdate}
        createHistoryEntry={createHistoryEntry}
        permissions={permissions}
        t={t}
        fallback={
          <LeadAssigneeBar
            lead={lead}
            crmUsers={crmUsers}
            onUpdate={onUpdate}
            createHistoryEntry={createHistoryEntry}
            permissions={permissions}
            t={t}
          />
        }
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">

        {/* Tags Section */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
          <div className="flex items-center gap-2 mb-5 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
            <TagIcon size={14} className="text-primary" /> {t('assigned_tags') || 'Assigned Tags'}
          </div>
          <div className="flex flex-wrap gap-2">
            {globalTags.map((tag) => {
              const isAssigned = assignedTags.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  disabled={!permissions.can_edit_status_tags}
                  onClick={() => {
                    if (!permissions.can_edit_status_tags) return;
                    toggleTag(tag.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${!permissions.can_edit_status_tags ? 'opacity-60 cursor-not-allowed' : ''} ${isAssigned ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  style={isAssigned ? { backgroundColor: tag.color } : {}}
                >
                  <span>{tag.label}</span>
                </button>
              );
            })}
            {globalTags.length === 0 && <span className="text-sm text-gray-400">No tags configured in settings.</span>}
          </div>
        </section>

        <LeadSidePanelData
          lead={lead}
          editingFields={editingFields}
          handleFieldChange={handleFieldChange}
          schema={schema}
          permissions={permissions}
          isLoadingSchema={isLoadingSchema}
          t={t}
          isSaving={isSaving}
          handleSaveFields={handleSaveFields}
          getFieldLabel={getFieldLabel}
        />

        <LeadSidePanelComments
          lead={lead}
          t={t}
          permissions={permissions}
          createHistoryEntry={createHistoryEntry}
          crmUsers={crmUsers}
          onUpdate={onUpdate}
          setConfirmAction={setConfirmAction}
        />

        <ExtensionSlot
          name="LeadTasks"
          leadId={lead.id}
          wpUsers={crmUsers}
          onTasksCountChange={(delta) => onUpdate({ ...lead, pending_tasks_count: Math.max(0, (Number(lead.pending_tasks_count) || 0) + delta) })}
          setConfirmAction={setConfirmAction}
          fallback={
            <LeadTasks
              leadId={lead.id}
              wpUsers={crmUsers}
              onTasksCountChange={(delta) => onUpdate({ ...lead, pending_tasks_count: Math.max(0, (Number(lead.pending_tasks_count) || 0) + delta) })}
              setConfirmAction={setConfirmAction}
            />
          }
        />

        <ExtensionSlot
          name="LeadPayments"
          leadId={lead.id}
          totalBudget={getLeadTotalValue(lead)}
          payments={meta.payments || []}
          meta={meta}
          onUpdate={onUpdate}
          t={t}
          createHistoryEntry={createHistoryEntry}
          setConfirmAction={setConfirmAction}
          fallback={
            <LeadPayments
              leadId={lead.id}
              totalBudget={getLeadTotalValue(lead)}
              payments={meta.payments || []}
              meta={meta}
              onUpdate={onUpdate}
              t={t}
              createHistoryEntry={createHistoryEntry}
              setConfirmAction={setConfirmAction}
            />
          }
        />

        {/* Meta Data Section */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400 mb-5">
            <Hash size={14} className="text-primary" /> {t('tracking_meta') || 'Tracking Meta'}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {lead.form_id && String(lead.form_id) !== '0' && formExists && (
              <div className="col-span-2 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 mb-1">{t('submitted_from_form') || 'Submitted From Form'}</div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>{formTitle ? formTitle : `${t('form') || 'Form'} #${lead.form_id}`}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">ID: #{lead.form_id}</span>
                  </div>
                </div>
                <a
                  href={`#/forms/builder/${lead.form_id}`}
                  className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  title={t('edit_form') || 'Edit Form'}
                >
                  <FileText size={12} />
                  <span>{t('edit_form') || 'Edit Form'}</span>
                </a>
              </div>
            )}

            {meta.ip && meta.ip !== '-' && (
              <div>
                <div className="text-[11px] font-semibold text-gray-500 mb-1">{t('ip_address') || 'IP Address'}</div>
                <div className="text-xs font-medium text-gray-900">{meta.ip}</div>
              </div>
            )}

            {lead.entry_data && lead.entry_data.qora_token && (
              <div>
                <div className="text-[11px] font-semibold text-gray-500 mb-1">Qora Token</div>
                <div className="text-xs font-medium text-primary break-all">
                  <a
                    href={`${meta.referer || meta.landing_page || window.location.origin}${(meta.referer || meta.landing_page || '').includes('?') ? '&' : '?'}qora_token=${lead.entry_data.qora_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline inline-flex items-center gap-1"
                    title="View abandoned form session"
                  >
                    {lead.entry_data.qora_token}
                  </a>
                </div>
              </div>
            )}

            {Object.entries(meta).map(([k, v]) => {
              if (['comments', 'tags', 'history', 'payments', 'ip', 'referer', 'landing_page', 'order', 'field_labels'].includes(k)) return null;
              if (!v || v === '-') return null;
              const label = t(k.toLowerCase()) || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={k}>
                  <div className="text-[11px] font-semibold text-gray-500 mb-1">{label}</div>
                  <div className="text-xs font-medium text-gray-900 break-all">{typeof v === 'object' && v !== null ? JSON.stringify(v) : v}</div>
                </div>
              );
            })}

            {meta.referer && meta.referer !== '-' && (
              <div className="col-span-2 pt-2 border-t border-gray-200/60">
                <div className="text-[11px] font-semibold text-gray-500 mb-1">{t('referer') || 'Referer'}</div>
                <div className="text-xs font-medium text-gray-900 truncate" title={meta.referer}>{meta.referer}</div>
              </div>
            )}
            {meta.landing_page && meta.landing_page !== '-' && (
              <div className="col-span-2 pt-2 border-t border-gray-200/60">
                <div className="text-[11px] font-semibold text-gray-500 mb-1">{t('landing_page') || 'Landing Page'}</div>
                <div className="text-xs font-medium text-gray-900 truncate" title={meta.landing_page}>{meta.landing_page}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
