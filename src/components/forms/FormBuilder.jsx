import { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Palette } from 'lucide-react';
import { useFormStore } from '../../store/useFormStore';
import { showGlobalToast, copyShortcode } from '../../utils/helpers';
import { ComponentsPalette } from '../builder/ComponentsPalette';
import { isAvailable } from '../../hooks/useFeature';
import { UpgradeModal } from '../common/ProBadge';

import { FieldSettings } from '../builder/FieldSettings';
import { FieldRenderer } from '../builder/FieldRenderer';
import { GlobalSettings } from '../builder/GlobalSettings';
import { StyleSettings } from '../builder/StyleSettings';
import ExtensionSlot from '../common/ExtensionSlot';
import { useI18n } from '../../utils/I18nContext';


const getIconHtml = (icon_val, size = 16) => {
  const s = `font-size: ${size}px; line-height: 1; vertical-align: middle;`;
  switch (icon_val) {
    case 'arrow-right': return `<span style="${s}">&rarr;</span>`;
    case 'arrow-left': return `<span style="${s}">&larr;</span>`;
    case 'chevron-right': return `<span style="${s}">&#10095;</span>`;
    case 'chevron-left': return `<span style="${s}">&#10094;</span>`;
    case 'check': return `<span style="${s}">&#10003;</span>`;
    case 'send': return `<span style="${s}">&#10148;</span>`;
    default: return '';
  }
};

import { PREDEFINED_ICONS, FORM_ICONS } from '../ui/IconPickerSettings';

const RenderPresetIcon = ({ iconId, size }) => {
  const iconObj = PREDEFINED_ICONS.find(i => i.id === iconId) || FORM_ICONS.find(i => i.id === iconId);
  if (iconObj) {
    const IconComponent = iconObj.icon;
    return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IconComponent size={size} style={{ width: size, height: size }} /></span>;
  }
  return <span dangerouslySetInnerHTML={{ __html: getIconHtml(iconId, size) }} />;
};

/**
 * The main form builder editor view.
 * Handles the canvas, sidebar tabs, drag-and-drop, saving, and quiz steps.
 */
