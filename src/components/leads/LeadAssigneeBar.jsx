import { useState } from 'react';
import { User } from 'lucide-react';
import { UpgradeModal } from '../common/ProBadge';

export function LeadAssigneeBar({ lead = {}, crmUsers, t }) {
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);
  const currentAssignee = (crmUsers || []).find(u => String(u.id) === String(lead?.assignee_id));

  return (
    <div className="px-8 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3 shrink-0">
      <User size={15} className="text-gray-400 shrink-0" />
      <span className="text-xs font-semibold text-gray-500 shrink-0">{t ? t('lead_assignee') : 'Assignee'}:</span>
      <div
        onClick={() => setProUpgradeOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-400 cursor-pointer hover:border-primary/50 transition-colors"
      >
        <span>{currentAssignee?.name || (t ? t('lead_assignee_placeholder') : 'Unassigned')}</span>
      </div>
      <UpgradeModal
        isOpen={proUpgradeOpen}
        onClose={() => setProUpgradeOpen(false)}
        feature={t ? t('lead_assignee') : 'Assignee'}
      />
    </div>
  );
}

export default LeadAssigneeBar;
