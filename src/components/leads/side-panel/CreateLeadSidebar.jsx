import { useState } from 'react';
import { Tag as TagIcon, Check, Plus, Trash2 } from 'lucide-react';
import { CustomSelect } from '../../ui/CustomSelect';
import { showGlobalToast } from '../../../utils/helpers';
import ExtensionSlot from '../../common/ExtensionSlot';

export function CreateLeadSidebar({ onClose, onCreated, globalTags, globalStatuses, crmUsers, t }) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('new');
  const [assigneeId, setAssigneeId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [fields, setFields] = useState({});
  const [customFields, setCustomFields] = useState([]);

  const handleCreate = async () => {
    setIsSaving(true);

    const entry_data = { ...fields };
    customFields.forEach(cf => {
      if (cf.key.trim() !== '') {
        entry_data[cf.key] = cf.value;
      }
    });

    try {
      const response = await window.wp.apiFetch({
        path: '/qoracrm/v1/leads',
        method: 'POST',
        data: {
          status,
          assignee_id: assigneeId,
          entry_data,
          meta_data: { tags: selectedTags }
        }
      });
      if (response && response.success) {
        onCreated(response.lead);
        onClose();
      }
    } catch (e) {
      console.error(e);
      showGlobalToast(t('Failed to create lead'), 'error');
    }
    setIsSaving(false);
  };

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const coreFields = [
    { id: 'name', label: t('name_label') || 'Name' },
    { id: 'email', label: t('email_label') || 'Email' },
    { id: 'phone', label: t('phone') || 'Phone' },
    { id: 'value', label: t('budget') || 'Budget' },
    { id: 'comment', label: t('comments') || 'Comment / Note' }
  ];

  const renderInput = (key) => {
    const isTextarea = key === 'comment';
    if (isTextarea) {
      return (
        <textarea
          value={fields[key] || ''}
          onChange={e => setFields({ ...fields, [key]: e.target.value })}
          className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
        />
      );
    }
    return (
      <input
        type="text"
        value={fields[key] || ''}
        onChange={e => setFields({ ...fields, [key]: e.target.value })}
        className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{t('create_lead') || 'Create Lead'}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('manual_lead_desc') || 'Manually add a new lead'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
          >
            {isSaving ? (t('saving') || 'Saving...') : (
              <>
                <Check size={16} />
                {t('create_lead') || 'Create'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Settings */}
      <div className="px-8 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-6 shrink-0 flex-wrap">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-gray-500 shrink-0">{t('status') || 'Status'}:</span>
          <CustomSelect
            value={status}
            onChange={setStatus}
            minWidth="w-48"
            options={globalStatuses.map((s, index) => ({
              value: s.id,
              label: s.label,
              color: s.color,
              isLocked: window.QoraCRM?.isStatusLocked?.(index) ?? false
            }))}
          />
        </div>

        <ExtensionSlot
          name="LeadAssigneeBar"
          assigneeId={assigneeId}
          setAssigneeId={setAssigneeId}
          crmUsers={crmUsers}
          t={t}
        />
      </div>

      {/* Scrollable Form */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">

        {/* Tags Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            <TagIcon size={14} /> {t('assigned_tags') || 'Assigned Tags'}
          </div>
          <div className="flex flex-wrap gap-2">
            {globalTags.map((tag, tagIndex) => {
              const isAssigned = selectedTags.includes(tag.id);
              const isLocked = window.QoraCRM?.isTagLocked?.(tagIndex) ?? false;
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (isLocked) {
                      if (window.qoraOpenUpgradeModal) window.qoraOpenUpgradeModal(t('tab_tags') || 'Tags');
                    } else {
                      toggleTag(tag.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${isAssigned ? 'text-white border-transparent' : (isLocked ? 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300')
                    }`}
                  style={isAssigned ? { backgroundColor: tag.color } : {}}
                >
                  <span>{tag.label}</span>
                  {isLocked && <span className="text-[10px]" title={t('premium_feature') || "Premium Feature"}>🔒</span>}
                </button>
              );
            })}
            {globalTags.length === 0 && <span className="text-sm text-gray-400">No tags available.</span>}
          </div>
        </section>

        {/* Form Fields Section */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('lead_details') || 'Lead Details'}</h3>
          <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">

              {coreFields.map(field => (
                <div key={field.id} className={field.id === 'comment' ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{field.label}</label>
                  {renderInput(field.id)}
                </div>
              ))}

              <div className="col-span-2 border-t border-gray-200/60 my-2"></div>

              <div className="col-span-2 flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('custom_fields') || 'Custom Fields'}</div>
                <button
                  onClick={() => setCustomFields([...customFields, { key: '', value: '' }])}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                >
                  <Plus size={14} /> {t('add_custom_field') || 'Add Custom Field'}
                </button>
              </div>

              {customFields.map((cf, index) => (
                <div key={index} className="col-span-2 flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={t('custom_field_name') || 'Field Name'}
                      value={cf.key}
                      onChange={e => {
                        const newCf = [...customFields];
                        newCf[index].key = e.target.value;
                        setCustomFields(newCf);
                      }}
                      className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={t('custom_field_value') || 'Field Value'}
                      value={cf.value}
                      onChange={e => {
                        const newCf = [...customFields];
                        newCf[index].value = e.target.value;
                        setCustomFields(newCf);
                      }}
                      className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                    className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors mt-0.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
