import { useState, useMemo } from 'react';
import { useFormStore } from '../../store/useFormStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useI18n } from '../../utils/I18nContext';
import { Accordion } from '../ui/Accordion';
import { ColorPickerInput } from '../ui/ColorPickerInput';
import { IconPickerSettings } from '../ui/IconPickerSettings';
import { UpgradeModal, ProLockIcon } from '../common/ProBadge';
import ExtensionSlot from '../common/ExtensionSlot';

/**
 * Global form settings panel (style, submit button, custom CSS, etc.)
 */
export function GlobalSettings({ quizMode, setSidebarTab }) {
  const { t } = useI18n();
  const { fields, formSettings, updateFormSettings } = useFormStore();
  const securityCaptchas = useSettingsStore((state) => state.securityCaptchas) || {};
  const emailTemplates = useSettingsStore((state) => state.email_templates) || [];
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const emailFields = useMemo(() => {
    const list = [];
    const collect = (items) => {
      if (!Array.isArray(items)) return;
      items.forEach(item => {
        if (item.type === 'email') {
          list.push(item);
        }
        if (item.fields) {
          collect(item.fields);
        }
      });
    };
    collect(fields);
    return list;
  }, [fields]);


  return (
    <div className="flex flex-col pb-10">
      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-4">{t('global_settings') || 'Global Form Settings'}</h4>

      {quizMode && (
        <div className="mb-4">
          <button
            onClick={() => setSidebarTab('step_settings')}
            className="w-full py-2 px-3 bg-primary/10 text-primary font-semibold text-sm rounded-lg hover:bg-primary/20 transition-colors"
          >
            {t('configure_quiz_steps') || 'Configure Quiz Steps'} →
          </button>
        </div>
      )}

      <Accordion title={t('general_settings') || 'General Settings'} defaultOpen={true}>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('form_title') || 'Form Title'}</label>
          <input
            type="text"
            value={formSettings.title || ''}
            onChange={(e) => updateFormSettings({ title: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder={t('eg_contact_us') || "Contact Us"}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('form_subtitle') || 'Form Subtitle'}</label>
          <textarea
            value={formSettings.subtitle || ''}
            onChange={(e) => updateFormSettings({ subtitle: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder={t('eg_please_fill_out') || "Please fill out the form below."}
            rows="2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('global_error_message') || 'Global Error Message'}</label>
          <input
            type="text"
            value={formSettings.globalErrorMessage || ''}
            onChange={(e) => updateFormSettings({ globalErrorMessage: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder={t('eg_this_field_is_required') || "This field is required."}
          />
          <p className="text-[10px] text-gray-400 mt-1">{t('default_message_required') || 'Default message for required fields.'}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('success_message') || 'Success Message'}</label>
          <textarea
            value={formSettings.successMessage || (t('thank_you_message') || 'Thank you! Your message has been sent.')}
            onChange={(e) => updateFormSettings({ successMessage: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            rows={3}
          />
        </div>
        <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!formSettings.successAutoClose}
              onChange={(e) => updateFormSettings({ successAutoClose: e.target.checked })}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm font-semibold text-gray-700">{t('auto_close_success') || 'Auto-close Success Popup'}</span>
          </label>
          {formSettings.successAutoClose && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('close_delay_sec') || 'Close Delay (Seconds)'}</label>
                <input
                  type="number"
                  min="1" max="60"
                  value={formSettings.successAutoCloseTime || 5}
                  onChange={(e) => updateFormSettings({ successAutoCloseTime: parseInt(e.target.value, 10) || 5 })}
                  className="w-full border border-gray-300 p-1.5 rounded-md text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('border_width_px') || 'Animated Border (px)'}</label>
                <input
                  type="number"
                  min="1" max="20"
                  value={formSettings.successBorderWidth || 4}
                  onChange={(e) => updateFormSettings({ successBorderWidth: parseInt(e.target.value, 10) || 4 })}
                  className="w-full border border-gray-300 p-1.5 rounded-md text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('border_color') || 'Border Color'}</label>
                <ColorPickerInput color={formSettings.successBorderColor || '#22c55e'} onChange={(val) => updateFormSettings({ successBorderColor: val })} />
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('redirect_url') || 'Redirect URL (Optional)'}</label>
          <input
            type="url"
            value={formSettings.redirectUrl || ''}
            onChange={(e) => updateFormSettings({ redirectUrl: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="https://example.com/thank-you"
          />
        </div>
      </Accordion>

      <Accordion title={t('submit_button_settings') || 'Submit Button Settings'}>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('button_text') || 'Button Text'}</label>
          <input
            type="text"
            value={formSettings.submitText || ''}
            placeholder={t('submit') || 'Submit'}
            onChange={(e) => updateFormSettings({ submitText: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('button_size') || 'Button Size'}</label>
          <select
            value={formSettings.submitSize || 'medium'}
            onChange={(e) => updateFormSettings({ submitSize: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
          >
            <option value="small">{t('small') || 'Small'}</option>
            <option value="medium">{t('medium') || 'Medium'}</option>
            <option value="large">{t('large') || 'Large'}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('button_width') || 'Button Width'}</label>
          <select
            value={formSettings.submitWidth || '100%'}
            onChange={(e) => updateFormSettings({ submitWidth: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
          >
            <option value="100%">100%</option>
            <option value="50%">50%</option>
            <option value="33.333%">33.3%</option>
            <option value="25%">25%</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('button_alignment') || 'Button Alignment'}</label>
          <select
            value={formSettings.submitAlignment || 'center'}
            onChange={(e) => updateFormSettings({ submitAlignment: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            disabled={formSettings.submitWidth === '100%'}
          >
            <option value="left">{t('left') || 'Left'}</option>
            <option value="center">{t('center') || 'Center'}</option>
            <option value="right">{t('right') || 'Right'}</option>
            <option value="full">{t('full_width') || 'Full Width'}</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={!!formSettings.isInlineSubmit}
              onChange={(e) => updateFormSettings({ isInlineSubmit: e.target.checked })}
              className="accent-primary w-4 h-4"
            />
            <span className="text-xs font-semibold text-gray-700">{t('inline_submit_button') || 'Inline with fields (Same row)'}</span>
          </label>
        </div>
        <IconPickerSettings
          settings={formSettings.submitIcon}
          onChange={(val) => updateFormSettings({ submitIcon: val })}
          labelPrefix={t('submit_button') || 'Submit Button'}
          iconSet="form"
        />
      </Accordion>

      <Accordion title={t('client_email_notifications') || 'Client Email Notifications'}>
        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={!!formSettings.sendClientEmail}
              onChange={(e) => updateFormSettings({ sendClientEmail: e.target.checked })}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm font-semibold text-gray-700">{t('send_client_email') || 'Send Email to Client'}</span>
          </label>
        </div>

        {formSettings.sendClientEmail && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('client_email_field') || 'Client Email Field'}</label>
              <select
                value={formSettings.clientEmailField || ''}
                onChange={(e) => updateFormSettings({ clientEmailField: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary bg-white focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('select_email_field') || '-- Select Field --'}</option>
                {emailFields.map(f => (
                  <option key={f.id} value={f.id}>{f.label || f.id}</option>
                ))}
              </select>
              {emailFields.length === 0 && (
                <p className="text-[10px] text-red-500 mt-1">
                  {t('no_email_fields_warning') || 'You need to add an Email field to the form first.'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('select_email_template') || 'Select Template'}</label>
              <select
                value={formSettings.clientEmailTemplateId || ''}
                onChange={(e) => updateFormSettings({ clientEmailTemplateId: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary bg-white focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('select_template') || '-- Select Template --'}</option>
                {emailTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Accordion>

      <ExtensionSlot name="ProGlobalSettings" formSettings={formSettings} updateFormSettings={updateFormSettings} quizMode={quizMode} />

      <Accordion title={t('popup_settings') || 'Popup Settings'}>
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!formSettings.isPopup}
              onChange={(e) => updateFormSettings({ isPopup: e.target.checked })}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm font-semibold text-gray-700">{t('display_as_popup') || 'Display as Popup Button'}</span>
          </label>
          {formSettings.isPopup && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('popup_button_text') || 'Popup Button Text'}</label>
                <input
                  type="text"
                  value={formSettings.popupButtonText || ''}
                  placeholder={t('open_form') || 'Open Form'}
                  onChange={(e) => updateFormSettings({ popupButtonText: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <IconPickerSettings
                  settings={formSettings.popupIcon}
                  onChange={(val) => updateFormSettings({ popupIcon: val })}
                  labelPrefix={t('popup_button') || 'Popup Button'}
                  iconSet="form"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('popup_max_width') || 'Popup Max Width'}</label>
                <input
                  type="text"
                  value={formSettings.popupWidth || '600px'}
                  onChange={(e) => updateFormSettings({ popupWidth: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                  placeholder="600px, 90%"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-gray-500">{t('border_radius') || 'Border Radius'}</label>
                  <span className="text-xs text-gray-400 font-mono">{formSettings.popupBorderRadius !== undefined ? formSettings.popupBorderRadius : 12}px</span>
                </div>
                <input type="range" min="0" max="50" value={formSettings.popupBorderRadius !== undefined ? formSettings.popupBorderRadius : 12} onChange={(e) => updateFormSettings({ popupBorderRadius: parseInt(e.target.value, 10) })} className="w-full accent-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-gray-500">{t('inner_padding') || 'Inner Padding'}</label>
                  <span className="text-xs text-gray-400 font-mono">{formSettings.popupPadding !== undefined ? formSettings.popupPadding : 40}px</span>
                </div>
                <input type="range" min="0" max="100" value={formSettings.popupPadding !== undefined ? formSettings.popupPadding : 40} onChange={(e) => updateFormSettings({ popupPadding: parseInt(e.target.value, 10) })} className="w-full accent-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('border_color') || 'Border Color'}</label>
                  <ColorPickerInput color={formSettings.popupBorderColor || 'transparent'} onChange={(val) => updateFormSettings({ popupBorderColor: val })} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('border_width') || 'Border Width (px)'}</label>
                  <input type="number" min="0" max="20" value={formSettings.popupBorderWidth || 0} onChange={(e) => updateFormSettings({ popupBorderWidth: parseInt(e.target.value, 10) })} className="w-full border border-gray-300 p-1.5 rounded-md text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('overlay_background') || 'Overlay Background'}</label>
                  <ColorPickerInput color={formSettings.popupOverlayBgColor || 'rgba(0,0,0,0.5)'} onChange={(val) => updateFormSettings({ popupOverlayBgColor: val })} />
                  <p className="text-[10px] text-gray-400 mt-1">{t('use_rgba_for_transparency') || 'Use rgba() for transparency, rgba(0,0,0,0.5)'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Accordion>

      {(securityCaptchas?.recaptcha?.enabled || securityCaptchas?.turnstile?.enabled || securityCaptchas?.hcaptcha?.enabled) && (
        <Accordion title={t('captcha_settings') || 'CAPTCHA Settings'}>
          {securityCaptchas?.turnstile?.enabled && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('appearance_mode') || 'Appearance Mode'}</label>
              <select
                value={formSettings.turnstileAppearance || 'always'}
                onChange={(e) => updateFormSettings({ turnstileAppearance: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              >
                <option value="always">{t('managed') || 'Managed (Always)'}</option>
                <option value="interaction-only">{t('non_interactive') || 'Non-interactive'}</option>
                <option value="execute">{t('invisible') || 'Invisible'}</option>
              </select>
            </div>
          )}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('theme') || 'Theme'}</label>
            <select
              value={formSettings.captchaTheme || 'light'}
              onChange={(e) => updateFormSettings({ captchaTheme: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              {securityCaptchas?.turnstile?.enabled && <option value="auto">{t('auto') || 'Auto'}</option>}
              <option value="light">{t('light') || 'Light'}</option>
              <option value="dark">{t('dark') || 'Dark'}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('size') || 'Size'}</label>
            <select
              value={formSettings.captchaSize || 'normal'}
              onChange={(e) => updateFormSettings({ captchaSize: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="normal">{t('normal') || 'Normal'}</option>
              <option value="compact">{t('compact') || 'Compact'}</option>
              {securityCaptchas?.turnstile?.enabled && <option value="flexible">{t('flexible') || 'Flexible'}</option>}
              {securityCaptchas?.recaptcha?.enabled && <option value="invisible">{t('invisible') || 'Invisible'}</option>}
            </select>
          </div>
        </Accordion>
      )}

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={t('save_and_continue') || 'Save and Continue'}
      />
    </div>
  );
}
