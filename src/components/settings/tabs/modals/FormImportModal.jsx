import { useState, useEffect } from 'react';
import { X, Download, CheckSquare, Square } from 'lucide-react';
import { showGlobalToast } from '../../../../utils/helpers';

/**
 * Universal Form Import Modal — replaces 9 individual *FormImportModal.jsx files.
 * Driven entirely by config from importConfigs.js.
 */
export function FormImportModal({ config, onClose, t }) {
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFormIds, setSelectedFormIds] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await window.wp?.apiFetch?.({ path: config.fetchPath });
        if (Array.isArray(response)) {
          setForms(response);
        } else {
          showGlobalToast(t(config.errorFetchKey) || config.errorFetchFallback, 'error');
        }
      } catch (e) {
        console.error(`Error fetching forms from ${config.fetchPath}`, e);
        showGlobalToast(t(config.errorFetchKey) || config.errorFetchFallback, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchForms();
  }, [t, config]);

  const toggleSelectAll = () => {
    if (selectedFormIds.length === forms.length) {
      setSelectedFormIds([]);
    } else {
      setSelectedFormIds(forms.map(f => f.id));
    }
  };

  const toggleSelectForm = (id) => {
    if (selectedFormIds.includes(id)) {
      setSelectedFormIds(prev => prev.filter(fId => fId !== id));
    } else {
      setSelectedFormIds(prev => [...prev, id]);
    }
  };

  const handleImport = async () => {
    if (selectedFormIds.length === 0) return;
    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedFormIds) {
      try {
        const idValue = config.parseId ? config.parseId(id) : id;
        const response = await window.wp?.apiFetch?.({
          path: config.importPath,
          method: 'POST',
          data: { [config.idParam]: idValue }
        });
        
        if (config.successCheck(response)) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        console.error(`Error importing form ${id}`, e);
        failCount++;
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      showGlobalToast(
        (t(config.successKey) || `Successfully imported ${successCount} form(s)!`) +
        (failCount > 0 ? ` (${failCount} failed)` : '')
      );
    } else if (failCount > 0) {
      showGlobalToast(t(config.errorKey) || config.errorFallback, 'error');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{t(config.titleKey) || config.titleFallback}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-6">
            {t(config.descKey) || config.descFallback}
          </p>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center p-8 text-sm text-gray-500 bg-gray-50 rounded-xl">
              {t(config.noFormsKey) || config.noFormsFallback}
            </div>
          ) : (
            <div className="space-y-2">
              <div 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border-b border-gray-100 mb-2"
                onClick={toggleSelectAll}
              >
                {selectedFormIds.length === forms.length && forms.length > 0 ? (
                  <CheckSquare size={20} className="text-primary" />
                ) : (
                  <Square size={20} className="text-gray-300" />
                )}
                <span className="font-semibold text-sm text-gray-900">{t('select_all') || 'Select All'}</span>
              </div>
              
              <div className="space-y-1">
                {forms.map(f => (
                  <div 
                    key={f.id} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleSelectForm(f.id)}
                  >
                    {selectedFormIds.includes(f.id) ? (
                      <CheckSquare size={20} className="text-primary" />
                    ) : (
                      <Square size={20} className="text-gray-300" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-gray-800">{f.title || (config.showFormIdFallback ? `Form #${f.id}` : f.title)}</span>
                      <span className="text-xs text-gray-400">ID: {f.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleImport}
            disabled={selectedFormIds.length === 0 || isImporting}
            className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Download size={16} />
            )}
            {t('import_selected') || `Import Selected (${selectedFormIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