export function FormBuilder({ onBack, routeFormId }) {
  const {
    formTitle, setFormTitle,
    quizMode, setQuizMode,
    formSettings,
    steps, activeStepId, addStep, removeStep, setActiveStepId, updateStep,
    fields, selectField, selectedFieldId, moveField, loadSchema,
    addField, updateField, removeField, isDirty, markClean, undo
  } = useFormStore();

  const { t } = useI18n();

  const [sidebarTab, setSidebarTab] = useState('components');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRepeaterId, setEditingRepeaterId] = useState(null);
  const [quizUpgradeOpen, setQuizUpgradeOpen] = useState(false);
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);


  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedOriginalIndex, setDraggedOriginalIndex] = useState(null);
  const [draggedOverStep, setDraggedOverStep] = useState(null);

  // Fetch form if directly loaded via URL and store is empty
  useEffect(() => {
    if (routeFormId && fields.length === 0 && formTitle === 'New Form') {
      fetchForm(routeFormId);
    } else if (!routeFormId && !isDirty && formTitle === 'New Form') {
      useFormStore.getState().setLocalizedDefaults(
        t('new_form') || 'New Form',
        t('step') || 'Step',
        t('next') || 'Next',
        t('prev') || 'Prev'
      );
    }
  }, [routeFormId, isDirty, formTitle, t]);

  const fetchForm = async (id) => {
    setIsLoading(true);
    try {
      const response = await window.wp.apiFetch({ path: `/qoracrm/v1/forms/${id}` });
      if (response && response.fields_schema) {
        let schema = JSON.parse(response.fields_schema);
        if (typeof schema === 'string') schema = JSON.parse(schema);
        loadSchema(schema, response.title);
      }
    } catch (e) {
      if (e?.code !== 'qoracrm_form_not_found' && e?.status !== 404) {
        console.error(e);
      }
      showGlobalToast(t('Error loading form from server.'), 'error');
    }
    setIsLoading(false);
  };

  const prevSelectedFieldId = useRef(selectedFieldId);
  useEffect(() => {
    if (selectedFieldId && selectedFieldId !== prevSelectedFieldId.current) {
      setSidebarTab('settings');
      prevSelectedFieldId.current = selectedFieldId;
    } else if (!selectedFieldId && prevSelectedFieldId.current) {
      prevSelectedFieldId.current = null;
    }
  }, [selectedFieldId]);

  useEffect(() => {
    const handleOpenRepeater = (e) => {
      setEditingRepeaterId(e.detail);
    };
    document.addEventListener('openRepeaterModal', handleOpenRepeater);

    const handleBeforeUnload = (e) => {
      if (useFormStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        // Prevent default if not typing in an input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          useFormStore.getState().undo();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('openRepeaterModal', handleOpenRepeater);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleGlobalSave = async (e) => {
      const savedId = await handleSave();
      if (savedId && e.detail?.onSuccess) {
        e.detail.onSuccess();
      } else if (!savedId && e.detail?.onError) {
        e.detail.onError();
      }
    };
    window.addEventListener('qoracrm_request_save', handleGlobalSave);
    return () => window.removeEventListener('qoracrm_request_save', handleGlobalSave);
  }, [quizMode, formSettings, steps, fields, formTitle, routeFormId]);

  // Auto-save effect
  useEffect(() => {
    const isAutosaveEnabled = window.qoraCrmData?.general?.form_autosave;
    if (!isAutosaveEnabled || !isDirty || !routeFormId || isSaving) return;

    const interval = window.qoraCrmData?.general?.form_autosave_interval || 3000;
    const timer = setTimeout(() => {
      handleSave(true);
    }, interval);

    return () => clearTimeout(timer);
  }, [isDirty, formTitle, quizMode, formSettings, steps, fields, routeFormId]);

  const proFieldFeatures = {
    'image_radio': 'field_image_radio',
    'image_checkbox': 'field_image_checkbox',
    'range_slider': 'field_range',
    'repeater': 'field_repeater',
    'file': 'field_file_upload',
    'image_upload': 'field_image_upload',
    'product': 'field_products',
    'quantity': 'field_products',
    'total': 'field_products',
    'stripe_payment': 'field_stripe_payment'
  };

  const hasLockedProFeature = (fields) => {
    if (!fields) return false;
    for (const field of fields) {
      if (proFieldFeatures[field.type] && !isAvailable(proFieldFeatures[field.type])) {
        return true;
      }
      if (field.type === 'repeater' && Array.isArray(field.fields)) {
        if (hasLockedProFeature(field.fields)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleSave = async (isAutosave = false) => {
    // For manual global event calls, the param might be an event object
    if (typeof isAutosave !== 'boolean') isAutosave = false;

    // Trigger anti-piracy check if Pro is active
    if (!isAutosave && window.QoraCRM && typeof window.QoraCRM.stealthCheck === 'function') {
      window.QoraCRM.stealthCheck();
    }

    setIsSaving(true);
    let savedId = routeFormId;
    try {
      const schemaData = {
        quizMode,
        formSettings,
        steps,
        fields
      };

      const response = await window.wp.apiFetch({
        path: '/qoracrm/v1/forms' + (routeFormId ? `/${routeFormId}` : ''),
        method: routeFormId ? 'PUT' : 'POST',
        data: {
          title: formTitle,
          fields_schema: schemaData,
          status: 'publish'
        }
      });
      savedId = response.id;
      if (!isAutosave) {
        showGlobalToast(t('form_saved_success') || 'Form saved successfully!');
      }

      // Fire and forget stealth check


      markClean();
      if (!routeFormId) window.location.hash = `#/forms/builder/${savedId}`;
    } catch (e) {
      console.error(e);
      if (e.code === 'rest_forbidden') {
        showGlobalToast(t('permissions_no_access') || 'You do not have permission to perform this action.', 'error');
      } else if (e.code === 'qoracrm_pro_field_required') {
        setProUpgradeOpen(true);
      } else if (e.code === 'qoracrm_limit_reached') {
        showGlobalToast(e.message || 'Lite plan limit reached.', 'error');
        setProUpgradeOpen(true);
      } else {
        showGlobalToast(e.message || t('form_save_error') || 'Error saving form.', 'error');
      }
      savedId = null;
    }
    setIsSaving(false);
    return savedId;
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
    setDraggedOriginalIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('qoracrm/new_field')) {
      setDraggedIndex(`new-${index}`);
      return;
    }
    setDraggedIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const newFieldType = e.dataTransfer.getData('qoracrm/new_field');
    const newFieldLabel = e.dataTransfer.getData('qoracrm/new_field_label');
    if (newFieldType) {
      addField(newFieldType, index, newFieldLabel);
    } else {
      if (draggedOriginalIndex !== null && draggedOriginalIndex !== index) {
        moveField(draggedOriginalIndex, index);
      }
    }
    setDraggedIndex(null);
    setDraggedOriginalIndex(null);
  };

  const activeFields = fields.filter(f => f.stepId === activeStepId);

  const isInlineSubmit = Boolean(formSettings.isInlineSubmit) || (
    (!quizMode || steps.length <= 1) && ['33.333%', '33%', '25%', '33', '25'].includes(formSettings.submitWidth)
  );

  const renderSubmitButtons = () => (
    <>
      {formSettings.enableSaveContinue && (
        <button
          onClick={() => {
            selectField(null);
            setSidebarTab('global_settings');
          }}
          className="bg-transparent text-gray-500 font-semibold border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mr-auto"
          style={{
            padding: formSettings.submitSize === 'small' ? '8px 16px' : (formSettings.submitSize === 'large' ? '16px 32px' : '12px 24px'),
            fontSize: formSettings.submitSize === 'small' ? '13px' : (formSettings.submitSize === 'large' ? '17px' : '15px'),
            borderRadius: `${formSettings.borderRadius || 8}px`,
          }}
        >
          <RenderPresetIcon iconId="save" size={16} />
          <span>{formSettings.saveButtonText || t('save_and_continue') || 'Save and Continue'}</span>
        </button>
      )}
      {quizMode ? (
        <ExtensionSlot
          name="ProQuizNavButtons"
          quizMode={quizMode}
          steps={steps}
          activeStepId={activeStepId}
          formSettings={formSettings}
          selectField={selectField}
          setSidebarTab={setSidebarTab}
          isInlineSubmit={isInlineSubmit}
          t={t}
          fallback={
            <button
              onClick={() => {
                selectField(null);
                setSidebarTab('global_settings');
              }}
              style={{
                width: isInlineSubmit ? '100%' : (formSettings.submitWidth || '100%'),
                padding: formSettings.submitSize === 'small' ? '8px 16px' : (formSettings.submitSize === 'large' ? '16px 32px' : '12px 24px'),
                fontSize: formSettings.submitSize === 'small' ? '13px' : (formSettings.submitSize === 'large' ? '17px' : '15px'),
                backgroundColor: formSettings.accentColor || '#d4af37',
                borderRadius: `${formSettings.borderRadius || 8}px`,
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${formSettings.submitIcon?.gap || 8}px`
              }}
            >
              {(() => {
                const icon = formSettings.submitIcon;
                if (!icon?.show) return null;
                const size = icon.size || 16;
                const content = icon.type === 'media' ? <img src={icon.icon} style={{ width: size, height: size }} className="object-contain" alt="" /> : <RenderPresetIcon iconId={icon.icon} size={size} />;
                return icon.position === 'left' ? content : null;
              })()}
              <span>{formSettings.submitText || t('submit') || 'Submit'}</span>
              {(() => {
                const icon = formSettings.submitIcon;
                if (!icon?.show) return null;
                const size = icon.size || 16;
                const content = icon.type === 'media' ? <img src={icon.icon} style={{ width: size, height: size }} className="object-contain" alt="" /> : <RenderPresetIcon iconId={icon.icon} size={size} />;
                return icon.position === 'right' ? content : null;
              })()}
            </button>
          }
        />
      ) : (
        <button
          onClick={() => {
            selectField(null);
            setSidebarTab('global_settings');
          }}
          style={{
            width: isInlineSubmit ? '100%' : (formSettings.submitWidth || '100%'),
            padding: formSettings.submitSize === 'small' ? '8px 16px' : (formSettings.submitSize === 'large' ? '16px 32px' : '12px 24px'),
            fontSize: formSettings.submitSize === 'small' ? '13px' : (formSettings.submitSize === 'large' ? '17px' : '15px'),
            backgroundColor: formSettings.accentColor || '#d4af37',
            borderRadius: `${formSettings.borderRadius || 8}px`,
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${formSettings.submitIcon?.gap || 8}px`
          }}
        >
          {(() => {
            const icon = formSettings.submitIcon;
            if (!icon?.show) return null;
            const size = icon.size || 16;
            const content = icon.type === 'media' ? <img src={icon.icon} style={{ width: size, height: size }} className="object-contain" alt="" /> : <RenderPresetIcon iconId={icon.icon} size={size} />;
            return icon.position === 'left' ? content : null;
          })()}
          <span>{formSettings.submitText || t('submit') || 'Submit'}</span>
          {(() => {
            const icon = formSettings.submitIcon;
            if (!icon?.show) return null;
            const size = icon.size || 16;
            const content = icon.type === 'media' ? <img src={icon.icon} style={{ width: size, height: size }} className="object-contain" alt="" /> : <RenderPresetIcon iconId={icon.icon} size={size} />;
            return icon.position === 'right' ? content : null;
          })()}
        </button>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Action Bar */}
      <div className="h-16 flex items-center justify-between px-8 shrink-0 bg-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-900 transition-colors font-semibold text-sm mr-2"
          >
            ← {t('back') || 'Back'}
          </button>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="!w-48 !pl-8 !pr-3 !py-1.5 !border !border-gray-200 hover:!border-gray-300 !text-sm !font-medium !bg-white !outline-none focus:!border-primary focus:!ring-1 focus:!ring-primary transition-colors !text-gray-700 !m-0 !min-h-0 !h-auto !box-border"
          />
          {routeFormId && (
            <div
              onClick={() => copyShortcode(routeFormId, null, t('shortcode_copied') || 'Shortcode copied to clipboard!')}
              className="bg-white/60 text-gray-500 px-3 py-1.5 rounded-md text-[13px] font-mono border border-gray-200 ml-2 select-all flex items-center cursor-pointer hover:bg-primary hover:text-white transition-colors"
              title={t('click_to_copy') || "Click to copy"}
            >
              [qoracrm_form id=&quot;{routeFormId}&quot;]
            </div>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <ExtensionSlot
            name="ProQuizToggle"
            quizMode={quizMode}
            setQuizMode={setQuizMode}
            onUpgradeClick={() => setQuizUpgradeOpen(true)}
            fallback={
              <div
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm opacity-60 cursor-pointer"
                onClick={() => setQuizUpgradeOpen(true)}
              >
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  {t('quiz_mode') || 'Quiz Mode'} <span className="text-[11px]">🔒</span>
                </span>
                <div className="w-10 h-5 rounded-full bg-gray-300 relative">
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white" />
                </div>
              </div>
            }
          />
          <button
            onClick={async () => {
              let targetId = routeFormId;
              if (isDirty || !routeFormId) {
                targetId = await handleSave();
              }
              if (targetId) {
                window.open(`/?qoracrm_preview=${targetId}`, 'qoracrm_preview_tab');
              }
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {t('preview') || 'Preview'}
          </button>
          <button
            onClick={() => { setSidebarTab('global_settings'); selectField(null); }}
            className={`flex items-center justify-center p-2.5 rounded-full border shadow-sm transition-all ${sidebarTab === 'global_settings' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            title={t('global_form_settings') || 'Global Form Settings'}
          >
            <SettingsIcon size={20} />
          </button>
          <button
            onClick={() => { setSidebarTab('style_settings'); selectField(null); }}
            className={`flex items-center justify-center p-2.5 rounded-full border shadow-sm transition-all ${sidebarTab === 'style_settings' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            title={t('style_settings') || 'Style Settings'}
          >
            <Palette size={20} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-primary text-white shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:bg-primary-dark hover:-translate-y-[1px] transition-all disabled:opacity-50"
          >
            {isSaving ? (t('saving') || 'Saving...') : (t('save_changes') || 'Save Changes')}
          </button>
        </div>
      </div>

      {/* Builder Layout */}
      <div className="flex flex-1 overflow-hidden px-8 pb-8">

        {/* Canvas (Center) */}
        <section className="flex-1 flex flex-col min-w-0" onClick={() => { selectField(null); setSidebarTab('components'); }}>

          <ExtensionSlot
            name="ProQuizStepsBar"
            quizMode={quizMode}
            steps={steps}
            activeStepId={activeStepId}
            setActiveStepId={setActiveStepId}
            setSidebarTab={setSidebarTab}
            selectField={selectField}
            draggedOverStep={draggedOverStep}
            setDraggedOverStep={setDraggedOverStep}
            fields={fields}
            updateField={updateField}
            setDraggedIndex={setDraggedIndex}
            removeStep={removeStep}
            addStep={addStep}
          />

          <div className="flex-1 overflow-y-auto flex justify-center w-full">
            <div
              className={`bg-white w-full max-w-[720px] rounded-2xl shadow-md p-10 h-min min-h-[300px] transition-colors ${draggedIndex === 'new-end' ? 'border-2 border-primary border-dashed bg-primary/5' : ''}`}
              onClick={(e) => e.stopPropagation()}
              onDragOver={(e) => {
                e.preventDefault();
                if (e.dataTransfer.types.includes('qoracrm/new_field')) {
                  setDraggedIndex('new-end');
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const newFieldType = e.dataTransfer.getData('qoracrm/new_field');
                const newFieldLabel = e.dataTransfer.getData('qoracrm/new_field_label');
                if (newFieldType) {
                  addField(newFieldType, null, newFieldLabel); // appends to the end
                }
                setDraggedIndex(null);
              }}
              onDragLeave={() => setDraggedIndex(null)}
            >
              {((formSettings.title || (formTitle && formTitle !== 'New Form')) || formSettings.subtitle) && (!quizMode || steps.findIndex(s => s.id === activeStepId) === 0) && (
                <div className="mb-6">
                  {(formSettings.title || (formTitle && formTitle !== 'New Form')) ? (
                    <h3 style={{ fontSize: `${formSettings.titleSize || 24}px`, color: formSettings.titleColor || '#1a202c', fontWeight: 700, marginBottom: '8px' }}>
                      {formSettings.title || formTitle}
                    </h3>
                  ) : null}
                  {formSettings.subtitle && (
                    <p style={{ fontSize: `${formSettings.subtitleSize || 14}px`, color: formSettings.subtitleColor || '#4a5568', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                      {formSettings.subtitle}
                    </p>
                  )}
                </div>
              )}
              {isLoading ? (
                <div className="text-center text-gray-400 mt-10">{t('loading_form') || 'Loading form data...'}</div>
              ) : activeFields.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  <p>{t('no_fields_in_step') || 'No fields in this step.'}</p>
                  <p className="text-sm">{t('click_component_to_add') || 'Click a component on the right to add.'}</p>
                </div>
              ) : (
                <div className="flex flex-wrap -mx-2">
                  {activeFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="px-2 pb-4 transition-all flex flex-col justify-end"
                      style={{ width: `${field.width || 100}%` }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', '');
                        e.dataTransfer.setData('qoracrm/dragged_field_id', field.id);
                        handleDragStart(index);
                      }}
                      onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, index); }}
                      onDrop={(e) => { e.stopPropagation(); handleDrop(e, index); }}
                      onDragLeave={(e) => {
                        if (draggedIndex === `new-${index}`) {
                          setDraggedIndex(null);
                        }
                      }}
                      onDragEnd={() => { setDraggedIndex(null); setDraggedOriginalIndex(null); }}
                    >
                      <div className={`transition-all ${draggedIndex === index || draggedIndex === `new-${index}` ? 'border-t-4 border-primary pt-2 rounded-t' : ''}`}>
                        <FieldRenderer
                          field={field}
                          isSelected={selectedFieldId === field.id}
                          isDragging={draggedOriginalIndex === index}
                        />
                      </div>
                    </div>
                  ))}

                  {isInlineSubmit && activeFields.length > 0 && (
                    <div className="px-2 pb-4 transition-all flex items-end" style={{ width: formSettings.submitWidth }}>
                      <div className="flex gap-4 w-full" style={{ justifyContent: 'flex-start' }}>
                        {renderSubmitButtons()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isInlineSubmit && activeFields.length > 0 && (
                <div className="mt-5 px-2 flex gap-4 w-full" style={{
                  justifyContent: formSettings.submitAlignment === 'right' ? 'flex-end' : (formSettings.submitAlignment === 'left' ? 'flex-start' : 'center')
                }}>
                  {renderSubmitButtons()}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar (Right) */}
        <aside className="w-[500px] bg-white rounded-2xl shadow-md flex flex-col overflow-hidden shrink-0">
          <div className="flex border-b border-gray-200 p-2 bg-gray-50">
            <div
              onClick={() => { setSidebarTab('components'); selectField(null); }}
              className={`flex-1 text-center py-2.5 text-[13px] font-semibold rounded-lg cursor-pointer transition-all ${sidebarTab === 'components' ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              {t('components') || 'Components'}
            </div>
            <div
              onClick={() => {
                if (selectedFieldId) setSidebarTab('settings');
                else setSidebarTab('global_settings');
              }}
              className={`flex-1 text-center py-2.5 text-[13px] font-semibold rounded-lg cursor-pointer transition-all ${sidebarTab === 'settings' || sidebarTab === 'step_settings' || sidebarTab === 'global_settings' || sidebarTab === 'style_settings' ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              {sidebarTab === 'style_settings' ? (t('style_settings') || 'Style Settings') : (sidebarTab === 'step_settings' ? (t('step_settings') || 'Step Settings') : (selectedFieldId ? (t('field_settings') || 'Field Settings') : (t('form_settings') || 'Form Settings')))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {sidebarTab === 'components' && <ComponentsPalette onAddField={addField} fields={fields} />}
            {sidebarTab === 'settings' && <FieldSettings field={fields.find(f => f.id === selectedFieldId)} onUpdateField={updateField} onRemoveField={removeField} availableFields={fields} />}
            {sidebarTab === 'step_settings' && quizMode && (
              <ExtensionSlot
                name="StepSettings"
                steps={steps}
                activeStepId={activeStepId}
                updateStep={updateStep}
                t={t}
              />
            )}
            {sidebarTab === 'global_settings' && <GlobalSettings quizMode={quizMode} setSidebarTab={setSidebarTab} />}
            {sidebarTab === 'style_settings' && <StyleSettings formId={routeFormId} />}
          </div>
        </aside>

      </div>

      {editingRepeaterId && (
        <ExtensionSlot
          name="RepeaterEditorModal"
          repeaterField={fields.find(f => f.id === editingRepeaterId)}
          onClose={() => setEditingRepeaterId(null)}
          onSave={(subFields) => {
            updateField(editingRepeaterId, { fields: subFields });
            setEditingRepeaterId(null);
          }}
        />
      )}

      <UpgradeModal
        isOpen={quizUpgradeOpen}
        onClose={() => setQuizUpgradeOpen(false)}
        feature={t('quiz_mode') || 'Quiz Mode'}
      />
      <UpgradeModal
        isOpen={proUpgradeOpen}
        onClose={() => setProUpgradeOpen(false)}
        feature="Premium Fields"
      />
    </div>
  );
}
