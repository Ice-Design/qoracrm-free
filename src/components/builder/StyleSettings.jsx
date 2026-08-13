import { useEffect, useRef } from 'react';
import { useFormStore } from '../../store/useFormStore';
import { useI18n } from '../../utils/I18nContext';
import { Accordion } from '../ui/Accordion';
import { ColorPickerInput } from '../ui/ColorPickerInput';

export function StyleSettings({ formId: propFormId }) {
  const { t } = useI18n();
  const { formSettings, updateFormSettings } = useFormStore();

  const getFormId = () => {
    if (propFormId) return propFormId;
    const hash = window.location.hash || '';
    const match = hash.match(/\/forms\/(?:edit|builder|settings)\/(\d+)/) || hash.match(/form_id=(\d+)/);
    if (match && match[1]) return match[1];

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || urlParams.get('form_id') || '[ID]';
  };

  const currentFormId = getFormId();
  const selector = `#qoracrm-form-wrapper-${currentFormId}`;

  return (
    <div className="flex flex-col pb-10 gap-3">
      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{t('style_settings') || 'Style Settings'}</h4>

      {/* 1. Layout & Spacing */}
      <Accordion title={t('layout_and_spacing') || 'Layout & Spacing'} defaultOpen={true}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.showInputIcons !== false}
                onChange={(e) => updateFormSettings({ showInputIcons: e.target.checked })}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm font-semibold text-gray-700">{t('show_icons_in_inputs') || 'Show Icons in Inputs'}</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('form_max_width') || 'Form Max Width'}</label>
            <input
              type="text"
              value={formSettings.maxWidth || '600px'}
              onChange={(e) => updateFormSettings({ maxWidth: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
              placeholder="100%, 800px"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('border_radius') || 'Border Radius'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.borderRadius || 8}px</span>
            </div>
            <input type="range" min="0" max="50" value={formSettings.borderRadius || 8} onChange={(e) => updateFormSettings({ borderRadius: e.target.value })} className="w-full accent-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('padding_vertical') || 'Padding Vertical (Inside)'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.paddingY || 12}px</span>
            </div>
            <input type="range" min="0" max="40" value={formSettings.paddingY || 12} onChange={(e) => updateFormSettings({ paddingY: e.target.value })} className="w-full accent-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('padding_horizontal') || 'Padding Horizontal (Inside)'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.paddingX || 16}px</span>
            </div>
            <input type="range" min="0" max="40" value={formSettings.paddingX || 16} onChange={(e) => updateFormSettings({ paddingX: e.target.value })} className="w-full accent-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('gap_between_fields') || 'Gap Between Fields'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.fieldGap || 15}px</span>
            </div>
            <input type="range" min="0" max="50" value={formSettings.fieldGap || 15} onChange={(e) => updateFormSettings({ fieldGap: e.target.value })} className="w-full accent-primary" />
          </div>
        </div>
      </Accordion>

      {/* 2. Typography */}
      <Accordion title={t('typography') || 'Typography & Text Sizes'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('font_family') || 'Font Family'}</label>
            <select
              value={formSettings.fontFamily || ''}
              onChange={(e) => updateFormSettings({ fontFamily: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="">{t('theme_default') || 'Theme Default'}</option>
              <optgroup label="System Fonts">
                <option value="Arial">Arial</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Verdana">Verdana</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Georgia">Georgia</option>
              </optgroup>
              <optgroup label="Google Fonts">
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Lato">Lato</option>
                <option value="Poppins">Poppins</option>
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('title_size') || 'Form Title Size'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.titleSize || 24}px</span>
            </div>
            <input type="range" min="14" max="48" value={formSettings.titleSize || 24} onChange={(e) => updateFormSettings({ titleSize: e.target.value })} className="w-full accent-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('subtitle_size') || 'Form Subtitle Size'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.subtitleSize || 14}px</span>
            </div>
            <input type="range" min="10" max="32" value={formSettings.subtitleSize || 14} onChange={(e) => updateFormSettings({ subtitleSize: e.target.value })} className="w-full accent-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('text_size') || 'Text Size'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.textSize || 15}px</span>
            </div>
            <input type="range" min="12" max="30" value={formSettings.textSize || 15} onChange={(e) => updateFormSettings({ textSize: e.target.value })} className="w-full accent-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-gray-500">{t('label_size') || 'Label Size'}</label>
              <span className="text-xs text-gray-400 font-mono">{formSettings.labelSize || 14}px</span>
            </div>
            <input type="range" min="10" max="24" value={formSettings.labelSize || 14} onChange={(e) => updateFormSettings({ labelSize: e.target.value })} className="w-full accent-primary" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('label_alignment') || 'Label Alignment'}</label>
            <select
              value={formSettings.labelAlignment || 'left'}
              onChange={(e) => updateFormSettings({ labelAlignment: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="left">{t('left') || 'Left'}</option>
              <option value="center">{t('center') || 'Center'}</option>
              <option value="right">{t('right') || 'Right'}</option>
            </select>
          </div>
        </div>
      </Accordion>

      {/* 3. Colors & Theme */}
      <Accordion title={t('colors_and_theme') || 'Colors & Theme'}>
        <div className="grid grid-cols-2 gap-4 my-1">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('title_color') || 'Title Color'}</label>
            <ColorPickerInput
              color={formSettings.titleColor || '#1a202c'}
              onChange={(val) => updateFormSettings({ titleColor: val })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('subtitle_color') || 'Subtitle Color'}</label>
            <ColorPickerInput
              color={formSettings.subtitleColor || '#4a5568'}
              onChange={(val) => updateFormSettings({ subtitleColor: val })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('accent_color') || 'Accent Color'}</label>
            <ColorPickerInput
              color={formSettings.accentColor || '#d4af37'}
              onChange={(val) => updateFormSettings({ accentColor: val })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('text_color') || 'Text Color'}</label>
            <ColorPickerInput
              color={formSettings.textColor || '#333333'}
              onChange={(val) => updateFormSettings({ textColor: val })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('label_color') || 'Label Color'}</label>
            <ColorPickerInput
              color={formSettings.labelColor || '#4a5568'}
              onChange={(val) => updateFormSettings({ labelColor: val })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{t('input_text_color') || 'Input Text Color'}</label>
            <ColorPickerInput
              color={formSettings.inputTextColor || '#1a202c'}
              onChange={(val) => updateFormSettings({ inputTextColor: val })}
            />
          </div>
        </div>
      </Accordion>

      {/* 4. Custom CSS */}
      <Accordion title={t('custom_css') || 'Custom CSS'}>
        <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
          {t('write_custom_css') || 'Write custom CSS to override specific styles. To target only this form, prefix rules with'} <code className="bg-gray-100 text-gray-800 px-1 font-mono rounded">{selector}</code>.
        </p>
        <CssCodeEditor
          value={formSettings.customCss || ''}
          onChange={(val) => updateFormSettings({ customCss: val })}
          placeholder={`/* ${t('example') || 'Example'}: */\n${selector} .qoracrm-field-label {\n  text-decoration: underline;\n}`}
          rows={6}
        />
      </Accordion>
    </div>
  );
}

/**
 * CodeMirror CSS Editor wrapper using WordPress native wp.codeEditor API.
 */
function CssCodeEditor({ value, onChange, placeholder, rows = 6 }) {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    let cmInstance = null;
    if (textareaRef.current && window.wp && window.wp.codeEditor) {
      try {
        const settings = (window.qoracrmCodeEditorSettings && window.qoracrmCodeEditorSettings.css)
          ? window.qoracrmCodeEditorSettings.css
          : {
            codeEditor: {
              codemirror: {
                mode: 'css',
                lineNumbers: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                indentUnit: 2,
                tabSize: 2,
              }
            }
          };
        const editorObj = window.wp.codeEditor.initialize(textareaRef.current, settings);
        if (editorObj && editorObj.codemirror) {
          cmInstance = editorObj.codemirror;
          editorRef.current = cmInstance;
          cmInstance.on('change', (cm) => {
            onChange(cm.getValue());
          });
        }
      } catch (e) {
        console.warn('CodeEditor CSS initialization skipped or failed:', e);
      }
    }
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 p-3 rounded-md text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-slate-900 text-slate-100"
      rows={rows}
      placeholder={placeholder}
      spellCheck="false"
    />
  );
}
