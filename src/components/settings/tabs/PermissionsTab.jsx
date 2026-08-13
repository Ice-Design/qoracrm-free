import { Check } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';
import ExtensionSlot from '../../common/ExtensionSlot';
import { ProGate } from '../../common/ProBadge';

const CRM_ROLES = [
  { id: 'qoracrm_manager', label: 'CRM Manager' },
  { id: 'qoracrm_agent', label: 'CRM Agent' }
];

export function PermissionsTab({ wpUsers }) {
  const { t } = useI18n();
  const { allowedRoles, managers, setPermissions } = useSettingsStore();

  const toggleRole = (roleId) => {
    const newRoles = allowedRoles.includes(roleId)
      ? allowedRoles.filter(r => r !== roleId)
      : [...allowedRoles, roleId];
    setPermissions(newRoles, managers);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{t('permissions_title')}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-8">

        {/* Role Based */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">{t('permissions_role_based_title')}</h3>
          <p className="text-xs text-gray-500 mb-4">{t('permissions_role_based_desc')}</p>
          <div className="flex flex-wrap gap-3">
            {/* Administrator is always checked */}
            <label className="flex items-center gap-2 cursor-not-allowed opacity-60 select-none">
              <span className="w-4 h-4 rounded border-2 border-primary bg-primary flex items-center justify-center">
                <Check size={10} className="text-white" />
              </span>
              <span className="text-sm font-medium text-gray-700">Administrator</span>
              <span className="text-[10px] text-gray-400">{t('always') || '(always)'}</span>
            </label>
            {CRM_ROLES.map(role => (
              <label key={role.id} className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allowedRoles.includes(role.id)
                    ? 'border-primary bg-primary'
                    : 'border-gray-300 bg-white'
                    }`}
                >
                  {allowedRoles.includes(role.id) && <Check size={10} className="text-white" />}
                </button>
                <span className="text-sm font-medium text-gray-700">{t(role.id === 'qoracrm_manager' ? 'crm_role_manager' : 'crm_role_agent') || role.label}</span>
              </label>
            ))}
          </div>
        </div>

        <ExtensionSlot
          name="ManagersPermissions"
          wpUsers={wpUsers}
          fallback={
            <ProGate feature="crm_managers" label={t('permissions_advanced_title') || 'Managers'}>
              <div className="text-center py-6 text-gray-400 text-sm">
                {t('permissions_advanced_desc') || 'Advanced manager role assignment and granular capabilities.'}
              </div>
            </ProGate>
          }
        />

      </div>
    </div>
  );
}
