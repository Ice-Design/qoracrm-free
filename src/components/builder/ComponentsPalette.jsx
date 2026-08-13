import { useState } from 'react';
import { FileText, AlignLeft, Hash, Globe, Calendar, EyeOff, Code, ChevronDown, CheckSquare, Image as ImageIcon, UploadCloud, Layers, ShieldCheck, Sliders, User, ShoppingCart, DollarSign, Mail, Phone, Calculator } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';
import { UpgradeModal } from '../common/ProBadge';
import { useFormStore } from '../../store/useFormStore';
import ExtensionSlot from '../common/ExtensionSlot';

/**
 * A single button in the ComponentsPalette.
 */
function FieldButton({ type, label, icon, onClick, disabled }) {
  return (
    <div
      onClick={disabled ? null : onClick}
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) return;
        e.dataTransfer.setData('qoracrm/new_field', type);
        e.dataTransfer.setData('qoracrm/new_field_label', label);
      }}
      className={`bg-[#f5f6f8] border p-3 rounded-xl flex items-center gap-2 text-[12px] font-semibold transition-all group ${disabled ? 'opacity-50 cursor-not-allowed border-transparent text-gray-400' : 'border-transparent text-gray-700 cursor-pointer hover:bg-[#f9f4e5] hover:border-primary hover:text-primary-dark hover:-translate-y-0.5'}`}
    >
      <div className={`transition-colors ${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-primary'}`}>
        {icon}
      </div>
      {label}
    </div>
  );
}

/**
 * A locked Pro field button — shows lock icon, opens UpgradeModal on click.
 */
function ProFieldButton({ label, icon, featureKey, onUpgrade }) {
  const { t } = useI18n();
  return (
    <div
      onClick={() => onUpgrade(featureKey, label)}
      draggable={false}
      className="bg-[#f5f6f8] border border-transparent p-3 rounded-xl flex items-center gap-2 text-[12px] font-semibold text-gray-400 cursor-pointer transition-all hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 group relative pro-locked-wrapper"
      title={t('available_in_pro') || 'Available in Pro'}
    >
      <div className="text-gray-300 group-hover:text-yellow-500 transition-colors">
        {icon}
      </div>
      {label}
      <span className="ml-auto text-[10px]">🔒</span>
    </div>
  );
}

/**
 * Sidebar palette for adding new fields to the form canvas.
 */
