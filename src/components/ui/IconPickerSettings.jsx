import { useI18n } from '../../utils/I18nContext';
import { showGlobalToast } from '../../utils/helpers';
import { Image as ImageIcon, Trash2, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, Check, Send, Save, Phone, Mail, MessageCircle, MapPin, X } from 'lucide-react';

/**
 * A reusable component to configure icon settings for a button.
 * Settings shape: { show: boolean, type: 'predefined'|'media', icon: string, position: 'left'|'right', gap: number }
 */

export const WhatsAppIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

export const TelegramIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM5.27 11.53c4.276-1.863 7.126-3.092 8.55-3.687 4.072-1.696 4.919-1.99 5.47-2.001.12 0 .39.027.564.168.146.118.188.277.207.391.02.115.042.366.023.564-.216 2.274-1.155 7.803-1.636 10.336-.203 1.071-.595 1.428-.973 1.464-.817.078-1.437-.535-2.235-1.059-1.25-.818-1.956-1.332-3.176-2.136-1.41-1.027-.496-1.591.296-2.414.208-.216 3.82-3.5 3.89-3.797.009-.043.016-.201-.08-.283-.095-.083-.231-.055-.331-.033-.142.032-2.399 1.523-6.764 4.475-.64.441-1.22.659-1.741.647-.573-.013-1.674-.323-2.493-.591-.95-.311-1.704-.476-1.64-.997.034-.27.4-.543 1.09-.82z"/>
  </svg>
);

export const XTwitterIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const TikTokIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.32 6.32 6.32 0 0 0 6.25-6.32V10.23a8.38 8.38 0 0 0 3.2 1.34V8.13a4.93 4.93 0 0 1-1.13-.1z"/>
  </svg>
);

export const FacebookIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

export const InstagramIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export const PREDEFINED_ICONS = [
  { id: 'phone', icon: Phone, label: 'phone' },
  { id: 'mail', icon: Mail, label: 'mail' },
  { id: 'message-circle', icon: MessageCircle, label: 'chat' },
  { id: 'map-pin', icon: MapPin, label: 'location' },
  { id: 'whatsapp', icon: WhatsAppIcon, label: 'whatsapp' },
  { id: 'telegram', icon: TelegramIcon, label: 'telegram' },
  { id: 'x-twitter', icon: XTwitterIcon, label: 'x_twitter' },
  { id: 'facebook', icon: FacebookIcon, label: 'facebook' },
  { id: 'instagram', icon: InstagramIcon, label: 'instagram' },
  { id: 'tiktok', icon: TikTokIcon, label: 'tiktok' },
];

export const FORM_ICONS = [
  { id: 'arrow-right', icon: ArrowRight, label: 'arrow_right' },
  { id: 'arrow-left', icon: ArrowLeft, label: 'arrow_left' },
  { id: 'chevron-right', icon: ChevronRight, label: 'chevron_right' },
  { id: 'chevron-left', icon: ChevronLeft, label: 'chevron_left' },
  { id: 'check', icon: Check, label: 'check' },
  { id: 'send', icon: Send, label: 'send' },
  { id: 'save', icon: Save, label: 'save' },
];

export const RenderPresetIcon = ({ iconId, size = 16 }) => {
  const iconObj = PREDEFINED_ICONS.find(i => i.id === iconId) || FORM_ICONS.find(i => i.id === iconId);
  if (iconObj) {
    const IconComponent = iconObj.icon;
    return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IconComponent size={size} style={{ width: size, height: size }} /></span>;
  }
  return null;
};

