import { useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { UpgradeModal } from '../common/ProBadge';

export function LeadPayments({ t }) {
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
          <DollarSign size={14} className="text-primary" />
          {t ? t('payments') || 'Payments' : 'Payments'}
        </div>
        <button
          onClick={() => setProUpgradeOpen(true)}
          className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-1 shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <Plus size={14} /> <span>{t ? t('add_payment') || 'Add Payment' : 'Add Payment'}</span> <span className="text-[10px]">🔒</span>
        </button>
      </div>

      <UpgradeModal
        isOpen={proUpgradeOpen}
        onClose={() => setProUpgradeOpen(false)}
        feature={t ? t('payments') || 'Payments' : 'Payments'}
      />
    </section>
  );
}

export default LeadPayments;