export function ComponentsPalette({ onAddField, fields = [] }) {
  const { t } = useI18n();
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: null, label: null });

  // Use global store for captcha to prevent multiple captchas even across repeaters
  const hasCaptcha = useFormStore(state => state.fields.some(f => f.type === 'captcha'));

  const openUpgrade = (feature, label) => setUpgradeModal({ open: true, feature, label });
  const closeUpgrade = () => setUpgradeModal({ open: false, feature: null, label: null });

  const hasTotalOrCalc = fields.some(f => f.type === 'total' || f.type === 'calculator');

  return (
    <div className="pb-10">
      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-3 font-semibold">{t('standard_fields') || 'Standard Fields'}</h4>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <FieldButton type="text" label={t('text_input') || 'Text Input'} icon={<FileText size={18} />} onClick={() => onAddField('text', null, t('text_input') || 'Text Input')} />
        <FieldButton type="name" label={t('name_input') || 'Name'} icon={<User size={18} />} onClick={() => onAddField('name', null, t('name_input') || 'Name')} />
        <FieldButton type="textarea" label={t('text_area') || 'Text Area'} icon={<AlignLeft size={18} />} onClick={() => onAddField('textarea', null, t('text_area') || 'Text Area')} />
        <FieldButton type="email" label={t('email') || 'Email'} icon={<Mail size={18} />} onClick={() => onAddField('email', null, t('email') || 'Email')} />
        <FieldButton type="number" label={t('numeric') || 'Numeric'} icon={<Hash size={18} />} onClick={() => onAddField('number', null, t('numeric') || 'Numeric')} />
        <FieldButton type="phone" label={t('phone') || 'Phone'} icon={<Phone size={18} />} onClick={() => onAddField('phone', null, t('phone') || 'Phone')} />
        <FieldButton type="url" label={t('website_url') || 'Website URL'} icon={<Globe size={18} />} onClick={() => onAddField('url', null, t('website_url') || 'Website URL')} />
      </div>

      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-3 font-semibold">{t('choice_fields') || 'Choice Fields'}</h4>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <FieldButton type="dropdown" label={t('dropdown') || 'Dropdown'} icon={<ChevronDown size={18} />} onClick={() => onAddField('dropdown', null, t('dropdown') || 'Dropdown', t('option') || 'Option')} />
        <FieldButton type="radio" label={t('radio') || 'Radio'} icon={<CheckSquare size={18} />} onClick={() => onAddField('radio', null, t('radio') || 'Radio', t('option') || 'Option')} />
        <FieldButton type="checkbox" label={t('checkbox') || 'Checkbox'} icon={<CheckSquare size={18} />} onClick={() => onAddField('checkbox', null, t('checkbox') || 'Checkbox', t('option') || 'Option')} />

        <ExtensionSlot
          name="ProFieldButton_image_radio"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="image_radio" label={t('image_radio') || 'Image Radio'} icon={<ImageIcon size={18} />} featureKey="field_file_upload" onUpgrade={openUpgrade} />
          }
        />
        <ExtensionSlot
          name="ProFieldButton_image_checkbox"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="image_checkbox" label={t('image_checkbox') || 'Image Checkbox'} icon={<ImageIcon size={18} />} featureKey="field_file_upload" onUpgrade={openUpgrade} />
          }
        />
      </div>

      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-3 font-semibold">{t('advanced_fields') || 'Advanced Fields'}</h4>
      <div className="grid grid-cols-2 gap-2">
        <ExtensionSlot
          name="ProFieldButton_range_slider"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="range_slider" label={t('range_slider') || 'Range Slider'} icon={<Sliders size={18} />} featureKey="field_file_upload" onUpgrade={openUpgrade} />
          }
        />
        <ExtensionSlot
          name="ProFieldButton_repeater"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="repeater" label={t('repeater') || 'Repeater'} icon={<Layers size={18} />} featureKey="field_repeater" onUpgrade={openUpgrade} />
          }
        />
        <FieldButton type="heading" label={t('heading_title') || 'Heading/Title'} icon={<AlignLeft size={18} />} onClick={() => onAddField('heading', null, t('heading_title') || 'Heading/Title')} />
        <FieldButton type="address" label={t('address') || 'Address'} icon={<Globe size={18} />} onClick={() => onAddField('address', null, t('address') || 'Address')} />
        <FieldButton type="date" label={t('date') || 'Date'} icon={<Calendar size={18} />} onClick={() => onAddField('date', null, t('date') || 'Date')} />
        <FieldButton type="time" label={t('time') || 'Time'} icon={<Calendar size={18} />} onClick={() => onAddField('time', null, t('time') || 'Time')} />
        <FieldButton type="hidden" label={t('hidden_field') || 'Hidden Field'} icon={<EyeOff size={18} />} onClick={() => onAddField('hidden', null, t('hidden_field') || 'Hidden Field')} />
        <FieldButton type="html" label={t('custom_html') || 'Custom HTML'} icon={<Code size={18} />} onClick={() => onAddField('html', null, t('custom_html') || 'Custom HTML')} />
        <FieldButton type="consent" label={t('consent') || 'Consent'} icon={<ShieldCheck size={18} />} onClick={() => onAddField('consent', null, t('consent') || 'Consent')} />
        <FieldButton type="captcha" label={t('captcha') || 'CAPTCHA'} icon={<ShieldCheck size={18} />} onClick={() => onAddField('captcha', null, t('captcha') || 'CAPTCHA')} disabled={hasCaptcha} />

        <ExtensionSlot
          name="ProFieldButton_file"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="file" label={t('file_upload') || 'File Upload'} icon={<UploadCloud size={18} />} featureKey="field_file_upload" onUpgrade={openUpgrade} />
          }
        />
        <ExtensionSlot
          name="ProFieldButton_image_upload"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="image_upload" label={t('image_upload') || 'Image Upload'} icon={<ImageIcon size={18} />} featureKey="field_file_upload" onUpgrade={openUpgrade} />
          }
        />
      </div>

      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-3 mt-6 font-semibold">{t('pricing_fields') || 'Pricing Fields'}</h4>
      <div className="grid grid-cols-2 gap-2">
        <ExtensionSlot
          name="ProFieldButton_product"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="product" label={t('product_field') || 'Product'} icon={<ShoppingCart size={18} />} featureKey="field_products" onUpgrade={openUpgrade} />
          }
        />
        <ExtensionSlot
          name="ProFieldButton_quantity"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="quantity" label={t('quantity_field') || 'Quantity'} icon={<Hash size={18} />} featureKey="field_products" onUpgrade={openUpgrade} />
          }
        />
        <ExtensionSlot
          name="ProFieldButton_total"
          onAddField={onAddField}
          hasTotalOrCalc={hasTotalOrCalc}
          t={t}
          fallback={
            <ProFieldButton type="total" label={t('total_field') || 'Total'} icon={<DollarSign size={18} />} featureKey="field_products" onUpgrade={openUpgrade} />
          }
        />
        <ExtensionSlot
          name="ProFieldButton_calculator"
          onAddField={onAddField}
          hasTotalOrCalc={hasTotalOrCalc}
          t={t}
          fallback={
            <ProFieldButton type="calculator" label={t('calculator_field') || 'Calculator'} icon={<Calculator size={18} />} featureKey="field_products" onUpgrade={openUpgrade} />
          }
        />
        <ExtensionSlot
          name="ProFieldButton_stripe_payment"
          onAddField={onAddField}
          t={t}
          fallback={
            <ProFieldButton type="stripe_payment" label={t('stripe_payment_field') || 'Stripe'} icon={
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.92 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
              </svg>
            } featureKey="field_stripe_payment" onUpgrade={openUpgrade} />
          }
        />
      </div>

      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={closeUpgrade}
        feature={upgradeModal.label}
      />
    </div>
  );
}
