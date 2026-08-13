import { useFormStore } from '../../store/useFormStore';
import { Plus, Trash2, Info } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';

/**
 * Conditional logic panel rendered inside FieldSettings.
 */
export function FieldConditions({ field, onUpdateField, availableFields: propAvailableFields }) {
  const { t } = useI18n();
  const storeFields = useFormStore(state => state.fields);
  const fields = propAvailableFields || storeFields;
  const conditions = field.conditions || { enabled: false, match: 'any', rules: [] };

  const updateConditions = (updates) => {
    onUpdateField(field.id, { conditions: { ...conditions, ...updates } });
  };

  const addRule = () => {
    updateConditions({ rules: [...conditions.rules, { fieldId: '', operator: 'equals', value: '' }] });
  };

  const updateRule = (index, updates) => {
    const newRules = [...conditions.rules];
    newRules[index] = { ...newRules[index], ...updates };
    updateConditions({ rules: newRules });
  };

  const removeRule = (index) => {
    const newRules = [...conditions.rules];
    newRules.splice(index, 1);
    updateConditions({ rules: newRules });
  };

  const availableFields = fields.filter(f => f.id !== field.id && !['html', 'heading', 'file', 'image_upload', 'repeater'].includes(f.type));

  return (
    <div className="mt-6 pt-5 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-bold text-gray-700">{t('conditional_logic') || 'Conditional Logic'}</label>
      </div>
      <div className="flex gap-6 mb-4">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 cursor-pointer group">
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${conditions.enabled ? 'border-primary' : 'border-gray-300 group-hover:border-primary/50'}`}>
            {conditions.enabled && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <input
            type="radio"
            checked={conditions.enabled}
            onChange={() => updateConditions({ enabled: true })}
            className="sr-only"
          />
          {t('yes') || 'Yes'}
        </label>
        <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 cursor-pointer group">
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!conditions.enabled ? 'border-primary' : 'border-gray-300 group-hover:border-primary/50'}`}>
            {!conditions.enabled && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <input
            type="radio"
            checked={!conditions.enabled}
            onChange={() => updateConditions({ enabled: false })}
            className="sr-only"
          />
          {t('no') || 'No'}
        </label>
      </div>

      {conditions.enabled && (
        <div className="bg-[#f8f9fa] p-5 rounded-xl border border-gray-200 shadow-sm mt-2">
          <div className="flex items-center gap-1.5 mb-3">
            <label className="text-[13px] font-bold text-gray-800">{t('condition_match') || 'Condition Match'}</label>
            <Info size={14} className="text-gray-400" />
          </div>
          <div className="flex gap-5 mb-5">
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${conditions.match === 'any' ? 'border-primary' : 'border-gray-300 group-hover:border-primary/50'}`}>
                {conditions.match === 'any' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <input
                type="radio"
                checked={conditions.match === 'any'}
                onChange={() => updateConditions({ match: 'any' })}
                className="sr-only"
              />
              <span className={conditions.match === 'any' ? 'text-primary' : ''}>{t('any') || 'Any'}</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${conditions.match === 'all' ? 'border-primary' : 'border-gray-300 group-hover:border-primary/50'}`}>
                {conditions.match === 'all' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <input
                type="radio"
                checked={conditions.match === 'all'}
                onChange={() => updateConditions({ match: 'all' })}
                className="sr-only"
              />
              <span className={conditions.match === 'all' ? 'text-primary' : ''}>{t('all') || 'All'}</span>
            </label>
          </div>

          <div className="space-y-3">
            {conditions.rules.map((rule, index) => {
              const selectedTargetField = availableFields.find(f => f.id === rule.fieldId);
              const targetHasOptions = selectedTargetField && ['radio', 'checkbox', 'dropdown', 'multiple_choice', 'image_radio', 'image_checkbox'].includes(selectedTargetField.type) && Array.isArray(selectedTargetField.options);

              return (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex flex-1 gap-2">
                    <select
                      value={rule.fieldId}
                      onChange={(e) => updateRule(index, { fieldId: e.target.value, value: '' })}
                      className="w-1/3 bg-white border border-gray-300 rounded-md p-2.5 text-[13px] text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                    >
                      <option value="" disabled>{t('select_field') || 'Select field'}</option>
                      {availableFields.map(f => (
                        <option key={f.id} value={f.id}>{f.label || f.type}</option>
                      ))}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(index, { operator: e.target.value })}
                      className="w-1/3 bg-white border border-gray-300 rounded-md p-2.5 text-[13px] text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                    >
                      <option value="equals">{t('is_equal_to') || 'is equal to'}</option>
                      <option value="not_equals">{t('is_not_equal_to') || 'is not equal to'}</option>
                      {!targetHasOptions && (
                        <>
                          <option value="greater_than">{t('greater_than') || 'greater than'}</option>
                          <option value="less_than">{t('less_than') || 'less than'}</option>
                          <option value="greater_than_or_equal">{t('greater_or_equal') || 'greater or equal'}</option>
                          <option value="less_than_or_equal">{t('less_or_equal') || 'less or equal'}</option>
                          <option value="contains">{t('contains') || 'contains'}</option>
                          <option value="not_contains">{t('does_not_contain') || 'does not contain'}</option>
                          <option value="starts_with">{t('starts_with') || 'starts with'}</option>
                          <option value="ends_with">{t('ends_with') || 'ends with'}</option>
                          <option value="regex_match">{t('matches_regex') || 'matches regex'}</option>
                        </>
                      )}
                    </select>

                    {targetHasOptions ? (
                      <select
                        value={rule.value}
                        onChange={(e) => updateRule(index, { value: e.target.value })}
                        className="w-1/3 bg-white border border-gray-300 rounded-md p-2.5 text-[13px] text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                      >
                        <option value="" disabled>{t('select_value') || 'Select value'}</option>
                        {selectedTargetField.options.map((opt, i) => (
                          <option key={i} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => updateRule(index, { value: e.target.value })}
                        placeholder={t('value') || 'Value'}
                        className="w-1/3 bg-white border border-gray-300 rounded-md p-2.5 text-[13px] text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeRule(index)}
                    className="text-gray-400 hover:text-red-500 shrink-0 p-1.5 rounded-md hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                    title={t('remove_condition') || 'Remove Condition'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            onClick={addRule}
            className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-[#d4af37] hover:text-[#b5952f] transition-colors"
          >
            <Plus size={14} /> {t('add_condition') || 'Add Condition'}
          </button>
        </div>
      )}
    </div>
  );
}
