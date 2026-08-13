export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative shrink-0">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="!w-48 !pl-8 !pr-3 !py-1.5 !border !border-gray-200 hover:!border-gray-300 !text-sm !font-medium !bg-white !outline-none focus:!border-primary focus:!ring-1 focus:!ring-primary transition-colors !text-gray-700 !m-0 !min-h-0 !h-auto !box-border"
      />
    </div>
  );
}
