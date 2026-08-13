import { create } from 'zustand';

const MAX_HISTORY = 5;

const takeSnapshot = (state) => ({
  quizMode: state.quizMode,
  formSettings: JSON.parse(JSON.stringify(state.formSettings)),
  steps: JSON.parse(JSON.stringify(state.steps)),
  fields: JSON.parse(JSON.stringify(state.fields)),
  activeStepId: state.activeStepId,
});

export const useFormStore = create((set) => ({
  formTitle: 'New Form',
  quizMode: false,
  formSettings: { accentColor: '#d4af37', maxWidth: '100%' },
  steps: [{ id: 'step_1', label: 'Step 1', nextLabel: 'Next', prevLabel: 'Prev' }],
  activeStepId: 'step_1',
  fields: [],
  selectedFieldId: null,
  isDirty: false,
  past: [], // History stack for undo

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const newPast = [...state.past];
    const previous = newPast.pop();
    return {
      ...previous,
      past: newPast,
      isDirty: true,
      selectedFieldId: null // Clear selection on undo to avoid invalid state
    };
  }),

  setFormTitle: (title) => set({ formTitle: title, isDirty: true }),
  setLocalizedDefaults: (formTitle, stepLabel, nextLabel, prevLabel) => set((state) => {
    if (state.isDirty || state.past.length > 0) return state;
    if (state.formTitle !== 'New Form') return state;
    return {
      formTitle,
      steps: state.steps.map(s => s.id === 'step_1' ? { ...s, label: `${stepLabel} 1`, nextLabel, prevLabel } : s)
    };
  }),
  updateFormSettings: (updates) => set((state) => {
    const snap = takeSnapshot(state);
    return { 
      formSettings: { ...state.formSettings, ...updates }, 
      isDirty: true,
      past: [...state.past, snap].slice(-MAX_HISTORY)
    };
  }),
  markClean: () => set({ isDirty: false, past: [] }),
  
  setQuizMode: (mode) => set((state) => {
    const snap = takeSnapshot(state);
    if (!mode) {
      return { 
        quizMode: false, 
        activeStepId: state.steps[0].id,
        fields: state.fields.map(f => ({ ...f, stepId: state.steps[0].id })),
        isDirty: true,
        past: [...state.past, snap].slice(-MAX_HISTORY)
      };
    }
    return { quizMode: true, isDirty: true, past: [...state.past, snap].slice(-MAX_HISTORY) };
  }),

  // --- Step Management ---
  addStep: (stepLabel = 'Step', nextLabel = 'Next', prevLabel = 'Prev') => set((state) => {
    const snap = takeSnapshot(state);
    const newId = 'step_' + Math.random().toString(36).substr(2, 9);
    return {
      steps: [...state.steps, { id: newId, label: `${stepLabel} ${state.steps.length + 1}`, nextLabel, prevLabel }],
      activeStepId: newId,
      isDirty: true,
      past: [...state.past, snap].slice(-MAX_HISTORY)
    };
  }),

  removeStep: (id) => set((state) => {
    if (state.steps.length <= 1) return state; 
    const snap = takeSnapshot(state);
    const newSteps = state.steps.filter(s => s.id !== id);
    const newActiveId = state.activeStepId === id ? newSteps[newSteps.length - 1].id : state.activeStepId;
    const newFields = state.fields.filter(f => f.stepId !== id);
    return { steps: newSteps, activeStepId: newActiveId, fields: newFields, isDirty: true, past: [...state.past, snap].slice(-MAX_HISTORY) };
  }),

  updateStep: (id, updates) => set((state) => {
    const snap = takeSnapshot(state);
    return {
      steps: state.steps.map(s => s.id === id ? { ...s, ...updates } : s),
      isDirty: true,
      past: [...state.past, snap].slice(-MAX_HISTORY)
    };
  }),

  setActiveStepId: (id) => set({ activeStepId: id, selectedFieldId: null }),

  // --- Field Management ---
  addField: (type, insertIndex, initialLabel = null, defaultOptionLabel = 'Option') => set((state) => {
    const snap = takeSnapshot(state);
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      stepId: state.activeStepId,
      type,
      label: initialLabel || ('New ' + type),
      required: false,
      width: '100',
      enableAutocomplete: ['name', 'email', 'phone', 'url'].includes(type) ? true : undefined,
      options: ['dropdown', 'radio', 'checkbox', 'multiple_choice', 'image_radio'].includes(type) 
        ? [{ id: 'opt_1', label: `${defaultOptionLabel} 1`, value: `${defaultOptionLabel} 1` }] 
        : undefined
    };
    
    if (typeof insertIndex === 'number') {
      const stepFields = state.fields.filter(f => f.stepId === state.activeStepId);
      const otherFields = state.fields.filter(f => f.stepId !== state.activeStepId);
      const newStepFields = [...stepFields];
      newStepFields.splice(insertIndex, 0, newField);
      return { 
        fields: [...otherFields, ...newStepFields],
        selectedFieldId: newField.id,
        isDirty: true,
        past: [...state.past, snap].slice(-MAX_HISTORY)
      };
    }

    return { 
      fields: [...state.fields, newField],
      selectedFieldId: newField.id,
      isDirty: true,
      past: [...state.past, snap].slice(-MAX_HISTORY)
    };
  }),

  selectField: (id) => set({ selectedFieldId: id }),

  updateField: (id, updates) => set((state) => {
    const snap = takeSnapshot(state);
    return {
      fields: state.fields.map(f => f.id === id ? { ...f, ...updates } : f),
      isDirty: true,
      past: [...state.past, snap].slice(-MAX_HISTORY)
    };
  }),

  removeField: (id) => set((state) => {
    const snap = takeSnapshot(state);
    return {
      fields: state.fields.filter(f => f.id !== id),
      selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
      isDirty: true,
      past: [...state.past, snap].slice(-MAX_HISTORY)
    };
  }),

  moveField: (dragIndex, dropIndex) => set((state) => {
    const snap = takeSnapshot(state);
    const stepFields = state.fields.filter(f => f.stepId === state.activeStepId);
    const otherFields = state.fields.filter(f => f.stepId !== state.activeStepId);
    
    const newStepFields = [...stepFields];
    const [draggedItem] = newStepFields.splice(dragIndex, 1);
    newStepFields.splice(dropIndex, 0, draggedItem);
    
    return { fields: [...otherFields, ...newStepFields], isDirty: true, past: [...state.past, snap].slice(-MAX_HISTORY) };
  }),

  moveFieldUp: (id) => set((state) => {
    const stepFields = state.fields.filter(f => f.stepId === state.activeStepId);
    const indexInStep = stepFields.findIndex(f => f.id === id);
    if (indexInStep <= 0) return state; // Already at top or not found
    
    const snap = takeSnapshot(state);
    const otherFields = state.fields.filter(f => f.stepId !== state.activeStepId);
    const newStepFields = [...stepFields];
    
    const temp = newStepFields[indexInStep - 1];
    newStepFields[indexInStep - 1] = newStepFields[indexInStep];
    newStepFields[indexInStep] = temp;
    
    return { fields: [...otherFields, ...newStepFields], isDirty: true, past: [...state.past, snap].slice(-MAX_HISTORY) };
  }),

  // Load Schema logic: reconstruct steps if needed
  loadSchema: (schema, title, defaults = {}) => set((state) => {
    const isOldFormat = Array.isArray(schema) && schema.every(f => !f.stepId);
    if (isOldFormat) {
      const defaultStepId = 'step_1';
      return {
        formTitle: title || 'New Form',
        quizMode: false,
        formSettings: { accentColor: '#d4af37', maxWidth: '100%' },
        steps: [{ 
            id: defaultStepId, 
            label: defaults.stepLabel ? `${defaults.stepLabel} 1` : 'Step 1', 
            nextLabel: defaults.nextLabel || 'Next', 
            prevLabel: defaults.prevLabel || 'Prev' 
        }],
        activeStepId: defaultStepId,
        fields: schema.map(f => ({ ...f, stepId: defaultStepId })),
        selectedFieldId: null,
        past: []
      };
    }
    
    if (schema.steps && schema.fields) {
      return {
        formTitle: title || 'New Form',
        quizMode: !!schema.quizMode,
        formSettings: schema.formSettings || { accentColor: '#d4af37', maxWidth: '100%' },
        steps: schema.steps,
        activeStepId: schema.steps[0]?.id || 'step_1',
        fields: schema.fields,
        selectedFieldId: null,
        isDirty: false,
        past: []
      };
    }

    return {
      formTitle: title || 'Loaded Form',
      quizMode: !!schema.quizMode,
      formSettings: schema.formSettings || { accentColor: '#d4af37', maxWidth: '100%' },
      steps: schema.steps || [{ 
          id: 'step_1', 
          label: defaults.stepLabel ? `${defaults.stepLabel} 1` : 'Step 1', 
          nextLabel: defaults.nextLabel || 'Next', 
          prevLabel: defaults.prevLabel || 'Prev' 
      }],
      activeStepId: schema.steps ? schema.steps[0].id : 'step_1',
      fields: schema.fields || [],
      selectedFieldId: null,
      isDirty: false,
      past: []
    };
  })
}));
