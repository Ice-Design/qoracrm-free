import { Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { WpEditor } from '../ui/WpEditor';
import { FieldConditions } from './FieldConditions';
import { useI18n } from '../../utils/I18nContext';
import ExtensionSlot from '../common/ExtensionSlot';

/**
 * Sidebar panel for editing a single field's properties.
 */
export function FieldSettings({ field, onUpdateField, onRemoveField, availableFields }) {
  const { t } = useI18n();
  const [dynamicSources, setDynamicSources] = useState({ post_types: [], taxonomies: [] });

  useEffect(() => {
    const fetchDynamicSources = async () => {
      try {
        if (window.wp && window.wp.apiFetch) {
          const res = await window.wp.apiFetch({ path: '/qoracrm/v1/forms/dynamic-sources' });
          setDynamicSources(res);
        }
      } catch (err) {
        console.error('Failed to fetch dynamic sources', err);
      }
    };
    fetchDynamicSources();
  }, []);

  useEffect(() => {
    if (field?.type === 'quantity' && !field.mappedProduct) {
      const productFields = (availableFields || []).filter(f => f.type === 'product');
      if (productFields.length > 0) {
        onUpdateField(field.id, { mappedProduct: productFields[0].id });
      }
    }
  }, [field?.type, field?.mappedProduct, field?.id, availableFields, onUpdateField]);

  if (!field) {
    return <div className="text-sm text-gray-500">{t('select_field_to_edit') || 'Select a field to edit its settings.'}</div>;
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{t('field_settings') || 'Field Settings'} ({field.type})</h4>
        <button
          onClick={() => onRemoveField(field.id)}
          className="text-red-500 hover:bg-red-50 p-1.5 rounded-md"
          title={t("delete_field") || "Delete Field"}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {field.type !== 'html' && field.type !== 'heading' && field.type !== 'consent' && field.type !== 'captcha' && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('field_label') || 'Field Label'}</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {field.type !== 'hidden' && field.type !== 'html' && field.type !== 'heading' && field.type !== 'total' && field.type !== 'captcha' && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="req"
            checked={field.required}
            onChange={(e) => onUpdateField(field.id, { required: e.target.checked })}
            className="accent-primary w-4 h-4"
          />
          <label htmlFor="req" className="text-sm font-semibold cursor-pointer">{t('required_field') || 'Required Field'}</label>
        </div>
      )}

      {field.type === 'captcha' && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm mb-4 border border-yellow-200">
          {t('captcha_field_settings_info') || 'CAPTCHA configuration is global. You can adjust the CAPTCHA appearance in the "Global Settings" panel under "CAPTCHA Settings".'}
        </div>
      )}

      {field.type === 'heading' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('heading_text') || 'Heading Text (Rich Text)'}</label>
          <WpEditor
            id={`editor-${field.id}`}
            value={field.label}
            onChange={(val) => onUpdateField(field.id, { label: val })}
          />
        </div>
      )}

      {field.type === 'consent' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('consent_text') || 'Consent Text'}</label>
            <textarea
              value={field.label || ''}
              onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder={t('consent_placeholder') || 'I agree to the %1 and %2'}
            />
            <p className="text-[10px] text-gray-400 mt-1">{t('policy_links_help') || 'Use %1 and %2 to insert Policy Links below.'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-3">
            <h5 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('policy_link_1') || 'Policy Link 1'} (%1)</h5>
            <div>
              <input type="text" placeholder={t('link_text_terms') || 'Link Text (Terms)'} value={field.policyText1 || ''} onChange={(e) => onUpdateField(field.id, { policyText1: e.target.value })} className="w-full border border-gray-300 p-2 rounded-md text-sm mb-2 outline-none focus:border-primary" />
              <input type="text" placeholder={t('url_placeholder') || 'URL ( https://...)'} value={field.policyUrl1 || ''} onChange={(e) => onUpdateField(field.id, { policyUrl1: e.target.value })} className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-3">
            <h5 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{t('policy_link_2') || 'Policy Link 2'} (%2)</h5>
            <div>
              <input type="text" placeholder={t('link_text_privacy') || 'Link Text (Privacy)'} value={field.policyText2 || ''} onChange={(e) => onUpdateField(field.id, { policyText2: e.target.value })} className="w-full border border-gray-300 p-2 rounded-md text-sm mb-2 outline-none focus:border-primary" />
              <input type="text" placeholder={t('url_placeholder') || 'URL (https://...)'} value={field.policyUrl2 || ''} onChange={(e) => onUpdateField(field.id, { policyUrl2: e.target.value })} className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>
      )}

      <ExtensionSlot
        name="BuilderProFieldSettings"
        section="repeater"
        field={field}
        onUpdateField={onUpdateField}
        fallback={
          field.type === 'repeater' ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 font-semibold flex items-center justify-between">
              <span>🔒 Repeater settings are a Pro Feature</span>
            </div>
          ) : null
        }
      />

      {field.type === 'html' && (
        <HtmlCodeEditor
          value={field.content || ''}
          onChange={(val) => onUpdateField(field.id, { content: val })}
          t={t}
        />
      )}

      {['text', 'name', 'email', 'phone', 'number', 'url', 'textarea'].includes(field.type) && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('placeholder') || 'Placeholder'}</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdateField(field.id, { placeholder: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {['number', 'date'].includes(field.type) && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{field.type === 'date' ? (t('min_date') || 'Min Date') : (t('min_value') || 'Min Value')}</label>
            <input
              type={field.type === 'date' ? "date" : "number"}
              value={field.min || ''}
              onChange={(e) => onUpdateField(field.id, { min: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{field.type === 'date' ? (t('max_date') || 'Max Date') : (t('max_value') || 'Max Value')}</label>
            <input
              type={field.type === 'date' ? "date" : "number"}
              value={field.max || ''}
              onChange={(e) => onUpdateField(field.id, { max: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {['text', 'name', 'textarea'].includes(field.type) && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('max_length_chars') || 'Max Length (characters)'}</label>
          <input
            type="number"
            value={field.maxLength || ''}
            onChange={(e) => onUpdateField(field.id, { maxLength: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            min="1"
          />
        </div>
      )}

      {field.type === 'textarea' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('rows') || 'Rows'}</label>
            <input
              type="number"
              value={field.rows || 3}
              onChange={(e) => onUpdateField(field.id, { rows: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {field.type === 'phone' && (
        <div className="flex items-center gap-2 mt-2 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
          <input
            type="checkbox"
            id="useMask"
            checked={field.useMask || false}
            onChange={(e) => onUpdateField(field.id, { useMask: e.target.checked })}
            className="accent-primary w-4 h-4"
          />
          <label htmlFor="useMask" className="text-xs font-semibold cursor-pointer text-amber-950">{t('enable_intl_flags') || 'Enable Intl Flags & Mask'}</label>
        </div>
      )}

      {field.type === 'date' && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('date_format') || 'Date Format'}</label>
          <select
            value={field.dateFormat || 'Y-m-d'}
            onChange={(e) => onUpdateField(field.id, { dateFormat: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="Y-m-d">YYYY-MM-DD</option>
            <option value="d.m.Y">DD.MM.YYYY</option>
            <option value="m/d/Y">MM/DD/YYYY</option>
          </select>
        </div>
      )}

      {field.type === 'time' && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('time_format') || 'Time Format'}</label>
          <select
            value={field.timeFormat || '24h'}
            onChange={(e) => onUpdateField(field.id, { timeFormat: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="24h">24-hour (23:59)</option>
            <option value="12h">12-hour AM/PM (11:59 PM)</option>
          </select>
        </div>
      )}

      <ExtensionSlot
        name="BuilderProFieldSettings"
        section="file"
        field={field}
        onUpdateField={onUpdateField}
        fallback={
          ['file', 'image_upload'].includes(field.type) ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 font-semibold flex items-center justify-between">
              <span>🔒 File Upload settings are a Pro Feature</span>
            </div>
          ) : null
        }
      />

      {field.type === 'address' && (
        <div className="space-y-4">
          <div className="pt-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">{t('address_fields') || 'Address Fields'}</label>
            <div className="space-y-3 bg-gray-50 p-3 rounded border border-gray-200">
              {[
                { key: 'street', label: t('street_address') || 'Street Address', default: t('street_address') || 'Street Address' },
                { key: 'line2', label: t('address_line_2') || 'Address Line 2', default: t('address_line_2') || 'Address Line 2' },
                { key: 'city', label: t('city') || 'City', default: t('city') || 'City' },
                { key: 'state', label: t('state_province') || 'State / Province', default: t('state_province_region') || 'State / Province / Region' },
                { key: 'zip', label: t('zip_postal_code') || 'ZIP / Postal Code', default: t('zip_postal_code') || 'ZIP / Postal Code' },
                { key: 'country', label: t('country') || 'Country', default: t('country') || 'Country' }
              ].map(sub => (
                <div key={sub.key} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={field[`show_${sub.key}`] !== false}
                    onChange={(e) => onUpdateField(field.id, { [`show_${sub.key}`]: e.target.checked })}
                    className="accent-primary w-4 h-4 shrink-0"
                  />
                  <span className="text-[10px] font-semibold text-gray-600 w-24 truncate">{sub.label}</span>
                  <input
                    type="text"
                    value={field[`label_${sub.key}`] || sub.default}
                    onChange={(e) => onUpdateField(field.id, { [`label_${sub.key}`]: e.target.value })}
                    className="flex-1 border border-gray-300 p-1.5 rounded text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder={t('custom_sub_label') || 'Custom Sub-Label'}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('default_country') || 'Default Country'}</label>
            <input
              type="text"
              list={`countries-${field.id}`}
              value={field.defaultCountry || ''}
              onChange={(e) => onUpdateField(field.id, { defaultCountry: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              placeholder={t('select_country') || 'Select a country...'}
            />
            <datalist id={`countries-${field.id}`}>
              <option value="United States" />
              <option value="Israel" />
              <option value="United Kingdom" />
              <option value="Canada" />
              <option value="Australia" />
              <option value="Ukraine" />
              <option value="Germany" />
              <option value="France" />
              <option value="Spain" />
              <option value="Italy" />
              <option value="Poland" />
              <option value="Turkey" />
              <option value="Japan" />
              <option value="China" />
              <option value="India" />
              <option value="Brazil" />
              <option value="Mexico" />
              <option value="South Africa" />
              <option value="Egypt" />
              <option value="UAE" />
            </datalist>
            <p className="text-[10px] text-gray-400 mt-1">{t('select_country_help') || 'Select the default country from the popular list.'}</p>
          </div>
        </div>
      )}

      {(['dropdown', 'radio', 'checkbox', 'image_radio', 'image_checkbox'].includes(field.type) || (field.type === 'product' && ['dropdown', 'radio', 'image_radio'].includes(field.productFieldType))) && (
        <div>
          {field.type !== 'product' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('options_type') || 'Options Type'}</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => onUpdateField(field.id, { optionsType: 'manual' })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${field.optionsType !== 'dynamic' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                  {t('manual') || 'Manual'}
                </button>
                <button
                  onClick={() => onUpdateField(field.id, { optionsType: 'dynamic' })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${field.optionsType === 'dynamic' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                  {t('dynamic') || 'Dynamic'}
                </button>
              </div>
            </div>
          )}

          {field.optionsType === 'dynamic' ? (
            <div className="space-y-3 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
              <div>
                <label className="block text-xs font-semibold text-amber-950 mb-1.5">{t('dynamic_source') || 'Dynamic Source'}</label>
                <select
                  value={field.dynamicSource || 'post_type'}
                  onChange={(e) => onUpdateField(field.id, { dynamicSource: e.target.value, dynamicData: '' })}
                  className="w-full border border-amber-300/80 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-800"
                >
                  <option value="post_type">{t('post_type') || 'Post Type'}</option>
                  <option value="taxonomy">{t('taxonomy') || 'Taxonomy'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-950 mb-1.5">{field.dynamicSource === 'taxonomy' ? (t('select_taxonomy') || 'Select Taxonomy') : (t('select_post_type') || 'Select Post Type')}</label>
                <select
                  value={field.dynamicData || ''}
                  onChange={(e) => onUpdateField(field.id, { dynamicData: e.target.value })}
                  className="w-full border border-amber-300/80 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-800"
                >
                  <option value="">-- {t('select') || 'Select'} --</option>
                  {field.dynamicSource === 'taxonomy' ? (
                    (dynamicSources.taxonomies || []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)
                  ) : (
                    (dynamicSources.post_types || []).map(p => <option key={p.value} value={p.value}>{p.label}</option>)
                  )}
                </select>
              </div>
              <p className="text-[10px] text-amber-800 leading-tight">
                {t('dynamic_desc') || 'Options will be dynamically populated on the front-end when the form is rendered.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500">{t('options') || 'Options'}</label>
                {field.type !== 'product' && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.showValues || false}
                      onChange={(e) => onUpdateField(field.id, { showValues: e.target.checked })}
                      className="accent-primary"
                    />
                    <span className="text-[10px] font-semibold text-gray-600">{t('show_values') || 'Show Values'}</span>
                  </label>
                )}
              </div>
              <div className="space-y-2">
                {(field.options || []).map((opt, idx) => {
                  const isMulti = ['checkbox', 'image_checkbox'].includes(field.type);
                  const isDefault = isMulti ? (field.defaultValue || []).includes(opt.value) : field.defaultValue === opt.value;
                  return (
                    <div key={opt.id || idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                      <div
                        onClick={() => {
                          if (isMulti) {
                            const cur = Array.isArray(field.defaultValue)
                              ? [...field.defaultValue]
                              : (field.defaultValue ? [field.defaultValue] : []);
                            if (cur.includes(opt.value)) {
                              onUpdateField(field.id, { defaultValue: cur.filter(v => v !== opt.value) });
                            } else {
                              onUpdateField(field.id, { defaultValue: [...cur, opt.value] });
                            }
                          } else {
                            onUpdateField(field.id, { defaultValue: isDefault ? '' : opt.value });
                          }
                        }}
                        className={`shrink-0 flex items-center justify-center w-6 h-6 rounded border transition-all cursor-pointer ${isDefault ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-transparent hover:border-primary'}`}
                        title={t('set_as_default') || 'Set as default'}
                      >
                        <Check size={14} strokeWidth={3} className={isDefault ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'} />
                      </div>
                      <div className={`flex-1 flex gap-1.5 ${(field.showValues || field.type === 'product') ? 'flex-row' : 'flex-col'}`}>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={opt.label}
                            placeholder={t('label') || 'Label'}
                            onChange={(e) => {
                              const newOpts = [...field.options];
                              const oldVal = newOpts[idx].value;
                              newOpts[idx].label = e.target.value;
                              let valChanged = false;
                              if (!field.showValues && field.type !== 'product') {
                                newOpts[idx].value = e.target.value;
                                valChanged = true;
                              }
                              const updates = { options: newOpts };
                              if (valChanged) {
                                if (isMulti) {
                                  if ((field.defaultValue || []).includes(oldVal)) {
                                    updates.defaultValue = (field.defaultValue || []).map(v => v === oldVal ? e.target.value : v);
                                  }
                                } else {
                                  if (field.defaultValue === oldVal) {
                                    updates.defaultValue = e.target.value;
                                  }
                                }
                              }
                              onUpdateField(field.id, updates);
                            }}
                            className="w-full bg-white border border-gray-200 p-1.5 rounded text-xs outline-none"
                          />
                        </div>
                        {(field.showValues || field.type === 'product') && (
                          <div className="flex-1">
                            <input
                              type="text"
                              value={opt.value}
                              placeholder={field.type === 'product' ? (t('product_price') || 'Price') : (t('value') || 'Value')}
                              onChange={(e) => {
                                const newOpts = [...field.options];
                                const oldVal = newOpts[idx].value;
                                newOpts[idx].value = e.target.value;
                                const updates = { options: newOpts };
                                if (isMulti) {
                                  if ((field.defaultValue || []).includes(oldVal)) {
                                    updates.defaultValue = (field.defaultValue || []).map(v => v === oldVal ? e.target.value : v);
                                  }
                                } else {
                                  if (field.defaultValue === oldVal) {
                                    updates.defaultValue = e.target.value;
                                  }
                                }
                                onUpdateField(field.id, updates);
                              }}
                              className="w-full bg-white border border-gray-200 p-1.5 rounded text-xs outline-none text-blue-600 font-mono"
                            />
                          </div>
                        )}
                      </div>
                      {(field.type === 'image_radio' || field.type === 'image_checkbox' || (field.type === 'product' && field.productFieldType === 'image_radio')) && (
                        <div className="flex items-center gap-2">
                          {opt.imageUrl ? (
                            <img src={opt.imageUrl} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />
                          ) : (
                            <div className="w-8 h-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400">
                              <ImageIcon size={14} />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              if (window.wp && window.wp.media) {
                                const mediaUploader = window.wp.media({
                                  title: t('select_image') || 'Select Image',
                                  button: { text: t('use_this_image') || 'Use this image' },
                                  multiple: false
                                });
                                mediaUploader.on('select', function () {
                                  const attachment = mediaUploader.state().get('selection').first().toJSON();
                                  const newOpts = [...field.options];
                                  newOpts[idx].imageUrl = attachment.url;
                                  onUpdateField(field.id, { options: newOpts });
                                });
                                mediaUploader.open();
                              } else {
                              }
                            }}
                            className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-semibold text-gray-700 transition-colors whitespace-nowrap"
                            title={t('upload_from_media_library') || "Upload from Media Library"}
                          >
                            {opt.imageUrl ? (t('change_image') || 'Change') : (t('upload_image') || 'Upload Image')}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const newOpts = field.options.filter((_, i) => i !== idx);
                          const updates = { options: newOpts };
                          if (isMulti) {
                            if ((field.defaultValue || []).includes(opt.value)) {
                              updates.defaultValue = (field.defaultValue || []).filter(v => v !== opt.value);
                            }
                          } else {
                            if (field.defaultValue === opt.value) {
                              updates.defaultValue = '';
                            }
                          }
                          onUpdateField(field.id, updates);
                        }}
                        className="shrink-0 text-red-500 hover:bg-red-50 p-1.5 rounded"
                        title={t('remove_option') || 'Remove Option'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => onUpdateField(field.id, { options: [...(field.options || []), { id: Date.now(), label: `Option ${(field.options || []).length + 1}`, value: `option_${(field.options || []).length + 1}` }] })}
                    className="w-full py-2 bg-primary/10 text-primary font-semibold text-xs rounded hover:bg-primary/20 transition-colors"
                  >
                    {t('add_option') || 'Add Option'}
                  </button>
                  {field.defaultValue && (field.defaultValue !== '' && field.defaultValue.length !== 0) && (
                    <button
                      onClick={() => onUpdateField(field.id, { defaultValue: ['checkbox', 'image_checkbox'].includes(field.type) ? [] : '' })}
                      className="w-full py-2 bg-gray-100 text-gray-600 font-semibold text-xs rounded hover:bg-gray-200 transition-colors"
                    >
                      {t('clear_default_choices') || 'Clear Default Choices'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {field.type === 'checkbox' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">{t('layout_columns') || 'Layout Columns'}</label>
              <select
                value={field.columns || '1'}
                onChange={(e) => onUpdateField(field.id, { columns: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="1">{t('1_column') || '1 Column'}</option>
                <option value="2">{t('2_columns') || '2 Columns'}</option>
                <option value="3">{t('3_columns') || '3 Columns'}</option>
                <option value="4">{t('4_columns') || '4 Columns'}</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">{t('1_column_mobile') || 'Displays as 1 column on mobile devices.'}</p>
            </div>
          )}

          {field.type === 'dropdown' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">{t('dropdown_settings') || 'Dropdown Settings'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`multiple-${field.id}`}
                  checked={field.allowMultiple || false}
                  onChange={(e) => onUpdateField(field.id, { allowMultiple: e.target.checked })}
                  className="accent-primary w-4 h-4"
                />
                <label htmlFor={`multiple-${field.id}`} className="text-sm font-semibold cursor-pointer">{t('allow_multiple_selection') || 'Allow Multiple Selection'}</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`search-${field.id}`}
                  checked={field.enableSearch || false}
                  onChange={(e) => onUpdateField(field.id, { enableSearch: e.target.checked })}
                  className="accent-primary w-4 h-4"
                />
                <label htmlFor={`search-${field.id}`} className="text-sm font-semibold cursor-pointer">{t('enable_search_box') || 'Enable Search Box'}</label>
              </div>

              {field.allowMultiple && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('min_selections') || 'Min Selections'}</label>
                      <input
                        type="number" min="0"
                        value={field.minSelections || ''}
                        onChange={(e) => onUpdateField(field.id, { minSelections: parseInt(e.target.value, 10) || '' })}
                        className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('max_selections') || 'Max Selections'}</label>
                      <input
                        type="number" min="0"
                        value={field.maxSelections || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || '';
                          onUpdateField(field.id, { maxSelections: val });
                          if (val && field.enableSelectAll) {
                            onUpdateField(field.id, { enableSelectAll: false });
                          }
                        }}
                        className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {['checkbox', 'image_checkbox'].includes(field.type) && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">{t('checkbox_settings') || 'Checkbox Settings'}</label>

              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('min_selections') || 'Min Selections'}</label>
                  <input
                    type="number" min="0"
                    value={field.minSelections || ''}
                    onChange={(e) => onUpdateField(field.id, { minSelections: parseInt(e.target.value, 10) || '' })}
                    className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('max_selections') || 'Max Selections'}</label>
                  <input
                    type="number" min="0"
                    value={field.maxSelections || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || '';
                      onUpdateField(field.id, { maxSelections: val });
                      if (val && field.enableSelectAll) {
                        onUpdateField(field.id, { enableSelectAll: false });
                      }
                    }}
                    className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {!field.maxSelections && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`select-all-${field.id}`}
                    checked={field.enableSelectAll || false}
                    onChange={(e) => onUpdateField(field.id, { enableSelectAll: e.target.checked })}
                    className="accent-primary w-4 h-4"
                  />
                  <label htmlFor={`select-all-${field.id}`} className="text-sm font-semibold cursor-pointer">{t('enable_select_all') || 'Enable "Select All"'}</label>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ExtensionSlot
        name="BuilderProFieldSettings"
        section="image_styling"
        field={field}
        onUpdateField={onUpdateField}
        fallback={
          (['image_radio', 'image_checkbox'].includes(field.type) || (field.type === 'product' && field.productFieldType === 'image_radio')) ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 font-semibold flex items-center justify-between mt-4">
              <span>🔒 Image Styling settings are a Pro Feature</span>
            </div>
          ) : null
        }
      />

      {!['repeater', 'file', 'image_upload'].includes(field.type) && (
        <ExtensionSlot
          name="BuilderProFieldSettings"
          section={field.type}
          field={field}
          onUpdateField={onUpdateField}
          availableFields={availableFields}
          fallback={
            ['range_slider', 'product', 'quantity', 'calculator', 'stripe_payment'].includes(field.type) ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 font-semibold flex items-center justify-between mt-4">
                <span>🔒 {field.type} settings are a Pro Feature</span>
              </div>
            ) : null
          }
        />
      )}

      {field.type !== 'hidden' && field.type !== 'html' && field.type !== 'heading' && (
        <div className="pt-4 border-t border-gray-100 mt-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('column_width') || 'Column Width'}</label>
          <div className="flex rounded-md overflow-hidden border border-gray-300 bg-gray-50">
            <button
              type="button"
              onClick={() => onUpdateField(field.id, { width: '100' })}
              className={`flex-1 py-1.5 text-xs font-semibold ${field.width === '100' || !field.width ? 'bg-white shadow-sm border-gray-300 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => onUpdateField(field.id, { width: '50' })}
              className={`flex-1 py-1.5 text-xs font-semibold ${field.width === '50' ? 'bg-white shadow-sm border-gray-300 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => onUpdateField(field.id, { width: '33' })}
              className={`flex-1 py-1.5 text-xs font-semibold ${field.width === '33' || field.width === '33.33' ? 'bg-white shadow-sm border-gray-300 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              33%
            </button>
            <button
              type="button"
              onClick={() => onUpdateField(field.id, { width: '25' })}
              className={`flex-1 py-1.5 text-xs font-semibold ${field.width === '25' ? 'bg-white shadow-sm border-gray-300 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              25%
            </button>
          </div>
        </div>
      )}

      {field.type !== 'html' && field.type !== 'heading' && field.type !== 'captcha' && (
        <>
          <div className="pt-4 border-t border-gray-100">
            <h5 className="text-xs font-bold text-gray-700 mb-3">{t('advanced_settings') || 'Advanced Settings'}</h5>

            {['text', 'name', 'email', 'phone', 'url'].includes(field.type) && (
              <div className="flex items-center gap-2 mb-3 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                <input
                  type="checkbox"
                  id={`autocomplete-${field.id}`}
                  checked={field.enableAutocomplete !== false}
                  onChange={(e) => onUpdateField(field.id, { enableAutocomplete: e.target.checked })}
                  className="accent-primary w-4 h-4"
                />
                <label htmlFor={`autocomplete-${field.id}`} className="text-[11px] font-semibold cursor-pointer text-amber-950">{t('enable_browser_autocomplete') || 'Enable Browser Autocomplete'}</label>
              </div>
            )}

            {field.type !== 'file' && field.type !== 'image_upload' && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('default_value') || 'Default Value'}</label>
                <input
                  type="text"
                  value={field.defaultValue || ''}
                  onChange={(e) => onUpdateField(field.id, { defaultValue: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={t('pre_fill_value') || 'Pre-fill value'}
                />
                <p className="text-[10px] text-gray-400 mt-1">{t('default_value_help') || 'You can use {get:param_name} to pre-fill from URL'}</p>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('custom_name_attr') || 'Custom Name Attribute'}</label>
              <input
                type="text"
                value={field.customName || ''}
                onChange={(e) => onUpdateField(field.id, { customName: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-xs"
                placeholder={t('eg_user_email') || "user_email"}
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('container_css_class') || 'Container CSS Class'}</label>
              <input
                type="text"
                value={field.containerClass || ''}
                onChange={(e) => onUpdateField(field.id, { containerClass: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-xs"
                placeholder={t('eg_custom_class') || "my-custom-class"}
              />
            </div>

            {field.type !== 'hidden' && (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('tooltip_text') || 'Tooltip Text (? icon)'}</label>
                  <input
                    type="text"
                    value={field.tooltipText || ''}
                    onChange={(e) => onUpdateField(field.id, { tooltipText: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder={t('tooltip_placeholder') || "Text for the tooltip icon"}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('help_message_below') || 'Help Message (Below Field)'}</label>
                  <input
                    type="text"
                    value={field.helpMessage || ''}
                    onChange={(e) => onUpdateField(field.id, { helpMessage: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder={t('help_msg_placeholder') || "Small text below field"}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('custom_error_msg') || 'Custom Error Message'}</label>
                  <input
                    type="text"
                    value={field.customErrorMessage || ''}
                    onChange={(e) => onUpdateField(field.id, { customErrorMessage: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder={t('eg_error_msg') || "Please enter a valid phone number"}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}


      {field.type !== 'hidden' && field.type !== 'heading' && field.type !== 'consent' && field.type !== 'captcha' && (
        <FieldConditions field={field} onUpdateField={onUpdateField} availableFields={availableFields} />
      )}
    </div>
  );
}

/**
 * CodeMirror HTML Editor wrapper using WordPress native wp.codeEditor API.
 */
function HtmlCodeEditor({ value, onChange, t }) {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    let cmInstance = null;
    if (textareaRef.current && window.wp && window.wp.codeEditor) {
      try {
        const settings = (window.qoracrmCodeEditorSettings && window.qoracrmCodeEditorSettings.html)
          ? window.qoracrmCodeEditorSettings.html
          : window.qoracrmCodeEditorSettings || {
            codeEditor: {
              codemirror: {
                mode: 'htmlmixed',
                lineNumbers: true,
                autoCloseTags: true,
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
        console.warn('CodeEditor initialization skipped or failed:', e);
      }
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-gray-500">{t('custom_html_content') || 'Custom HTML Content'}</label>
        <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">HTML / Shortcodes</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono bg-slate-900 text-slate-100"
        rows={6}
        placeholder={`<p>${t('enter_html_here') || 'Enter HTML here...'}</p>`}
      />
    </div>
  );
}
