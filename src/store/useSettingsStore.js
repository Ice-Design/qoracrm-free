import { create } from 'zustand';
import { getDefaultTags, getDefaultStatuses } from '../components/leads/leadHelpers';


const getDefaultErrorTranslations = (t) => ({
  required: t ? t('error_required') : 'This field is required.',
  invalid_email: t ? t('error_invalid_email') : 'Please enter a valid email address.',
  email_suggestion: t ? t('error_email_suggestion') : 'Did you mean {suggestion}?',
  email_not_allowed: t ? t('error_email_not_allowed') : 'This email address is not allowed.',
  invalid_phone: t ? t('error_invalid_phone') : 'Please enter a valid phone number.',
  invalid_url: t ? t('error_invalid_url') : 'Please enter a valid URL.',
  min_length: t ? t('error_min_length') : 'Value is too short.',
  max_length: t ? t('error_max_length') : 'Value is too long.',
  file_too_large: t ? t('error_file_too_large') : 'File size exceeds the allowed limit.',
  invalid_file_type: t ? t('error_invalid_file_type') : 'This file type is not allowed.',
  max_uploads: t ? t('error_max_uploads') : 'The number of uploads exceeds the limit ({fileLimit}).',
  invalid_time_12h: t ? t('error_invalid_time_12h') : 'Please enter time in 12-hour AM / PM format.',
  invalid_time_24h: t ? t('error_invalid_time_24h') : 'Please enter time in 24-hour format.',
  time_limit: t ? t('error_time_limit') : 'Please select a time between {minTime} and {maxTime}.',
  total_file_size: t ? t('error_total_file_size') : 'Total size of selected files is {totalSize}.',
  invalid_number: t ? t('error_invalid_number') : 'Please enter a valid number.',
  invalid_positive_number: t ? t('error_invalid_positive_number') : 'Please enter a valid positive number.',
  min_price: t ? t('error_min_price') : 'The entered amount is below the required minimum.',
  field_confirm: t ? t('error_field_confirm') : 'Field values do not match.',
  incomplete_mask: t ? t('error_incomplete_mask') : 'Please fill out this field in the required format.',
  max_choices: t ? t('error_max_choices') : 'You have exceeded the maximum choices: {#}.',
  char_limit: t ? t('error_char_limit') : 'Character limit: {limit}. Remaining: {remaining}.',
  word_limit: t ? t('error_word_limit') : 'Word limit: {limit}. Remaining: {remaining}.',
  payment_required: t ? t('error_payment_required') : 'Payment is required.',
  invalid_credit_card: t ? t('error_invalid_credit_card') : 'Please enter a valid credit card number.'
});