export function IconPickerSettings({ settings = {}, onChange, labelPrefix = '', hidePositionAndGap = false, hideShowToggle = false, iconSet = 'social' }) {
  const { t } = useI18n();
  const safeSettings = {
    show: false,
    type: 'predefined',
    icon: iconSet === 'form' ? 'arrow-right' : 'whatsapp',
    position: 'right',
    gap: 8,
    size: 16,
    ...settings
  };

  const iconsList = iconSet === 'form' ? FORM_ICONS : PREDEFINED_ICONS;

  const update = (key, value) => {
    onChange({ ...safeSettings, [key]: value });
  };

  const openMediaLibrary = () => {
    if (!window.wp || !window.wp.media) {
      showGlobalToast(t('media_library_not_available') || 'Media library not available.', 'error');
      return;
    }
    
    const mediaFrame = window.wp.media({
      title: t('select_icon') || 'Select Icon',
      button: { text: t('use_this_icon') || 'Use this icon' },
      multiple: false,
      library: { type: 'image' }
    });

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON();
      update('type', 'media');
      update('icon', attachment.url);
    });

    mediaFrame.open();
  };



  return (
    <div className={`space-y-3 mt-4 pt-3 ${!hideShowToggle ? 'border-t border-gray-100' : ''}`}>
      {!hideShowToggle && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={safeSettings.show}
            onChange={(e) => update('show', e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="text-xs font-semibold text-gray-700">{labelPrefix ? (t(labelPrefix) || labelPrefix) + ' ' : ''}{t('show_icon') || 'Show Icon'}</span>
        </label>
      )}

      {(safeSettings.show || hideShowToggle) && (
        <div className={`${!hideShowToggle ? 'pl-6' : ''} space-y-3 animate-in fade-in slide-in-from-top-1`}>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('icon_type') || 'Icon Type'}</label>
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                className={`flex-1 text-[11px] font-medium py-1 rounded transition-colors ${safeSettings.type === 'predefined' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => update('type', 'predefined')}
              >
                {t('preset') || 'Preset'}
              </button>
              <button
                className={`flex-1 text-[11px] font-medium py-1 rounded transition-colors ${safeSettings.type === 'media' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => update('type', 'media')}
              >
                {t('custom_media') || 'Custom (Media)'}
              </button>
            </div>
          </div>

          {safeSettings.type === 'predefined' ? (
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('select_preset') || 'Select Preset'}</label>
              <div className="grid grid-cols-6 gap-2">
                {iconsList.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = safeSettings.icon === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => update('icon', item.id)}
                      className={`flex justify-center items-center p-2 rounded-md border transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      title={t(item.label) || item.id}
                    >
                      <IconComp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('custom_icon_url') || 'Custom Icon URL'}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={safeSettings.icon}
                  onChange={(e) => update('icon', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border border-gray-300 p-2 rounded-md text-xs outline-none focus:border-primary"
                />
                <button 
                  onClick={openMediaLibrary}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
                  title={t('open_media_library') || 'Open Media Library'}
                >
                  <ImageIcon size={16} />
                </button>
              </div>
              {safeSettings.icon && safeSettings.icon.startsWith('http') && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                  <span>{t('preview') || 'Preview'}:</span>
                  <img src={safeSettings.icon} alt="Icon Preview" className="w-5 h-5 object-contain" />
                </div>
              )}
            </div>
          )}

          {!hidePositionAndGap && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('icon_position') || 'Position'}</label>
                <select
                  value={safeSettings.position}
                  onChange={(e) => update('position', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-md text-xs outline-none focus:border-primary bg-white"
                >
                  <option value="left">{t('left') || 'Left'}</option>
                  <option value="right">{t('right') || 'Right'}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('icon_gap') || 'Gap (px)'}</label>
                <input 
                  type="number" 
                  min="0" 
                  max="50" 
                  value={safeSettings.gap} 
                  onChange={(e) => update('gap', parseInt(e.target.value, 10))} 
                  className="w-full border border-gray-300 p-1.5 rounded-md text-xs outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('icon_size') || 'Size (px)'}</label>
                <input 
                  type="number" 
                  min="8" 
                  max="64" 
                  value={safeSettings.size || 16} 
                  onChange={(e) => update('size', parseInt(e.target.value, 10) || 16)} 
                  className="w-full border border-gray-300 p-1.5 rounded-md text-xs outline-none focus:border-primary" 
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
