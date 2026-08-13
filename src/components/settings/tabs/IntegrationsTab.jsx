import { Webhook } from 'lucide-react';
import { useState } from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';
import ExtensionSlot from '../../common/ExtensionSlot';
import { ProBanner } from '../../common/ProBadge';

export function IntegrationsTab() {
  const { t } = useI18n();
  const { integrations, setIntegrations } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-gray-100 shrink-0">
        <div className="text-lg font-bold text-gray-900 mb-1">{t('tab_integrations')}</div>
        <p className="text-sm text-gray-500 mb-6">{t('integrations_desc') || 'Configure where lead data is sent upon form submission.'}</p>
        
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t('notifications') || 'Notifications'}
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'api' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t('api') || 'API'}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t('payments') || 'Payments'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {activeTab === 'notifications' && (
          <>
            {/* Email */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
              <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {t('email_notification') || 'Email Notification'}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('notification_email') || 'Notification Email'}</label>
                <input type="email" value={integrations.notificationEmail || ''}
                  onChange={e => setIntegrations({ ...integrations, notificationEmail: e.target.value })}
                  className="w-full max-w-md border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={t('leave_empty_admin_email') || 'Leave empty to use WordPress admin email'} />
              </div>
            </div>
            {/* Webhook */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
              <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Webhook size={18} className="text-primary" /> {t('webhook') || 'Webhook'}
              </div>
              <p className="text-xs text-gray-500">{t('webhook_desc') || 'Send a POST request with JSON payload for each new lead.'}</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('webhook_url') || 'Webhook URL'}</label>
                <input type="url" value={integrations.webhookUrl || ''}
                  onChange={e => setIntegrations({ ...integrations, webhookUrl: e.target.value })}
                  className="w-full max-w-md border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[13px]"
                  placeholder="https://hook.make.com/..." />
              </div>
            </div>
            {/* Telegram */}
            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
              <div className="font-bold text-[#0088cc] text-sm flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z" /></svg>
                {t('telegram_bot') || 'Telegram Bot'}
              </div>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-blue-900 mb-1.5">{t('bot_token') || 'Bot Token'}</label>
                  <input type="text" value={integrations.tgBotToken || ''}
                    onChange={e => setIntegrations({ ...integrations, tgBotToken: e.target.value })}
                    className="w-full border border-blue-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] font-mono text-[13px] bg-white"
                    placeholder="123456789:ABCdef..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-900 mb-1.5">{t('chat_ids') || 'Chat ID(s)'}</label>
                  <input type="text" value={integrations.tgChatId || ''}
                    onChange={e => setIntegrations({ ...integrations, tgChatId: e.target.value })}
                    className="w-full border border-blue-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] font-mono text-[13px] bg-white"
                    placeholder="-1001234567890" />
                  <span className="text-[11px] text-blue-800/60 mt-1 block">{t('use_comma_for_multiple') || 'Use comma for multiple Chat IDs.'}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'api' && (
          <>
            {/* Inbound API / Webhooks */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4 text-white">
              <div className="font-bold text-white text-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Webhook size={18} className="text-primary" /> {t('inbound_api_webhook') || 'Inbound API (Create Leads)'}
                </div>
                <button 
                  onClick={() => {
                    const newKey = {
                      id: Math.random().toString(36).substr(2, 9),
                      label: 'API Key',
                      key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                    };
                    setIntegrations({ ...integrations, api_keys: [...(integrations.api_keys || []), newKey] });
                  }}
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                >
                  + {t('add_api_key') || 'Add API Key'}
                </button>
              </div>
              <p className="text-xs text-gray-400">{t('inbound_api_desc') || 'Use this endpoint to create leads from external systems like Zapier or Make.'}</p>
              
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t('api_keys_list') || 'Active API Keys'}</label>
                    {(integrations.api_keys || []).length === 0 && (
                      <div className="text-xs text-gray-500 italic mb-2">No API keys generated. Click "Add API Key" to create one.</div>
                    )}
                    <div className="space-y-3">
                      {(integrations.api_keys || []).map((apiKey, index) => (
                        <div key={apiKey.id} className="flex flex-col md:flex-row gap-2 md:items-center bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                          <div className="flex flex-1 gap-2 items-center">
                            <input 
                              type="text" 
                              value={apiKey.label}
                              onChange={e => {
                                const newKeys = [...integrations.api_keys];
                                newKeys[index].label = e.target.value;
                                setIntegrations({ ...integrations, api_keys: newKeys });
                              }}
                              className="w-full md:w-1/3 bg-transparent border-b border-gray-600 px-1 py-1 text-xs outline-none focus:border-primary text-gray-300"
                              placeholder="Key Name (e.g., Zapier)" 
                            />
                            <input type="text" value={apiKey.key}
                              onChange={e => {
                                const newKeys = [...integrations.api_keys];
                                newKeys[index].key = e.target.value;
                                setIntegrations({ ...integrations, api_keys: newKeys });
                              }}
                              className="flex-1 border border-gray-700 bg-gray-800 px-3 py-1.5 rounded text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-white"
                              placeholder="Secret token" />
                            <button 
                              onClick={() => {
                                const newKeys = [...integrations.api_keys];
                                newKeys[index].key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                                setIntegrations({ ...integrations, api_keys: newKeys });
                              }}
                              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold transition-colors shrink-0"
                              title={t('regenerate_token') || "Regenerate Token"}
                            >
                              {t('generate') || 'Regenerate'}
                            </button>
                            <button 
                              onClick={() => {
                                const newKeys = integrations.api_keys.filter(k => k.id !== apiKey.id);
                                setIntegrations({ ...integrations, api_keys: newKeys });
                              }}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1"
                              title={t('remove_key') || "Remove Key"}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 mt-2">{t('endpoint_url') || 'Endpoint URL'}</label>
                    <div className="w-full bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-lg font-mono text-[12px] text-gray-300 break-all select-all">
                      {window.qoraCrmData?.apiUrl}leads/webhook
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t('json_payload_example') || 'JSON Payload Example'}</label>
                  <div className="bg-black/50 border border-gray-800 rounded-lg p-4 font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre w-full">
{`{
  "api_key": "${(integrations.api_keys && integrations.api_keys[0]) ? integrations.api_keys[0].key : 'YOUR_SECRET_KEY'}",
  "status": "new", // default to new
  "tags": ["api", "lead"],
  "entry_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "comment": "Lead from API"
  },
  "address": {
    "street": "123 Main St",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "products": [
    { "name": "Basic Plan", "quantity": 2, "price": 150 },
    { "name": "Setup Fee", "quantity": 1, "price": 50 }
  ],
  "total": 350,
  "meta_data": {
    "utm_source": "facebook",
    "utm_medium": "cpc",
    "utm_campaign": "summer_sale"
  }
}`}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'payments' && (
          <ExtensionSlot
            name="StripeIntegration"
            fallback={
              <ProBanner
                feature="payments_integration"
                label={t('payments_integration') || 'Payments Integration (Stripe)'}
              />
            }
          />
        )}
      </div>
    </div>
  );
}
