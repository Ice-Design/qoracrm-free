/**
 * A single navigation button in the top navigation bar.
 */
export function NavItem({ icon, label, isActive, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
        isActive 
          ? 'text-primary-dark bg-[#f9f4e5] shadow-[inset_0_0_0_1px_rgba(212,175,55,0.2)]' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <span className={isActive ? 'text-primary' : 'opacity-70'}>{icon}</span>
      <span className="qoracrm-hidden-mobile">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 px-1.5 py-[0.5px] rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-orange-500 text-white shadow-xs ring-2 ring-white leading-tight pointer-events-none select-none">
          {badge}
        </span>
      )}
    </button>
  );
}
