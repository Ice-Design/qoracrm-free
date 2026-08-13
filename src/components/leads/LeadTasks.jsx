import { useState } from 'react';
import { useI18n } from '../../utils/I18nContext';
import { Calendar } from 'lucide-react';
import { UpgradeModal } from '../common/ProBadge';

export function LeadTasks() {
  const { t } = useI18n();
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
          <Calendar size={14} className="text-primary" />
          {t('tasks') || 'Tasks'}
        </div>
        <button
          onClick={() => setProUpgradeOpen(true)}
          className="text-xs font-bold !text-primary hover:!text-white bg-primary/10 hover:bg-primary px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>+ {t('add_task') || 'Add Task'}</span>
          <span className="text-[10px]">🔒</span>
        </button>
      </div>

      <UpgradeModal
        isOpen={proUpgradeOpen}
        onClose={() => setProUpgradeOpen(false)}
        feature={t('tasks') || 'Tasks'}
      />
    </section>
  );
}

export default LeadTasks;
