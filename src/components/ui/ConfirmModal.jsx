import { FileText, Trash2 } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext.jsx';

/**
 * A generic confirmation modal dialog.
 *
 * Props:
 *  - title: string
 *  - message: string
 *  - confirmText: string (default: 'Confirm')
 *  - isDestructive: bool — red style for destructive actions
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - isBusy: bool — disables buttons while an async action is running
 *  - extraAction: { label: string, onClick: () => void } — optional third button (e.g. "Save & Continue")
 */
export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  isDestructive = false,
  onConfirm,
  onCancel,
  isBusy = false,
  extraAction = null,
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 transform transition-all animate-in zoom-in-95">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
            {isDestructive ? <Trash2 size={24} /> : <FileText size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            disabled={isBusy}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors shadow-sm ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'}`}
            disabled={isBusy}
          >
            {confirmText}
          </button>
          {extraAction && (
            <button
              onClick={extraAction.onClick}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
              disabled={isBusy}
            >
              {isBusy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
              {extraAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
