import { Settings, X, Lock } from 'lucide-react';
import { useState } from 'react';
import { UpgradeModal } from '../../common/ProBadge';
import { useI18n } from '../../../utils/I18nContext';
import ExtensionSlot from '../../common/ExtensionSlot';

export function WidgetContainer({ title, children, onSettingsClick, hasSettings = true, onRemove, containerClass = "p-5", headerClass = "mb-4" }) {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);

  return (
    <div 
      className={`bg-white ${containerClass} rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full w-full relative overflow-hidden group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center justify-between ${headerClass}`}>
        <h3 className="font-bold text-gray-900 truncate">{title}</h3>
        
        {/* Widget Controls Overlay */}
        <div
          className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <ExtensionSlot name="WidgetDragHandle" t={t} fallback={null} />
          {hasSettings && onSettingsClick && (
            <ExtensionSlot
              name="WidgetSettingsButton"
              onSettingsClick={onSettingsClick}
              t={t}
              fallback={
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onSettingsClick(e); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors flex items-center cursor-pointer"
                  title={t('widget_settings') || 'Widget Settings'}
                >
                  <Settings size={16} />
                </button>
              }
            />
          )}
          {onRemove && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(e); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              title={t('widget_remove') || "Remove Widget"}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 w-full">
        {children}
      </div>
      
      <UpgradeModal 
        isOpen={proUpgradeOpen} 
        onClose={() => setProUpgradeOpen(false)} 
        feature={t('widget_settings') || 'Widget Settings'} 
      />
    </div>
  );
}
