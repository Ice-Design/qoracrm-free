export function NavTab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 w-auto md:w-full flex items-center gap-3 px-4 py-2.5 md:py-3 rounded-xl text-sm font-semibold transition-all text-left whitespace-nowrap ${active
        ? 'bg-white shadow-sm border border-gray-200 text-primary'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
