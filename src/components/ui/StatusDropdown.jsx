import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';

export function StatusDropdown({ value, onChange, statuses, placeholder, menuPosition = 'bottom', disabled = false, onLockClick }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentStatus = statuses.find(s => s.id === value);
  const displayLabel = currentStatus ? currentStatus.label : (placeholder || t('change_status') || 'Select...');
  const displayColor = currentStatus ? currentStatus.color : 'transparent';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block w-48" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full flex items-center justify-between bg-white border px-3 py-1.5 text-sm font-medium transition-colors outline-none ${disabled ? 'opacity-60 cursor-not-allowed border-gray-100 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`w-2 h-2 rounded-full shrink-0 ${!currentStatus ? 'bg-gray-200' : ''}`} style={{ backgroundColor: displayColor }}></span>
          <span className="truncate text-gray-700">{displayLabel}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 ml-1 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 z-[99] ${menuPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} min-w-full bg-white border border-gray-200 py-1 overflow-hidden shadow-xl`}>
          {statuses.map((s, index) => {
            const isLocked = s.isLocked || (window.QoraCRM?.isStatusLocked?.(index) ?? false);
            return (
              <button
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    if (onLockClick) onLockClick();
                    else if (window.qoraOpenUpgradeModal) window.qoraOpenUpgradeModal(t('tab_statuses') || 'Statuses');
                  } else {
                    onChange(s.id);
                    setIsOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${isLocked ? 'hover:bg-gray-50 opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                <span className="truncate text-gray-700 font-medium flex-1">{s.label}</span>
                {isLocked && <span className="text-[10px] shrink-0" title={t('premium_feature') || "Premium Feature"}>🔒</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
