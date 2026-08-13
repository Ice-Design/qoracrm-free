import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';

export function FormErrorsTab() {
  const { t } = useI18n();
  const { errorTranslations, setErrorTranslations } = useSettingsStore();

  const defaultErrors = {
    required: t('error_required') || 'This field is required.',
    invalid_email: t('error_invalid_email') || 'Please enter a valid email address.',
    email_suggestion: t('error_email_suggestion') || 'Did you mean {suggestion}?',
    email_not_allowed: t('error_email_not_allowed') || 'This email address is not allowed.',
    invalid_phone: t('error_invalid_phone') || 'Please enter a valid phone number.',
    invalid_url: t('error_invalid_url') || 'Please enter a valid URL.',
    min_length: t('error_min_length') || 'Value is too short.',
    max_length: t('error_max_length') || 'Value is too long.',
    file_too_large: t('error_file_too_large') || 'File size exceeds the allowed limit.',
    invalid_file_type: t('error_invalid_file_type') || 'This file type is not allowed.',
    max_uploads: t('error_max_uploads') || 'The number of uploads exceeds the limit ({fileLimit}).',
    invalid_time_12h: t('error_invalid_time_12h') || 'Please enter time in 12-hour AM / PM format.',
    invalid_time_24h: t('error_invalid_time_24h') || 'Please enter time in 24-hour format.',
    time_limit: t('error_time_limit') || 'Please select a time between {minTime} and {maxTime}.',
    total_file_size: t('error_total_file_size') || 'Total size of selected files is {totalSize}.',
    invalid_number: t('error_invalid_number') || 'Please enter a valid number.',
    invalid_positive_number: t('error_invalid_positive_number') || 'Please enter a valid positive number.',
    min_price: t('error_min_price') || 'The entered amount is below the required minimum.',
    field_confirm: t('error_field_confirm') || 'Field values do not match.',
    incomplete_mask: t('error_incomplete_mask') || 'Please fill out this field in the required format.',
    max_choices: t('error_max_choices') || 'You have exceeded the maximum choices: {#}.',
    char_limit: t('error_char_limit') || 'Character limit: {limit}. Remaining: {remaining}.',
    word_limit: t('error_word_limit') || 'Word limit: {limit}. Remaining: {remaining}.',
    payment_required: t('error_payment_required') || 'Payment is required.',
    invalid_credit_card: t('error_invalid_credit_card') || 'Please enter a valid credit card number.'
  };

  const handleReset = () => {
    setErrorTranslations(defaultErrors);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-gray-100 shrink-0 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{t('form_errors_title')}</h2>
          <p className="text-sm text-gray-500">{t('form_errors_desc')}</p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs font-semibold text-primary hover:text-primary-dark border border-primary/20 hover:bg-primary/5 px-3 py-1.5 rounded-md transition-colors"
        >
          {t('reset_to_default') || 'Reset to defaults'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-4 max-w-2xl">
          {Object.keys(defaultErrors).map((key) => {
            const labelKey = `error_${key}`;
            return (
            <div key={key} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="w-40 shrink-0">
                <span className="text-xs font-semibold text-gray-600">{t(labelKey)}</span>
                <span className="block text-[10px] font-mono text-gray-400 mt-0.5">{key}</span>
              </div>
              <input
                type="text"
                value={errorTranslations[key] || ''}
                onChange={e => setErrorTranslations({ ...errorTranslations, [key]: e.target.value })}
                className="flex-1 border border-gray-300 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder={defaultErrors[key]}
              />
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
