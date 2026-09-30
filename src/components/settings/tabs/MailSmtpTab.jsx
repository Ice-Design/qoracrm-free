import { useState } from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Send, Globe } from 'lucide-react';
import { EmailModalEditor } from '../../automations/EmailModalEditor';
import { isPro } from '../../../hooks/useFeature';
import { ConfirmModal } from '../../ui/ConfirmModal';

const PROVIDERS = [
  { id: 'smtp', name: 'Custom SMTP', desc: 'Standard SMTP credentials', pro: false },
  { id: 'sendgrid', name: 'SendGrid API', desc: 'High deliverability via SendGrid v3 API', pro: true },
  { id: 'mailgun', name: 'Mailgun API', desc: 'Transactional emails via Mailgun API', pro: true },
  { id: 'ses', name: 'Amazon SES', desc: 'Cost-effective AWS Simple Email Service', pro: true },
  { id: 'brevo', name: 'Brevo (Sendinblue)', desc: 'European transactional email API', pro: true },
  { id: 'postmark', name: 'Postmark API', desc: 'Lightning-fast delivery via Postmark API', pro: true },
];

export function MailSmtpTab() {
  const { t } = useI18n();
  const { smtp, email_templates, setSmtp, setEmailTemplates } = useSettingsStore();

  const [expandedTemplateId, setExpandedTemplateId] = useState(null);
  const [modalTemplate, setModalTemplate] = useState(null); // null or template object
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const handleSmtpChange = (key, val) => {
    setSmtp({ [key]: val });
  };

  const handleSaveModalTemplate = (saved) => {
    if (!saved.name?.trim()) return;

    let updatedList;
    if (!saved.id || saved.id === 'new' || String(saved.id).startsWith('new_')) {
      const newTpl = {
        id: 'tpl_' + Math.random().toString(36).substring(2, 10),
        name: saved.name.trim(),
        subject: saved.subject.trim(),
        body: saved.body || '',
      };
      updatedList = [...email_templates, newTpl];
    } else {
      updatedList = email_templates.map(t =>
        t.id === saved.id
          ? { ...t, name: saved.name.trim(), subject: saved.subject.trim(), body: saved.body || '' }
          : t
      );
    }

    setEmailTemplates(updatedList);
    setModalTemplate(null);
  };

  const handleDeleteTemplate = (id, e) => {
    e.stopPropagation();
    setTemplateToDelete(id);
  };

  const handleConfirmDeleteTemplate = () => {
    if (!templateToDelete) return;
    const updated = email_templates.filter(t => t.id !== templateToDelete);
    setEmailTemplates(updated);
    if (expandedTemplateId === templateToDelete) setExpandedTemplateId(null);
    if (modalTemplate?.id === templateToDelete) setModalTemplate(null);
    setTemplateToDelete(null);
  };

  const provider = smtp.provider || 'smtp';

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* 1. Email Provider Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('email_provider') || 'Email Delivery Provider'}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {t('smtp_description') || 'Configure your custom SMTP server or email API provider to handle all outgoing WordPress/CRM emails reliably.'}
          </p>
        </div>

        {/* Enable SMTP Checkbox at top */}
        <label className="flex items-center gap-3.5 cursor-pointer p-4 bg-gray-50/80 rounded-xl hover:bg-gray-100/70 transition-colors border border-gray-200/80 select-none">
          <input
            type="checkbox"
            checked={!!smtp.enabled}
            onChange={(e) => handleSmtpChange('enabled', e.target.checked)}
            className="accent-primary w-5 h-5 cursor-pointer rounded"
          />
          <div>
            <span className="text-sm font-bold text-gray-800">{t('enable_smtp') || 'Enable SMTP'}</span>
            <p className="text-xs text-gray-500 mt-0.5">{t('enable_smtp_help') || 'Redirect all WP mail through this custom SMTP server'}</p>
          </div>
        </label>

        {/* Providers & Settings only visible when SMTP is enabled */}
        {smtp.enabled && (
          <div className="space-y-6 pt-1 animate-fade-in">
            {/* Provider Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">{t('select_provider') || 'Provider'}</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSmtpChange('provider', p.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${provider === p.id
                      ? 'border-primary bg-primary-light/40 shadow-xs ring-2 ring-primary/40'
                      : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/70 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${provider === p.id ? 'text-primary-dark font-extrabold' : 'text-gray-800'}`}>
                        {p.name}
                      </span>
                      {p.pro && !isPro && <span className="text-[10px] text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded font-bold">PRO</span>}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* API-specific credentials */}
            {provider === 'sendgrid' && (
              <div className="p-4 bg-primary-light/20 rounded-xl border border-primary/20 space-y-3">
                <label className="block text-xs font-semibold text-gray-700">SendGrid API Key</label>
                <input
                  type="password"
                  value={smtp.sendgrid_api_key || ''}
                  onChange={e => handleSmtpChange('sendgrid_api_key', e.target.value)}
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxx"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            {provider === 'mailgun' && (
              <div className="p-4 bg-primary-light/20 rounded-xl border border-primary/20 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mailgun API Key</label>
                  <input
                    type="password"
                    value={smtp.mailgun_api_key || ''}
                    onChange={e => handleSmtpChange('mailgun_api_key', e.target.value)}
                    placeholder="key-xxxxxxxxxxxx"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mailgun Domain</label>
                  <input
                    type="text"
                    value={smtp.mailgun_domain || ''}
                    onChange={e => handleSmtpChange('mailgun_domain', e.target.value)}
                    placeholder="mg.yourdomain.com"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}

            {provider === 'ses' && (
              <div className="p-4 bg-primary-light/20 rounded-xl border border-primary/20 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">AWS Access Key</label>
                  <input
                    type="text"
                    value={smtp.ses_access_key || ''}
                    onChange={e => handleSmtpChange('ses_access_key', e.target.value)}
                    placeholder="AKIA..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">AWS Secret Key</label>
                  <input
                    type="password"
                    value={smtp.ses_secret_key || ''}
                    onChange={e => handleSmtpChange('ses_secret_key', e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">AWS Region</label>
                  <input
                    type="text"
                    value={smtp.ses_region || 'us-east-1'}
                    onChange={e => handleSmtpChange('ses_region', e.target.value)}
                    placeholder="us-east-1"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}

            {provider === 'brevo' && (
              <div className="p-4 bg-primary-light/20 rounded-xl border border-primary/20 space-y-3">
                <label className="block text-xs font-semibold text-gray-700">Brevo API Key (v3)</label>
                <input
                  type="password"
                  value={smtp.brevo_api_key || ''}
                  onChange={e => handleSmtpChange('brevo_api_key', e.target.value)}
                  placeholder="xkeysib-xxxxxxxxxxxx"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            {provider === 'postmark' && (
              <div className="p-4 bg-primary-light/20 rounded-xl border border-primary/20 space-y-3">
                <label className="block text-xs font-semibold text-gray-700">Postmark Server API Token</label>
                <input
                  type="password"
                  value={smtp.postmark_token || ''}
                  onChange={e => handleSmtpChange('postmark_token', e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            {/* Standard SMTP Credentials */}
            {provider === 'smtp' && (
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
              </div>
            )}

            {/* Sender Details (Applies to all providers) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('from_email') || 'From Email'}</label>
                <input
                  type="email"
                  value={smtp.from_email || ''}
                  onChange={(e) => handleSmtpChange('from_email', e.target.value)}
                  placeholder="noreply@example.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('from_name') || 'From Name'}</label>
                <input
                  type="text"
                  value={smtp.from_name || ''}
                  onChange={(e) => handleSmtpChange('from_name', e.target.value)}
                  placeholder="My Brand Name"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors border border-gray-100 select-none">
          <input
            type="checkbox"
            checked={smtp.send_admin_email !== false}
            onChange={(e) => handleSmtpChange('send_admin_email', e.target.checked)}
            className="accent-primary w-5 h-5 cursor-pointer rounded"
          />
          <div>
            <span className="text-sm font-semibold text-gray-800">{t('send_admin_email') || 'Send Admin Notifications'}</span>
            <div className="text-[11px] text-gray-500 mt-0.5">{t('send_admin_email_help') || 'Send email to administrators about every new lead submission'}</div>
          </div>
        </label>
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
          <button
            type="button"
            onClick={() => setModalTemplate({ id: '', name: '', subject: '', body: '' })}
            className="flex items-center shrink-0 gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Plus size={14} />
            {t('add_template') || 'Add Template'}
          </button>
        </div>

        {/* Unified Email Modal Editor */}
        {modalTemplate && (
          <EmailModalEditor
            initialId={modalTemplate.id}
            initialName={modalTemplate.name || ''}
            initialSubject={modalTemplate.subject || ''}
            initialBody={modalTemplate.body || ''}
            showNameField={true}
            onSave={handleSaveModalTemplate}
            onClose={() => setModalTemplate(null)}
          />
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
                      <div className="text-[11px] text-gray-500 mt-0.5">{t('subject') || 'Subject'}: {tpl.subject}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTemplate({ ...tpl });
                      }}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-gray-100 shadow-sm transition-all cursor-pointer"
                      title={t('edit_template') || 'Edit Template'}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 shadow-sm transition-all cursor-pointer"
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

      {/* Delete Template Confirmation Modal */}
      {templateToDelete && (
        <ConfirmModal
          title={t('delete_template') || 'Delete Template'}
          message={t('confirm_delete_template') || 'Are you sure you want to delete this template?'}
          confirmText={t('delete') || 'Delete'}
          isDestructive={true}
          onConfirm={handleConfirmDeleteTemplate}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </div>
  );
}
