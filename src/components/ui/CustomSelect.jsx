import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';

export function CustomSelect({ value, onChange, options, allLabel, minWidth = 'w-36', stopPropagation = false, disabled = false, menuPosition = 'bottom' }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const current = options.find(o => o.value === value);
  const displayLabel = current ? current.label : (allLabel || t('select_option') || 'Select...');
  const displayColor = current?.color || null;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative inline-block ${minWidth} shrink-0`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { if (stopPropagation) e.stopPropagation(); if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full flex items-center justify-between border px-3 py-1.5 text-sm font-medium transition-colors outline-none ${disabled ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-gray-300'}`}
      >
        <div className="flex items-center gap-2 truncate">
          {displayColor && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: displayColor }} />}
          <span className="truncate text-gray-700">{displayLabel}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 ml-1 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-[99] ${menuPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 min-w-full bg-white border border-gray-200 py-1 overflow-hidden shadow-xl`}>
          {allLabel && (
            <button
              onClick={(e) => { if (stopPropagation) e.stopPropagation(); onChange(''); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${!value ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {allLabel}
            </button>
          )}
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={(e) => {
                if (stopPropagation) e.stopPropagation();
                if (opt.isLocked) {
                  if (opt.onLockClick) opt.onLockClick();
                  else if (window.qoraOpenUpgradeModal) window.qoraOpenUpgradeModal(t('tab_statuses') || 'Statuses');
                } else {
                  onChange(opt.value);
                  setIsOpen(false);
                }
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${opt.isLocked ? 'hover:bg-gray-50 opacity-70 cursor-not-allowed' : (value === opt.value ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50')
                }`}
            >
              {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
              <span className="truncate font-medium flex-1">{opt.label}</span>
              {opt.isLocked && <span className="text-[10px] shrink-0" title={t('premium_feature') || "Premium Feature"}>🔒</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
