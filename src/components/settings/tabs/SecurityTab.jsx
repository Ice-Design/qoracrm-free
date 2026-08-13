import { AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';

export function SecurityTab() {
  const { t } = useI18n();
  const {
    securityCaptchas, setSecurityCaptchas,
    generalHoneypot, generalTokenSpam, setGeneral
  } = useSettingsStore();

  const handleCaptchaToggle = (type, isEnabled) => {
    setSecurityCaptchas({
      ...securityCaptchas,
      recaptcha: { ...securityCaptchas.recaptcha, enabled: type === 'recaptcha' ? isEnabled : (isEnabled ? false : securityCaptchas.recaptcha.enabled) },
      turnstile: { ...securityCaptchas.turnstile, enabled: type === 'turnstile' ? isEnabled : (isEnabled ? false : securityCaptchas.turnstile.enabled) },
      hcaptcha: { ...securityCaptchas.hcaptcha, enabled: type === 'hcaptcha' ? isEnabled : (isEnabled ? false : securityCaptchas.hcaptcha.enabled) }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-gray-100 shrink-0">
        <div className="text-lg font-bold text-gray-900 mb-1">{t('tab_security') || 'Security Settings'}</div>
        <p className="text-sm text-gray-500">{t('security_desc') || 'Configure third-party CAPTCHA integrations to protect your forms from spam.'}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        <div className="grid grid-cols-1 gap-8 mb-8">
          <div className="space-y-8">
            {/* Honeypot */}
            <div className="flex items-start justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5" title={t('honeypot_desc') || "Protects forms from spam bots by adding a hidden field that bots will fill but humans won't."}>
                  {t('enable_honeypot') || 'Enable Honeypot Security'} <AlertCircle size={14} className="text-blue-500" />
                </label>
                <p className="text-xs text-gray-500">{t('recommended_enabled') || 'Recommended Settings: Enabled'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={generalHoneypot} onChange={(e) => setGeneral({ generalHoneypot: e.target.checked })} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Token Spam */}
            <div className="flex items-start justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5" title={t('token_spam_desc') || "Adds a dynamic security token to forms to prevent automated submissions."}>
                  {t('token_spam') || 'Token Based Spam Protection'} <AlertCircle size={14} className="text-blue-500" />
                </label>
                <p className="text-xs text-gray-500">{t('recommended_enabled') || 'Recommended Settings: Enabled'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={generalTokenSpam} onChange={(e) => setGeneral({ generalTokenSpam: e.target.checked })} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* reCAPTCHA */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              Google reCAPTCHA
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={securityCaptchas.recaptcha?.enabled}
                onChange={e => handleCaptchaToggle('recaptcha', e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {securityCaptchas.recaptcha?.enabled && (
            <div className="space-y-4 max-w-lg pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {t('recaptcha_help') || 'Get Site Key and Secret Key from the'}{' '}
                <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline inline-flex items-center gap-0.5">
                  Google reCAPTCHA Admin Console &rarr;
                </a>
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t('recaptcha_version') || 'reCAPTCHA Version'}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="recaptcha_v" value="v2" checked={securityCaptchas.recaptcha.version === 'v2'}
                      onChange={e => setSecurityCaptchas({ ...securityCaptchas, recaptcha: { ...securityCaptchas.recaptcha, version: e.target.value } })} className="accent-primary" />
                    {t('version_2_visible') || 'Version 2 (Visible / Checkbox)'}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="recaptcha_v" value="v3" checked={securityCaptchas.recaptcha.version === 'v3'}
                      onChange={e => setSecurityCaptchas({ ...securityCaptchas, recaptcha: { ...securityCaptchas.recaptcha, version: e.target.value } })} className="accent-primary" />
                    {t('version_3_invisible') || 'Version 3 (Invisible)'}
                  </label>
                </div>
              </div>

              {securityCaptchas.recaptcha.version === 'v2' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('captcha_theme') || 'Theme'}</label>
                    <select
                      value={securityCaptchas.recaptcha.theme || 'light'}
                      onChange={e => setSecurityCaptchas({ ...securityCaptchas, recaptcha: { ...securityCaptchas.recaptcha, theme: e.target.value } })}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white outline-none focus:border-primary"
                    >
                      <option value="light">{t('captcha_theme_light') || 'Light'}</option>
                      <option value="dark">{t('captcha_theme_dark') || 'Dark'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('captcha_size') || 'Size / Mode'}</label>
                    <select
                      value={securityCaptchas.recaptcha.size || 'normal'}
                      onChange={e => setSecurityCaptchas({ ...securityCaptchas, recaptcha: { ...securityCaptchas.recaptcha, size: e.target.value } })}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white outline-none focus:border-primary"
                    >
                      <option value="normal">{t('captcha_size_normal') || 'Normal'}</option>
                      <option value="compact">{t('captcha_size_compact') || 'Compact'}</option>
                      <option value="invisible">{t('captcha_size_invisible') || 'Invisible (Hidden)'}</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('site_key') || 'Site Key'}</label>
                <input type="text" value={securityCaptchas.recaptcha.siteKey || ''}
                  onChange={e => setSecurityCaptchas({ ...securityCaptchas, recaptcha: { ...securityCaptchas.recaptcha, siteKey: e.target.value } })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('secret_key') || 'Secret Key'}</label>
                <input type="password" value={securityCaptchas.recaptcha.secretKey || ''}
                  onChange={e => setSecurityCaptchas({ ...securityCaptchas, recaptcha: { ...securityCaptchas.recaptcha, secretKey: e.target.value } })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
              </div>
            </div>
          )}
        </div>

        {/* Cloudflare Turnstile */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              Cloudflare Turnstile
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={securityCaptchas.turnstile?.enabled}
                onChange={e => handleCaptchaToggle('turnstile', e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {securityCaptchas.turnstile?.enabled && (
            <div className="space-y-4 max-w-lg pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {t('turnstile_help') || 'Get Site Key and Secret Key from your'}{' '}
                <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline inline-flex items-center gap-0.5">
                  Cloudflare Dashboard &rarr;
                </a>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('captcha_theme') || 'Theme'}</label>
                  <select
                    value={securityCaptchas.turnstile.theme || 'auto'}
                    onChange={e => setSecurityCaptchas({ ...securityCaptchas, turnstile: { ...securityCaptchas.turnstile, theme: e.target.value } })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white outline-none focus:border-primary"
                  >
                    <option value="auto">{t('captcha_theme_auto') || 'Auto'}</option>
                    <option value="light">{t('captcha_theme_light') || 'Light'}</option>
                    <option value="dark">{t('captcha_theme_dark') || 'Dark'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('captcha_size') || 'Size'}</label>
                  <select
                    value={securityCaptchas.turnstile.size || 'normal'}
                    onChange={e => setSecurityCaptchas({ ...securityCaptchas, turnstile: { ...securityCaptchas.turnstile, size: e.target.value } })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white outline-none focus:border-primary"
                  >
                    <option value="normal">{t('captcha_size_normal') || 'Normal'}</option>
                    <option value="compact">{t('captcha_size_compact') || 'Compact'}</option>
                    <option value="flexible">{t('captcha_size_flexible') || 'Flexible'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    {t('captcha_appearance') || 'Appearance'}
                    <span className="relative group cursor-pointer inline-flex items-center">
                      <span className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-[10px] font-bold flex items-center justify-center transition-colors">
                        ?
                      </span>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-gray-900 text-white text-[11px] font-normal rounded-lg shadow-lg z-50 text-center leading-tight">
                        {t('turnstile_appearance_help') || 'Invisible mode requires an Invisible widget key created in your Cloudflare Dashboard.'}
                      </span>
                    </span>
                  </label>
                  <select
                    value={securityCaptchas.turnstile.appearance || 'always'}
                    onChange={e => setSecurityCaptchas({ ...securityCaptchas, turnstile: { ...securityCaptchas.turnstile, appearance: e.target.value } })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white outline-none focus:border-primary"
                  >
                    <option value="always">{t('captcha_mode_always') || 'Always Visible'}</option>
                    <option value="execute">{t('captcha_mode_execute') || 'Invisible (Hidden)'}</option>
                    <option value="interaction-only">{t('captcha_mode_interaction') || 'Interaction Only'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('site_key') || 'Site Key'}</label>
                <input type="text" value={securityCaptchas.turnstile.siteKey || ''}
                  onChange={e => setSecurityCaptchas({ ...securityCaptchas, turnstile: { ...securityCaptchas.turnstile, siteKey: e.target.value } })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('secret_key') || 'Secret Key'}</label>
                <input type="password" value={securityCaptchas.turnstile.secretKey || ''}
                  onChange={e => setSecurityCaptchas({ ...securityCaptchas, turnstile: { ...securityCaptchas.turnstile, secretKey: e.target.value } })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
              </div>
            </div>
          )}
        </div>

        {/* hCaptcha */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              hCaptcha
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={securityCaptchas.hcaptcha?.enabled}
                onChange={e => handleCaptchaToggle('hcaptcha', e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {securityCaptchas.hcaptcha?.enabled && (
            <div className="space-y-4 max-w-lg pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {t('hcaptcha_help') || 'Get Site Key and Secret Key from your'}{' '}
                <a href="https://dashboard.hcaptcha.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline inline-flex items-center gap-0.5">
                  hCaptcha Dashboard &rarr;
                </a>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('captcha_theme') || 'Theme'}</label>
                  <select
                    value={securityCaptchas.hcaptcha.theme || 'light'}
                    onChange={e => setSecurityCaptchas({ ...securityCaptchas, hcaptcha: { ...securityCaptchas.hcaptcha, theme: e.target.value } })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white outline-none focus:border-primary"
                  >
                    <option value="light">{t('captcha_theme_light') || 'Light'}</option>
                    <option value="dark">{t('captcha_theme_dark') || 'Dark'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('captcha_size') || 'Size / Mode'}</label>
                  <select
                    value={securityCaptchas.hcaptcha.size || 'normal'}
                    onChange={e => setSecurityCaptchas({ ...securityCaptchas, hcaptcha: { ...securityCaptchas.hcaptcha, size: e.target.value } })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white outline-none focus:border-primary"
                  >
                    <option value="normal">{t('captcha_size_normal') || 'Normal'}</option>
                    <option value="compact">{t('captcha_size_compact') || 'Compact'}</option>
                    <option value="invisible">{t('captcha_size_invisible') || 'Invisible (Hidden)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('site_key') || 'Site Key'}</label>
                <input type="text" value={securityCaptchas.hcaptcha.siteKey || ''}
                  onChange={e => setSecurityCaptchas({ ...securityCaptchas, hcaptcha: { ...securityCaptchas.hcaptcha, siteKey: e.target.value } })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('secret_key') || 'Secret Key'}</label>
                <input type="password" value={securityCaptchas.hcaptcha.secretKey || ''}
                  onChange={e => setSecurityCaptchas({ ...securityCaptchas, hcaptcha: { ...securityCaptchas.hcaptcha, secretKey: e.target.value } })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
