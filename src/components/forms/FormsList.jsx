import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit3, Copy, Trash2, FileText, Eye, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useFormStore } from '../../store/useFormStore';
import { showGlobalToast, copyShortcode } from '../../utils/helpers';
import { useI18n } from '../../utils/I18nContext';
import { TemplateSelectionModal } from './TemplateSelectionModal';
import { ConfirmModal } from '../ui/ConfirmModal';

/**
 * Displays the list of all saved forms with actions to edit, duplicate, delete.
 */
export function FormsList({ onOpenBuilder }) {
  const { t } = useI18n();
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { loadSchema } = useFormStore();
  
  // Check if there are any active plugins that we support importing from
  const hasImportablePlugins = window.qoraCrmData?.is_cf7_active || false;

  useEffect(() => {
    fetchForms();
  }, []);

  async function fetchForms() {
    try {
      const response = await window.wp.apiFetch({ path: '/qoracrm/v1/forms' });
      setForms(response);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (form) => {
    let schema = [];
    if (form.fields_schema) {
      try {
        schema = JSON.parse(form.fields_schema);
        if (typeof schema === 'string') schema = JSON.parse(schema);
      } catch (e) { }
    }
    loadSchema(schema, form.title);
    onOpenBuilder(form.id);
  };

  const handleCreateNew = () => {
    setShowTemplateModal(true);
  };

  const handleSelectTemplate = (template) => {
    setShowTemplateModal(false);
    
    // Convert template schema IDs slightly to avoid duplicates if user creates multiple from same template
    const schemaFields = template.schema.map(f => ({ ...f, id: Math.random().toString(36).substr(2, 9) }));
    
    const fullSchema = {
      quizMode: !!template.settings?.quizMode,
      formSettings: {
        accentColor: '#d4af37',
        maxWidth: '100%',
        submitText: t('submit') || 'Submit',
        saveButtonText: t('save_and_continue') || 'Save and Continue',
        successMessage: t('thank_you_message') || 'Thank you! Your message has been sent.',
        popupButtonText: t('open_form') || 'Open Form',
        ...(template.settings || {})
      },
      steps: template.steps || [{ id: 'step_1', label: t('step') ? `${t('step')} 1` : 'Step 1', nextLabel: t('next') || 'Next', prevLabel: t('prev') || 'Prev' }],
      fields: schemaFields
    };
    
    loadSchema(fullSchema, template.id === 'blank' ? t('new_form') || 'New Form' : template.title);
    
    onOpenBuilder(null);
  };

  const handleDelete = (id) => {
    setConfirmAction({
      title: t('delete_form') || 'Delete Form',
      message: t('delete_form_confirm') || 'Are you sure you want to delete this form? This action cannot be undone.',
      isDestructive: true,
      confirmText: t('delete') || 'Delete',
      onConfirm: async () => {
        try {
          await window.wp.apiFetch({ path: `/qoracrm/v1/forms/${id}`, method: 'DELETE' });
          showGlobalToast(t('form_deleted') || 'Form deleted successfully!');
          fetchForms();
        } catch (e) {
          console.error(e);
          if (e.code === 'rest_forbidden') {
            showGlobalToast(t('permissions_no_access') || 'You do not have permission to perform this action.', 'error');
          } else {
            showGlobalToast(t('error_deleting_form') || 'Error deleting form.', 'error');
          }
        }
      }
    });
  };

  const handleDuplicate = (form) => {
    setConfirmAction({
      title: t('duplicate_form') || 'Duplicate Form',
      message: t('duplicate_form_confirm') || 'Are you sure you want to duplicate this form?',
      isDestructive: false,
      confirmText: t('duplicate') || 'Duplicate',
      onConfirm: async () => {
        try {
          let schemaData = [];
          if (form.fields_schema) {
            try {
              schemaData = typeof form.fields_schema === 'string' ? JSON.parse(form.fields_schema) : form.fields_schema;
              if (typeof schemaData === 'string') schemaData = JSON.parse(schemaData);
            } catch (e) { }
          }

          const data = {
            title: `${t('copy_of') || 'Copy of'} ${form.title}`,
            fields_schema: schemaData
          };
          await window.wp.apiFetch({
            path: '/qoracrm/v1/forms',
            method: 'POST',
            data
          });
          showGlobalToast(t('form_duplicated') || 'Form duplicated successfully!');
          fetchForms();
        } catch (e) {
          console.error(e);
          if (e.code === 'rest_forbidden') {
            showGlobalToast(t('permissions_no_access') || 'You do not have permission to perform this action.', 'error');
          } else {
            showGlobalToast(t('error_duplicating_form') || 'Error duplicating form.', 'error');
          }
        }
      }
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const sortedForms = useMemo(() => {
    const sorted = [...forms].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'id' || sortField === 'views' || sortField === 'submissions') {
        valA = parseInt(valA) || 0;
        valB = parseInt(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [forms, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedForms.length / ITEMS_PER_PAGE);
  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedForms.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedForms, currentPage]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100">↕</span>;
    return sortOrder === 'asc' ? <ChevronUp size={14} className="ml-1 inline text-primary" /> : <ChevronDown size={14} className="ml-1 inline text-primary" />;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('forms') || 'Forms'}</h1>
        <div className="flex items-center gap-3">
          {hasImportablePlugins && (
            <button
              onClick={() => window.location.hash = '#/settings/import'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download size={18} />
              {t('import') || 'Import'}
            </button>
          )}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-primary text-white shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:bg-primary-dark hover:-translate-y-[1px] transition-all"
          >
            <Plus size={18} />
            {t('add_new_form') || 'Add New Form'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
              <th className="font-semibold p-4 w-16 cursor-pointer group select-none" onClick={() => handleSort('id')}>
                <div className="flex items-center">{t('id') || 'ID'} <SortIcon field="id" /></div>
              </th>
              <th className="font-semibold p-4 cursor-pointer group select-none" onClick={() => handleSort('title')}>
                <div className="flex items-center">{t('title') || 'Title'} <SortIcon field="title" /></div>
              </th>
              <th className="font-semibold p-4 w-16 cursor-pointer group select-none text-center" title={t('views') || 'Views'} onClick={() => handleSort('views')}>
                <div className="flex items-center justify-center"><Eye size={16} className={`inline-block ${sortField === 'views' ? 'text-primary' : 'text-gray-400'}`} /> <SortIcon field="views" /></div>
              </th>
              <th className="font-semibold p-4 w-16 cursor-pointer group select-none text-center" title={t('submissions') || 'Submissions'} onClick={() => handleSort('submissions')}>
                <div className="flex items-center justify-center"><FileText size={16} className={`inline-block ${sortField === 'submissions' ? 'text-primary' : 'text-gray-400'}`} /> <SortIcon field="submissions" /></div>
              </th>
              <th className="font-semibold p-4">{t('shortcode') || 'ShortCode'}</th>
              <th className="font-semibold p-4 w-32 text-center">{t('actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-400">{t('loading_forms') || 'Loading forms...'}</td></tr>
            ) : forms.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-400">{t('no_forms_found') || 'No forms found. Create one!'}</td></tr>
            ) : (
              paginatedForms.map(form => (
                <tr key={form.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-center font-medium text-gray-500">{form.id}</td>
                  <td className="p-4"><button onClick={() => handleEdit(form)} className="font-semibold text-gray-900 hover:text-primary transition-colors text-left">{form.title}</button></td>
                  <td className="p-4 text-center text-gray-600 font-medium">{form.views || 0}</td>
                  <td className="p-4 text-center text-gray-600 font-medium">{form.submissions || 0}</td>
                  <td className="p-4">
                    <code
                      onClick={(e) => copyShortcode(form.id, e, t('shortcode_copied') || 'Shortcode copied to clipboard!')}
                      className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-[13px] font-mono border border-gray-200 cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors"
                      title={t('click_to_copy') || 'Click to copy'}
                    >
                      [qoracrm_form id=&quot;{form.id}&quot;]
                    </code>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(form)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-md transition-colors" title={t('edit') || 'Edit'}><Edit3 size={16} /></button>
                      <button onClick={() => handleDuplicate(form)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title={t('duplicate') || 'Duplicate'}><Copy size={16} /></button>
                      <button onClick={() => handleDelete(form.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title={t('delete') || 'Delete'}><Trash2 size={16} /></button>
                      <a href={`/?qoracrm_preview=${form.id}`} target="_blank" rel="noreferrer" className="p-2 !text-gray-400 hover:text-primary hover:bg-primary-light rounded-md transition-colors" title={t('preview') || 'Preview'}><Eye size={16} /></a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">
              {t('showing') || 'Showing'} {((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t('to') || 'to'} {Math.min(currentPage * ITEMS_PER_PAGE, sortedForms.length)} {t('of') || 'of'} {sortedForms.length} {t('entries') || 'entries'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generic Confirm Action Modal */}
      {showTemplateModal && (
        <TemplateSelectionModal 
          onClose={() => setShowTemplateModal(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          isDestructive={confirmAction.isDestructive}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
