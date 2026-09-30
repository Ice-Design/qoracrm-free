import {
  Webhook,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  ShieldCheck,
  QrCode,
  Trash2,
  Smartphone,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';
import { useFeature } from '../../../hooks/useFeature';
import ExtensionSlot from '../../common/ExtensionSlot';
import { ProBanner, UpgradeModal } from '../../common/ProBadge';

export function IntegrationsTab() {
  const { t } = useI18n();
  const { isPro } = useFeature();
  const { integrations, setIntegrations } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('notifications');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // WhatsApp Notification State
  const [waChannel, setWaChannel] = useState(null);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [waTestStatus, setWaTestStatus] = useState(null);

  useEffect(() => {
    fetchWaChannel();
  }, [isPro]);

  const fetchWaChannel = async () => {
    if (!isPro) return;
    try {
      const res = await window.wp?.apiFetch?.({ path: '/qoracrm/v1/chats/channels/whatsapp' });
      if (res?.success && res.channel) {
        setWaChannel(res.channel);
        if (res.channel.is_connected && res.channel.phone_number) {
          setIntegrations({
            ...integrations,
            whatsapp: {
              ...(integrations.whatsapp || {}),
              connected: true,
              phone: res.channel.phone_number,
            },
          });
        }
      }
    } catch {
      // Non-fatal
    }
  };

  const isWaConnected = Boolean(waChannel?.is_connected || integrations?.whatsapp?.connected);
  const waPhone = String(waChannel?.phone_number || integrations?.whatsapp?.phone || '').trim();

  const handleTestWhatsApp = async () => {
    setIsTestingWa(true);
    setWaTestStatus(null);
    try {
      const recipient = integrations.whatsappRecipientType === 'custom'
        ? (integrations.whatsappCustomRecipient || '')
        : (waPhone || '');

      const res = await window.wp?.apiFetch?.({
        path: '/qoracrm/v1/chats/channels/whatsapp/test',
        method: 'POST',
        data: {
          recipient,
          message: '🟢 *QoraCRM WhatsApp Lead Notification Test*\n\n' +
            'New Lead #999 from Form "Website Contact"\n' +
            '• Name: John Doe\n' +
            '• Phone: +1 555 123 4567\n' +
            '• Email: client@example.com\n' +
            '• Status: New Lead\n\n' +
            '_System is connected and working properly!_',
        },
      });

      if (res?.success) {
        setWaTestStatus({ success: true, msg: t('wa_test_sent') || 'Test notification delivered successfully!' });
      } else {
        setWaTestStatus({ success: false, msg: res?.message || 'Failed to send test message.' });
      }
    } catch (err) {
      setWaTestStatus({ success: false, msg: err?.message || 'Failed to send test message.' });
    } finally {
      setIsTestingWa(false);
    }
  };

  const handleDisconnectWa = async () => {
    if (!window.confirm(t('confirm_disconnect_whatsapp') || 'Are you sure you want to disconnect WhatsApp?')) return;
    try {
      await window.wp?.apiFetch?.({
        path: '/qoracrm/v1/chats/channels/whatsapp/disconnect',
        method: 'POST',
      });
      setWaChannel(prev => ({ ...(prev || {}), is_connected: false, phone_number: '' }));
      setIntegrations({
        ...integrations,
        whatsappNotificationsEnabled: false,
        whatsapp: { ...(integrations.whatsapp || {}), connected: false, phone: '' },
      });
    } catch (err) {
      alert(err?.message || 'Failed to disconnect WhatsApp.');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 sm:p-6 md:p-8 border-b border-gray-100 shrink-0">
        <div className="text-lg font-bold text-gray-900 mb-1">{t('tab_integrations')}</div>
        <p className="text-sm text-gray-500 mb-4 sm:mb-6">{t('integrations_desc') || 'Configure where lead data is sent upon form submission.'}</p>

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
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
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
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('webhook_auth_header') || 'Authorization Header (Optional)'}</label>
                <input type="text" value={integrations.webhookAuthHeader || ''}
                  onChange={e => setIntegrations({ ...integrations, webhookAuthHeader: e.target.value })}
                  className="w-full max-w-md border border-gray-300 px-4 py-2 rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[12px] bg-white"
                  placeholder="Bearer your_secret_token" />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  {t('webhook_auth_hint') || 'Passed as Authorization: <value> header in POST requests.'}
                </span>
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

            {/* WhatsApp Notifications (Pro Feature) */}
            <div className="bg-emerald-50/40 p-6 rounded-xl border border-emerald-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shadow-2xs shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.82 2.791.82 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.766-5.768-5.766zm9.965 5.765c0 5.516-4.48 9.997-9.996 9.997-1.745 0-3.376-.453-4.795-1.246l-5.205 1.365 1.39-5.075c-.88-1.464-1.386-3.178-1.386-5.041 0-5.516 4.48-9.997 9.996-9.997 5.516 0 9.996 4.481 9.996 9.997z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm">
                      {t('whatsapp_notifications') || 'WhatsApp Lead Notifications'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('whatsapp_lead_notifications_desc') || 'Instantly receive new website lead notifications in your personal WhatsApp chat or group.'}
                    </div>
                  </div>
                </div>

                {/* Connection Status Badge & Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {isWaConnected ? (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs shrink-0">
                      <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-800 font-mono">
                        +{waPhone.replace('+', '')}
                      </span>
                      <button
                        type="button"
                        onClick={handleDisconnectWa}
                        className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                        title={t('disconnect_account') || 'Disconnect Account'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => (!isPro ? setUpgradeModalOpen(true) : setIsWaModalOpen(true))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <QrCode size={14} />
                      <span>{t('connect_whatsapp') || 'Connect WhatsApp'}</span>
                      {!isPro && <span className="text-[10px]">🔒</span>}
                    </button>
                  )}
                </div>
              </div>

              {isWaConnected ? (
                <div className="space-y-4 max-w-lg pt-2">
                  {/* Enable Notifications Toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(integrations.whatsappNotificationsEnabled)}
                      onChange={e => setIntegrations({ ...integrations, whatsappNotificationsEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <span className="text-xs font-bold text-gray-800">
                      {t('enable_whatsapp_lead_notifications') || 'Send instant notification when a new lead arrives'}
                    </span>
                  </label>

                  {integrations.whatsappNotificationsEnabled && (
                    <div className="space-y-3 pl-6 border-l-2 border-emerald-200">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          {t('notification_recipient') || 'Notification Recipient'}
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="waRecipientType"
                              value="self"
                              checked={(integrations.whatsappRecipientType || 'self') === 'self'}
                              onChange={() => setIntegrations({ ...integrations, whatsappRecipientType: 'self' })}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>
                              {t('wa_recipient_self') || 'To myself (Saved Messages / You):'} <strong className="font-mono text-emerald-800">+{waPhone.replace('+', '')}</strong>
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="waRecipientType"
                              value="custom"
                              checked={integrations.whatsappRecipientType === 'custom'}
                              onChange={() => setIntegrations({ ...integrations, whatsappRecipientType: 'custom' })}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{t('wa_recipient_custom') || 'To custom phone number or group chat ID'}</span>
                          </label>
                        </div>
                      </div>

                      {integrations.whatsappRecipientType === 'custom' && (
                        <div>
                          <input
                            type="text"
                            value={integrations.whatsappCustomRecipient || ''}
                            onChange={e => setIntegrations({ ...integrations, whatsappCustomRecipient: e.target.value })}
                            className="w-full border border-gray-300 px-3.5 py-2 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono bg-white"
                            placeholder="+1234567890 or 12036304xxx@g.us"
                          />
                          <span className="text-[11px] text-gray-500 mt-1 block">
                            {t('wa_custom_recipient_hint') || 'International phone format (+380...) or WhatsApp Group JID.'}
                          </span>
                        </div>
                      )}

                      {/* Test Notification Button */}
                      <div className="pt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTestWhatsApp}
                          disabled={isTestingWa}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isTestingWa ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          <span>{t('send_test_notification') || 'Send Test Notification'}</span>
                        </button>

                        {waTestStatus && (
                          <span className={`text-[11px] font-semibold flex items-center gap-1 ${waTestStatus.success ? 'text-emerald-700' : 'text-red-600'}`}>
                            {waTestStatus.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                            {waTestStatus.msg}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-emerald-100 text-xs text-gray-600">
                  <Smartphone size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    {t('wa_connect_to_enable_notifications') || 'Connect your WhatsApp account via QR code to enable real-time notifications to your personal phone or sales team group.'}
                  </span>
                </div>
              )}

              {/* Privacy Disclaimer */}
              <div className="flex items-start gap-2 pt-2 border-t border-emerald-100/80 text-[11px] text-emerald-950/80 leading-relaxed">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold text-emerald-900">{t('wa_privacy_title') || 'Privacy & Data Ownership'}: </strong>
                  {t('wa_privacy_notice_short') || 'Zero cloud storage: your chat history and contacts are never stored on external servers and remain 100% in your self-hosted WordPress database.'}
                </span>
              </div>
            </div>

            {/* Modal for connecting QR code (Loaded from Pro extension if available) */}
            {isPro && isWaModalOpen && (() => {
              const WhatsAppModal = window.QoraCRM?.getExtension?.('WhatsAppConnectModal');
              return WhatsAppModal ? (
                <WhatsAppModal
                  isOpen={isWaModalOpen}
                  onClose={() => setIsWaModalOpen(false)}
                  onSuccess={(info) => {
                    setWaChannel(prev => ({
                      ...(prev || {}),
                      is_connected: true,
                      phone_number: info.phoneNumber,
                      profile_name: info.profileName,
                    }));
                  }}
                />
              ) : null;
            })()}
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
                  className="shrink-0 text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
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

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={t('whatsapp_notifications') || 'WhatsApp Lead Notifications'}
      />
    </div>
  );
}
