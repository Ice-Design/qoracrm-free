import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * A collapsible accordion section used in settings panels.
 */
export const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg bg-white mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors font-semibold text-sm text-gray-700 ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
      >
        {title}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-4 flex flex-col gap-4 border-t border-gray-200">{children}</div>}
    </div>
  );
};
