/**
 * A single navigation button in the top navigation bar.
 */
export function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
        isActive 
          ? 'text-primary-dark bg-[#f9f4e5] shadow-[inset_0_0_0_1px_rgba(212,175,55,0.2)]' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <span className={isActive ? 'text-primary' : 'opacity-70'}>{icon}</span>
      <span className="qoracrm-hidden-mobile">{label}</span>
    </button>
  );
}
