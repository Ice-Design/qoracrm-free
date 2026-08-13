import { useState } from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';
import { WpEditor } from '../../ui/WpEditor';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export function MailSmtpTab() {
  const { t } = useI18n();
  const { smtp, email_templates, setSmtp, setEmailTemplates } = useSettingsStore();

  const [expandedTemplateId, setExpandedTemplateId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null); // { id, name, subject, body } or 'new'

  const handleSmtpChange = (key, val) => {
    setSmtp({ [key]: val });
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name.trim()) return;

    let updatedList;
    if (editingTemplate.id === 'new') {
      const newTpl = {
        ...editingTemplate,
        id: 'tpl_' + Math.random().toString(36).substring(2, 10)
      };
      updatedList = [...email_templates, newTpl];
    } else {
      updatedList = email_templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    }

    setEmailTemplates(updatedList);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id, e) => {
    e.stopPropagation();
    if (window.confirm(t('confirm_delete_template') || 'Are you sure you want to delete this template?')) {
      const updated = email_templates.filter(t => t.id !== id);
      setEmailTemplates(updated);
      if (expandedTemplateId === id) setExpandedTemplateId(null);
      if (editingTemplate?.id === id) setEditingTemplate(null);
    }
  };

  const startAddTemplate = () => {
    setEditingTemplate({
      id: 'new',
      name: '',
      subject: '',
      body: ''
    });
  };

  const startEditTemplate = (tpl, e) => {
    e.stopPropagation();
    setEditingTemplate({ ...tpl });
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* 1. SMTP Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('smtp_configuration') || 'SMTP Configuration'}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {t('smtp_description') || 'Configure your custom SMTP server to handle all outgoing WordPress/CRM emails reliably.'}
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors border border-gray-100">
            <input
              type="checkbox"
              checked={!!smtp.enabled}
              onChange={(e) => handleSmtpChange('enabled', e.target.checked)}
              className="accent-primary w-5 h-5"
            />
            <div>
              <span className="text-sm font-semibold text-gray-800">{t('enable_smtp') || 'Enable SMTP'}</span>
              <p className="text-[11px] text-gray-500 mt-0.5">{t('enable_smtp_help') || 'Redirect all WP mail through this custom SMTP server'}</p>
            </div>
          </label>

          {smtp.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('smtp_host') || 'SMTP Host'}</label>
                <input
                  type="text"
                  value={smtp.host || ''}
                  onChange={(e) => handleSmtpChange('host', e.target.value)}
                  placeholder="smtp.example.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('smtp_port') || 'SMTP Port'}</label>
                  <input
                    type="number"
                    value={smtp.port || 587}
                    onChange={(e) => handleSmtpChange('port', parseInt(e.target.value, 10) || 587)}
                    placeholder="587"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('encryption') || 'Encryption'}</label>
                  <select
                    value={smtp.encryption || 'tls'}
                    onChange={(e) => handleSmtpChange('encryption', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="none">{t('none') || 'None'}</option>
                    <option value="ssl">SSL</option>
                    <option value="tls">TLS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('smtp_username') || 'Username'}</label>
                <input
                  type="text"
                  value={smtp.username || ''}
                  onChange={(e) => handleSmtpChange('username', e.target.value)}
                  placeholder="user@example.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('smtp_password') || 'Password'}</label>
                <input
                  type="password"
                  value={smtp.password || ''}
                  onChange={(e) => handleSmtpChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('from_email') || 'From Email'}</label>
                <input
                  type="email"
                  value={smtp.from_email || ''}
                  onChange={(e) => handleSmtpChange('from_email', e.target.value)}
                  placeholder="noreply@example.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('from_name') || 'From Name'}</label>
                <input
                  type="text"
                  value={smtp.from_name || ''}
                  onChange={(e) => handleSmtpChange('from_name', e.target.value)}
                  placeholder="My Brand Name"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors border border-gray-100 mt-2">
            <input
              type="checkbox"
              checked={smtp.send_admin_email !== false}
              onChange={(e) => handleSmtpChange('send_admin_email', e.target.checked)}
              className="accent-primary w-5 h-5"
            />
            <div>
              <span className="text-sm font-semibold text-gray-800">{t('send_admin_email') || 'Send Admin Notifications'}</span>
              <p className="text-[11px] text-gray-500 mt-0.5">{t('send_admin_email_help') || 'Send email to administrators about every new lead submission'}</p>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Email Templates Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('email_templates') || 'Email Templates'}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {t('templates_description') || 'Create global email templates that can be assigned to different forms to notify clients.'}
            </p>
          </div>
          {!editingTemplate && (
            <button
              onClick={startAddTemplate}
              className="flex items-center gap-1.5 px-3 shrink-0 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors shadow-sm"
            >
              <Plus size={14} />
              {t('add_template') || 'Add Template'}
            </button>
          )}
        </div>

        {editingTemplate && (
          <div className="p-4 border border-primary/20 bg-primary-light/5 rounded-xl space-y-4 animate-fade-in">
            <h4 className="text-sm font-bold text-primary-dark">
              {editingTemplate.id === 'new' ? (t('new_template') || 'New Template') : (t('edit_template') || 'Edit Template')}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('template_name') || 'Template Name'}</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="e.g. Customer Welcome Email"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('email_subject') || 'Email Subject'}</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  placeholder="e.g. Thanks for contacting us!"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('email_body') || 'Email Body'}</label>
                <WpEditor
                  id={`email-tpl-editor-${editingTemplate.id}`}
                  value={editingTemplate.body || ''}
                  onChange={(val) => setEditingTemplate({ ...editingTemplate, body: val })}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Supported dynamic tags: <code className="bg-gray-100 px-1 rounded">{'{lead_data}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{form_id}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{date}'}</code>, and form field placeholders (e.g. <code className="bg-gray-100 px-1 rounded">{'{field_name}'}</code>).
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Check size={14} />
                {t('save') || 'Save'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {email_templates.map((tpl) => {
            const isExpanded = expandedTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200/80 transition-colors"
              >
                <div
                  onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                  className="flex items-center justify-between p-4 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{tpl.name}</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">{t('subject') || 'Subject'}: {tpl.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => startEditTemplate(tpl, e)}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-gray-100 shadow-sm transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 shadow-sm transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-100 text-xs text-gray-600 space-y-2 font-mono whitespace-pre-wrap">
                    {tpl.body || <span className="italic text-gray-400">No body content</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
