import { useState } from 'react';
import { Trash2, ArrowUp, Type, Mail, Hash, Link, Clock, MapPin, Globe, User, Phone, ShieldCheck, ChevronDown } from 'lucide-react';
import { useFormStore } from '../../store/useFormStore';
import { useI18n } from '../../utils/I18nContext';
import ExtensionSlot from '../common/ExtensionSlot';

const PRO_FIELD_TYPES = [
  'image_radio',
  'image_checkbox',
  'range_slider',
  'product',
  'quantity',
  'total',
  'stripe_payment',
  'file',
  'image_upload',
  'repeater'
];

/**
 * Renders a preview of a form field on the builder canvas.
 * Handles selection and quick-delete interactions.
 */
export function FieldRenderer({ field, isSelected, isDragging, onSelectField, onRemoveField, onMoveUp }) {
  const { t } = useI18n();
  const store = useFormStore();
  const formSettings = store.formSettings;
  const selectField = onSelectField || store.selectField;
  const removeField = onRemoveField || store.removeField;
  const moveFieldUp = onMoveUp || store.moveFieldUp;

  const showIcons = formSettings?.showInputIcons !== false;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div
      onClick={() => selectField(field.id)}
      onMouseLeave={() => setShowConfirmDelete(false)}
      className={`border rounded-xl p-5 relative cursor-pointer transition-all h-full group ${isSelected
        ? 'border-primary bg-white shadow-[0_4px_12px_rgba(212,175,55,0.1)]'
        : 'border-transparent hover:bg-gray-50 hover:border-gray-200 bg-white'
        } ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}`}
    >
      {/* Quick Delete Overlay */}
      <div className="absolute top-2 right-2 flex items-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {showConfirmDelete ? (
          <div className="flex gap-1 bg-white shadow-sm border border-red-200 rounded-md p-1 items-center">
            <span className="text-[10px] font-bold text-red-500 px-1">{t('delete') || 'Delete'}?</span>
            <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }} className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600">{t('yes') || 'Yes'}</button>
            <button onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold hover:bg-gray-200">{t('no') || 'No'}</button>
          </div>
        ) : (
          <div className="flex gap-1 bg-white p-1 rounded-md shadow-sm border border-gray-100">
            <button
              onClick={(e) => { e.stopPropagation(); moveFieldUp(field.id); }}
              className="p-1 text-gray-400 hover:text-primary hover:bg-primary-light rounded transition-colors"
              title={t('move_up') || 'Move Up'}
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(true); }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title={t('delete') || 'Delete'}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {field.type !== 'hidden' && field.type !== 'html' && field.type !== 'heading' && field.type !== 'consent' && field.type !== 'total' && field.label && (
        <label className="block text-sm font-bold mb-2.5 text-gray-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
          {field.type === 'hidden' && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">{t('hidden') || 'HIDDEN'}</span>}
        </label>
      )}

      {field.type === 'heading' && (
        <div className="qoracrm-heading-preview">
          <div dangerouslySetInnerHTML={{ __html: field.label }} className="text-xl font-bold text-gray-900 prose prose-sm max-w-none" />
        </div>
      )}

      {['text', 'name', 'email', 'phone', 'number', 'url', 'hidden'].includes(field.type) && (
        <div
          className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] outline-none min-h-[48px] flex items-center gap-2 ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'
            } ${field.type === 'hidden' ? 'bg-gray-100 border-dashed text-gray-400' : 'text-gray-400'}`}
        >
          {showIcons && field.type === 'text' && <Type size={18} className="text-gray-400 shrink-0" />}
          {showIcons && field.type === 'name' && <User size={18} className="text-gray-400 shrink-0" />}
          {showIcons && field.type === 'email' && <Mail size={18} className="text-gray-400 shrink-0" />}
          {showIcons && field.type === 'number' && <Hash size={18} className="text-gray-400 shrink-0" />}
          {showIcons && field.type === 'url' && <Link size={18} className="text-gray-400 shrink-0" />}
          {field.type === 'phone' && field.useMask ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-xs font-semibold text-gray-600">
                Flag
              </div>
              <span className="truncate">{field.placeholder || t('phone') || 'Phone'}</span>
            </div>
          ) : (
            <>
              {showIcons && field.type === 'phone' && <Phone size={18} className="text-gray-400 shrink-0" />}
              <span className="truncate">{field.placeholder || (field.type === 'hidden' ? t('hidden_field') : ' ')}</span>
            </>
          )}
        </div>
      )}

      {field.type === 'textarea' && (
        <div
          className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] outline-none text-gray-400 min-h-[100px] ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'
            }`}
        >
          {field.placeholder || ' '}
        </div>
      )}

      {field.type === 'time' && (
        <div
          className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] outline-none text-gray-400 min-h-[48px] flex items-center gap-2 ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'
            }`}
        >
          {showIcons && <Clock size={18} className="text-gray-400 shrink-0" />}
          --:--
        </div>
      )}

      {field.type === 'dropdown' && (
        <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-500 flex justify-between ${isSelected ? 'border-primary' : 'border-gray-200'}`}>
          {t('select_option') || 'Select an option...'} <ChevronDown size={18} />
        </div>
      )}

      {['radio', 'checkbox'].includes(field.type) && (
        <div
          className={field.type === 'radio' ? 'flex flex-wrap gap-2 mt-1' : 'grid gap-2 mt-1'}
          style={field.type === 'checkbox' ? { gridTemplateColumns: `repeat(${field.columns || 1}, 1fr)` } : undefined}
        >
          {field.type === 'checkbox' && field.enableSelectAll && !field.maxSelections && (
            <div className="mb-2">
              <button className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded cursor-not-allowed">
                {t('select_all') || 'Select All'}
              </button>
            </div>
          )}
          {(field.options || []).map((opt, i) => (
            field.type === 'radio' ? (
              <div
                key={i}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${i === 0 ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {opt.label}
              </div>
            ) : (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 shrink-0 rounded"></div>
                <span className="text-sm text-gray-600">{opt.label}</span>
              </div>
            )
          ))}
        </div>
      )}

      {field.type === 'date' && (
        <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-400 flex items-center gap-2 min-h-[48px] ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'}`}>
          {showIcons && <Clock size={18} className="text-gray-400 shrink-0" />}
          mm/dd/yyyy
        </div>
      )}

      {field.type === 'address' && (
        <div className="flex flex-col gap-3 w-full">
          {(field.show_street !== false) && (
            <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-400 min-h-[48px] flex items-center gap-2 ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'}`}>
              {showIcons && <MapPin size={18} className="text-gray-400 shrink-0" />}
              <span className="truncate">{field.label_street || (t('street_address') || 'Street Address')}</span>
            </div>
          )}
          {(field.show_line2 !== false) && (
            <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-400 min-h-[48px] flex items-center gap-2 ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'}`}>
              <span className="truncate">{field.label_line2 || (t('address_line_2') || 'Address Line 2')}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {(field.show_city !== false) && (
              <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-400 min-h-[48px] flex items-center gap-2 ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'}`}>
                <span className="truncate">{field.label_city || (t('city') || 'City')}</span>
              </div>
            )}
            {(field.show_state !== false) && (
              <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-400 min-h-[48px] flex items-center gap-2 ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'}`}>
                <span className="truncate">{field.label_state || (t('state_province') || 'State / Province')}</span>
              </div>
            )}
            {(field.show_zip !== false) && (
              <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-400 min-h-[48px] flex items-center gap-2 ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'}`}>
                <span className="truncate">{field.label_zip || (t('zip_postal_code') || 'ZIP / Postal Code')}</span>
              </div>
            )}
            {(field.show_country !== false) && (
              <div className={`w-full bg-white border-2 p-3 rounded-lg text-[15px] text-gray-400 min-h-[48px] flex items-center gap-2 justify-between ${isSelected ? 'border-primary shadow-[0_0_0_4px_rgba(249,244,229,1)]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  {showIcons && <Globe size={18} className="text-gray-400 shrink-0" />}
                  <span className="truncate">{field.label_country || (t('country') || 'Country')}</span>
                </div>
                <ChevronDown size={18} className="text-gray-400 shrink-0" />
              </div>
            )}
          </div>
        </div>
      )}

      {field.type === 'html' && (
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-xs text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
          {field.content || (t('custom_html_placeholder') || '<!-- Custom HTML -->')}
        </div>
      )}

      {field.type === 'captcha' && (
        <div className={`w-full bg-gray-50 border-2 border-dashed p-4 rounded-xl text-center flex flex-col items-center gap-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-300'}`}>
          <ShieldCheck size={32} className={isSelected ? 'text-primary' : 'text-gray-400'} />
          <span className="text-sm font-semibold text-gray-500">{t('captcha_placeholder') || 'CAPTCHA Widget Placeholder'}</span>
        </div>
      )}

      {field.type === 'consent' && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 shrink-0 rounded shrink-0"></div>
          <span className="text-sm text-gray-600 leading-tight">
            {field.label ? (
              <span dangerouslySetInnerHTML={{
                __html: field.label
                  .replace('%1', field.policyUrl1 && field.policyText1 ? `<a href="${field.policyUrl1}" target="_blank" class="text-blue-600 hover:underline">${field.policyText1}</a>` : '%1')
                  .replace('%2', field.policyUrl2 && field.policyText2 ? `<a href="${field.policyUrl2}" target="_blank" class="text-blue-600 hover:underline">${field.policyText2}</a>` : '%2')
              }} />
            ) : (
              'Yes, I consent to having this website store my submitted information.'
            )}
          </span>
        </div>
      )}

      {/* Pro Field Renderer Slot */}
      {PRO_FIELD_TYPES.includes(field.type) && (
        <ExtensionSlot
          name="ProFieldRenderer"
          field={field}
          isSelected={isSelected}
          showIcons={showIcons}
          t={t}
          fallback={
            <div className="w-full p-4 border border-yellow-200 bg-yellow-50/50 rounded-xl flex items-center justify-between text-yellow-800 text-xs font-semibold">
              <span>🔒 Pro Field ({field.type})</span>
            </div>
          }
        />
      )}
    </div>
  );
}