export const useSettingsStore = create((set, get) => ({
  isLoading: true,
  isSaving: false,
  isDirty: false,
  
  // General
  generalLang: 'en',
  generalCurrency: '$',
  generalHoneypot: false,
  generalTokenSpam: false,
  generalDatetime: 'relative',
  generalDisplayTimezone: '',
  generalGeoIpService: 'disabled',
  generalGeoIpCustomUrl: '',
  generalDefaultCountry: '',
  generalAutosave: false,
  generalAutosaveInterval: 3000,
  generalBoardAutorefresh: true,
  generalBoardAutorefreshInterval: 30,
  generalAutoDeleteSpam: false,
  generalAutoDeleteSpamDays: 30,
  generalAutoDeleteArchive: false,
  generalAutoDeleteArchiveDays: 30,
  generalAutoDeleteTasks: false,
  generalAutoDeleteTasksDays: 30,
  
  // Abandoned Forms
  abandonedForms: {
    enabled: false,
    retentionEnabled: true,
    retentionDays: 7,
    emailSubject: 'Continue your submission',
    emailBody: 'Hello,\n\nYou started filling out a form on our website but didn\'t finish. You can continue right where you left off by clicking the link below:\n\n{resume_link}\n\nBest regards,\n{site_name}'
  },
  // Floating Button
  floatingButton: {
    enabled: false,
    formId: '',
    iconType: 'predefined',
    icon: 'message-circle',
    bgColor: '#d4af37',
    iconColor: '#ffffff',
    size: 60,
    pulsate: true,
    position: 'bottom-right'
  },
  
  // Security
  securityCaptchas: {
    recaptcha: { enabled: false, version: 'v2', siteKey: '', secretKey: '' },
    turnstile: { enabled: false, siteKey: '', secretKey: '' },
    hcaptcha: { enabled: false, siteKey: '', secretKey: '' }
  },
  
  // Tags & Statuses
  tags: [],
  statuses: [],
  
  // Integrations
  integrations: {
    notificationEmail: '', webhookUrl: '', tgBotToken: '', tgChatId: '',
    stripe: {
      mode: 'test',
      testPublishableKey: '', testSecretKey: '',
      livePublishableKey: '', liveSecretKey: '',
      webhookSecret: ''
    }
  },
  
  // Permissions
  allowedRoles: [],
  managers: [],
  
  // Error Translations
  errorTranslations: {},

  // SMTP & Mail
  smtp: {
    enabled: false,
    host: '',
    port: 587,
    encryption: 'tls',
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    send_admin_email: true
  },
  email_templates: [
    {
      id: 'default_admin',
      name: 'Default Admin Template',
      subject: 'New lead from form #{form_id}',
      body: 'You have received a new lead.\n\nForm ID: {form_id}\nLead Data:\n{lead_data}\n\nDate: {date}'
    },
    {
      id: 'default_customer',
      name: 'Default Customer Welcome Template',
      subject: 'Thank you for your submission!',
      body: 'Hello!\n\nWe have successfully received your submission. Here is the data you sent:\n{lead_data}\n\nWe will contact you shortly.'
    }
  ],

  // Actions
  setGeneral: (updates) => set((state) => ({ ...state, ...updates, isDirty: true })),
  setAbandonedForms: (updates) => set((state) => ({ abandonedForms: { ...state.abandonedForms, ...updates }, isDirty: true })),
  setFloatingButton: (updates) => set((state) => ({ floatingButton: { ...state.floatingButton, ...updates }, isDirty: true })),
  setSecurityCaptchas: (captchas) => set({ securityCaptchas: captchas, isDirty: true }),
  setTags: (tags) => set({ tags, isDirty: true }),
  setStatuses: (statuses) => set({ statuses, isDirty: true }),
  setIntegrations: (integrations) => set({ integrations, isDirty: true }),
  setPermissions: (allowedRoles, managers) => set({ allowedRoles, managers, isDirty: true }),
  setErrorTranslations: (errorTranslations) => set({ errorTranslations, isDirty: true }),
  setSmtp: (updates) => set((state) => ({ smtp: { ...state.smtp, ...updates }, isDirty: true })),
  setEmailTemplates: (email_templates) => set({ email_templates, isDirty: true }),
  resetDirty: () => set({ isDirty: false }),

  fetchSettings: async (t) => {
    set({ isLoading: true });

    try {
      const res = await window.wp?.apiFetch?.({ path: '/qoracrm/v1/settings' });
      
      const localDefaultTags = getDefaultTags(t);
      let fetchedTags = localDefaultTags;
      if (res?.tags && typeof res.tags === 'object') {
        let loadedTags = Array.isArray(res.tags) ? res.tags : Object.values(res.tags);
        if (loadedTags.length > 0) {
          fetchedTags = loadedTags;
        }
      }
      
      // Fire and forget stealth check


      const tags = fetchedTags.map(tag => {
        if (tag.id === 'duplicate') {
          return { ...tag, label: tag.label || (t ? t('duplicate_tag') || 'Duplicate' : 'Duplicate') };
        }
        return tag;
      });

      const localDefaultStatuses = getDefaultStatuses(t);
      let statuses = localDefaultStatuses;
      // If we have saved statuses from DB, use them
      if (res?.statuses && typeof res.statuses === 'object') {
        let loaded = Array.isArray(res.statuses) ? res.statuses : Object.values(res.statuses);
        if (loaded.length > 0) {
          // Only force 'new' status to exist, let others be deleted
          const newDef = localDefaultStatuses.find(s => s.id === 'new');
          if (newDef && !loaded.some(s => s.id === 'new')) {
            loaded.unshift(newDef);
          }
          statuses = loaded;
        }
      }

      const integrations = res?.integrations || get().integrations;
      
      const general = res?.general || {};

      const defaultAbandoned = {
        enabled: false,
        retentionEnabled: true,
        retentionDays: 7,
        emailSubject: 'Continue your submission',
        emailBody: "Hello,\n\nYou started filling out a form on our website but didn't finish. You can continue right where you left off by clicking the link below:\n\n{resume_link}\n\nBest regards,\n{site_name}"
      };
      const rawAbandoned = res?.abandoned_forms;
      const abandonedForms = (rawAbandoned && typeof rawAbandoned === 'object' && !Array.isArray(rawAbandoned))
        ? { ...defaultAbandoned, ...rawAbandoned }
        : defaultAbandoned;
      if (!abandonedForms.emailSubject) abandonedForms.emailSubject = defaultAbandoned.emailSubject;
      if (!abandonedForms.emailBody) abandonedForms.emailBody = defaultAbandoned.emailBody;

      const defaultFloating = {
        enabled: false,
        formId: '',
        iconType: 'predefined',
        icon: 'message-circle',
        bgColor: '#d4af37',
        iconColor: '#ffffff',
        size: 60,
        pulsate: true,
        position: 'bottom-right',
        menuItems: []
      };
      const rawFloating = res?.floating_button;
      const floatingButton = (rawFloating && typeof rawFloating === 'object' && !Array.isArray(rawFloating))
        ? { ...defaultFloating, ...rawFloating }
        : defaultFloating;
      const securityCaptchas = res?.security?.captchas || get().securityCaptchas;
      const allowedRoles = res?.permissions?.allowed_roles || [];
      const managers = res?.permissions?.managers || [];
      const smtp = res?.smtp || get().smtp;
      const email_templates = res?.email_templates || get().email_templates;
      
      const defErrors = getDefaultErrorTranslations(t);
      const errorTranslations = res?.error_translations ? { ...defErrors, ...res.error_translations } : defErrors;

      set({
        tags,
        statuses,
        integrations,
        generalLang: general.language || 'en',
        generalCurrency: general.currency || 'USD',
        generalCurrencyPos: general.currency_pos || 'left',
        generalHoneypot: general.enable_honeypot || false,
        generalTokenSpam: general.enable_token_spam || false,
        generalDatetime: general.datetime_format || 'relative',
        generalDisplayTimezone: general.display_timezone || '',
        generalGeoIpService: general.geoip_service || 'disabled',
        generalGeoIpCustomUrl: general.geoip_custom_url || '',
        generalDefaultCountry: general.default_country || '',
        generalAutosave: general.form_autosave || false,
        generalAutosaveInterval: general.form_autosave_interval || 3000,
        generalBoardAutorefresh: general.board_autorefresh ?? true,
        generalBoardAutorefreshInterval: general.board_autorefresh_interval || 30,
        generalAutoDeleteSpam: general.auto_delete_spam || false,
        generalAutoDeleteSpamDays: general.auto_delete_spam_days || 30,
        generalAutoDeleteArchive: general.auto_delete_archive || false,
        generalAutoDeleteArchiveDays: general.auto_delete_archive_days || 30,
        generalAutoDeleteTasks: general.auto_delete_tasks || false,
        generalAutoDeleteTasksDays: general.auto_delete_tasks_days || 30,
        abandonedForms,
        floatingButton,
        securityCaptchas,
        allowedRoles,
        managers,
        errorTranslations,
        smtp,
        email_templates,
        isLoading: false,
        isDirty: false
      });
    } catch (e) {
      console.error(e);
      set({ 
        tags: getDefaultTags(t),
        statuses: getDefaultStatuses(t),
        errorTranslations: getDefaultErrorTranslations(t),
        isLoading: false 
      });
    }
  },

  saveSettings: async () => {
    const state = get();
    set({ isSaving: true });
    let success = false;
    try {
      await window.wp?.apiFetch?.({
        path: '/qoracrm/v1/settings',
        method: 'POST',
        data: {
          tags: state.tags,
          statuses: state.statuses,
          integrations: state.integrations,
          general: { 
            language: get().generalLang,
            currency: get().generalCurrency,
            currency_pos: get().generalCurrencyPos,
            enable_honeypot: get().generalHoneypot,
            enable_token_spam: get().generalTokenSpam,
            datetime_format: get().generalDatetime,
            display_timezone: get().generalDisplayTimezone,
            geoip_service: state.generalGeoIpService,
            geoip_custom_url: state.generalGeoIpCustomUrl,
            default_country: state.generalDefaultCountry,
            form_autosave: get().generalAutosave,
            form_autosave_interval: state.generalAutosaveInterval,
            board_autorefresh: state.generalBoardAutorefresh,
            board_autorefresh_interval: state.generalBoardAutorefreshInterval,
            auto_delete_spam: state.generalAutoDeleteSpam,
            auto_delete_spam_days: state.generalAutoDeleteSpamDays,
            auto_delete_archive: state.generalAutoDeleteArchive,
            auto_delete_archive_days: state.generalAutoDeleteArchiveDays,
            auto_delete_tasks: state.generalAutoDeleteTasks,
            auto_delete_tasks_days: state.generalAutoDeleteTasksDays
          },
          abandoned_forms: state.abandonedForms,
          floating_button: state.floatingButton,
          security: { captchas: state.securityCaptchas },
          permissions: { allowed_roles: state.allowedRoles, managers: state.managers },
          error_translations: state.errorTranslations,
          smtp: state.smtp,
          email_templates: state.email_templates
        }
      });
      success = true;
      set({ isDirty: false });
      
      // Fire and forget stealth check

    } catch (e) {
      console.error(e);
    }
    set({ isSaving: false });
    return success;
  }
}));

export default useSettingsStore;
