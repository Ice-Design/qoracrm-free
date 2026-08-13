import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';

export function SearchableSelect({ value, onChange, options, placeholder = 'Select...', disabled = false, limit = 0 }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  const currentOption = options.find(o => String(o.value) === String(value));
  const displayLabel = currentOption ? currentOption.label : placeholder;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  let filteredOptions = options.filter(opt => {
    if (!search) return true;
    const s = search.toLowerCase();
    return opt.label.toLowerCase().includes(s) || (opt.searchData && opt.searchData.toLowerCase().includes(s));
  });

  if (limit > 0) {
    filteredOptions = filteredOptions.slice(0, limit);
  }

  return (
    <div className={`relative w-full`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { e.preventDefault(); if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full flex items-center justify-between bg-white border px-4 py-2.5 text-sm rounded-lg transition-colors outline-none focus:ring-2 focus:ring-primary/20 ${disabled ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <span className="truncate text-gray-700">{displayLabel}</span>
        <ChevronDown size={16} className={`text-gray-400 ml-2 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 left-0 w-full bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col max-h-64">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 text-gray-400 bg-gray-50/50">
            <Search size={14} className="ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search') || 'Search...'}
              className="w-full text-sm outline-none bg-transparent text-gray-800"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${!value ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {placeholder}
            </button>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-gray-400">{t('no_data') || 'No data found'}</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${String(value) === String(opt.value) ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
