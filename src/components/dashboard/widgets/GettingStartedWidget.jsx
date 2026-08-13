import { WidgetContainer } from './WidgetContainer';
import { CheckCircle2 } from 'lucide-react';

export function GettingStartedWidget({ tasks, t, onRemove }) {
  const doneCount = tasks.filter(task => task.done).length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  return (
    <WidgetContainer title={t('getting_started') || 'Getting Started'} hasSettings={false} onRemove={onRemove}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 shrink-0 relative">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeDasharray={`${progress}, 100`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
            {doneCount}/{tasks.length}
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{t('setup_crm') || 'Set up your CRM'}</div>
          <p className="text-xs text-gray-500 mt-0.5">{t('complete_tasks_to_start') || 'Complete these basic tasks to get started'}</p>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <a key={task.id} href={task.link} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${task.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-sm'}`}>
            <CheckCircle2 size={18} className={task.done ? 'text-teal-400' : 'text-gray-300'} />
            <span className={`text-sm font-medium ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.label}</span>
          </a>
        ))}
      </div>
    </WidgetContainer>
  );
}
