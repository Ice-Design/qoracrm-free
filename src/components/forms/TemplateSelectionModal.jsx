import React, { useState } from 'react';
import { FileText, MessageSquare, ListTodo, ShoppingCart, Calendar, X, Mail, Lock } from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';
import { isPro } from '../../hooks/useFeature';
import { UpgradeModal } from '../common/ProBadge';

const getTemplateImageUrl = (filename) => {
  if (!filename) return null;
  if (window.qoraCrmData?.pluginUrl) {
    return `${window.qoraCrmData.pluginUrl}dist/templates/${filename}`;
  }
  return `/templates/${filename}`;
};

const getTemplates = (t) => [
  {
    id: 'blank',
    title: t('tpl_title_blank') || 'Blank Form',
    description: t('tpl_desc_blank') || 'Start completely from scratch',
    icon: FileText,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    requiresPro: false,
    schema: []
  },
  {
    id: 'contact',
    title: t('tpl_title_contact') || 'Contact Form',
    description: t('tpl_desc_contact') || 'Classic form with standard input fields for direct customer communication.',
    icon: Mail,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    image: 'contact.png',
    requiresPro: false,
    schema: [
      { id: 'f1', stepId: 'step_1', type: 'text', label: t('name_label') || 'First Name', placeholder: t('tpl_f_your_name') || 'Your name', required: true, width: '50' },
      { id: 'f2', stepId: 'step_1', type: 'email', label: t('email_label') || 'Email', placeholder: t('tpl_f_your_email') || 'Your email', required: true, width: '50' },
      { id: 'f3', stepId: 'step_1', type: 'phone', label: t('tpl_f_your_phone_label') || 'Your Phone', required: true, width: '100', useMask: true },
      { id: 'f4', stepId: 'step_1', type: 'textarea', label: t('message_label') || 'Message', placeholder: t('tpl_f_desc_request') || 'Describe your request...', required: false, width: '100' },
      { id: 'f5', stepId: 'step_1', type: 'consent', label: t('tpl_f_agree_personal_data') || 'I agree to the processing of personal data', required: true, width: '100' }
    ]
  },
  {
    id: 'leadgen',
    title: t('tpl_title_leadgen') || 'Lead Generation',
    description: t('tpl_desc_leadgen') || 'Compact, high-conversion layout designed to quickly capture user phone numbers.',
    icon: MessageSquare,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    image: 'leadgen.png',
    requiresPro: false,
    settings: { submitWidth: '33.333%' },
    schema: [
      { id: 'f1', stepId: 'step_1', type: 'text', label: t('tpl_f_your_name_label') || 'First Name', placeholder: 'Your Name', required: true, width: '33' },
      { id: 'f2', stepId: 'step_1', type: 'phone', label: t('tpl_f_your_phone_label') || 'Your Phone', required: true, width: '33', useMask: true }
    ]
  },
  {
    id: 'quiz',
    title: t('tpl_title_quiz') || 'Quiz Form',
    description: t('tpl_desc_quiz') || 'Interactive visual quiz using image choices and a sleek progress bar.',
    icon: ListTodo,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    image: 'quiz.png',
    requiresPro: true
  },
  {
    id: 'survey',
    title: t('tpl_title_survey') || 'Detailed Survey',
    description: t('tpl_desc_survey') || 'Detailed multi-step survey utilizing a tabbed navigation approach.',
    icon: ListTodo,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    image: 'survey.png',
    requiresPro: true
  },
  {
    id: 'booking',
    title: t('tpl_title_booking') || 'Booking / Appointment',
    description: t('tpl_desc_booking') || 'Advanced form with a repeater field to collect dynamic appointment details.',
    icon: Calendar,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    image: 'booking.png',
    requiresPro: true
  },
  {
    id: 'purchase',
    title: t('tpl_title_purchase') || 'Product Purchase',
    description: t('tpl_desc_purchase') || 'E-commerce ready form with product selection and quantity calculation.',
    icon: ShoppingCart,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    image: 'purchase.png',
    requiresPro: true
  }
];

export function TemplateSelectionModal({ onClose, onSelectTemplate }) {
  const { t } = useI18n();
  const templates = getTemplates(t);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: null });
  const isProActive = isPro;

  const handleCardClick = (tpl) => {
    if (tpl.requiresPro && !isProActive) {
      setUpgradeModal({ open: true, feature: tpl.title });
      return;
    }

    if (tpl.requiresPro) {
      const getProSchemas = window.QoraCRM?.getExtension?.('ProTemplateSchemas');
      const proSchemas = getProSchemas ? getProSchemas(t) : {};
      const fullTpl = { ...tpl, ...(proSchemas[tpl.id] || {}) };
      onSelectTemplate(fullTpl);
    } else {
      onSelectTemplate(tpl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('select_template_title') || 'Choose a starting template'}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('select_template_desc') || 'Start from a template or create a form from scratch'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh] bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(tpl => {
              const Icon = tpl.icon;
              const isLocked = tpl.requiresPro && !isProActive;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleCardClick(tpl)}
                  className="group relative border border-gray-200 rounded-xl hover:border-primary hover:shadow-xl transition-all cursor-pointer bg-white flex flex-col overflow-hidden"
                >
                  {isLocked && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-sm px-2.5 py-1.5 rounded-md text-[11px] font-bold text-yellow-600 flex items-center gap-1.5 z-10 border border-yellow-100">
                      <Lock size={12} strokeWidth={2.5} /> PRO
                    </div>
                  )}

                  <div className={`h-40 relative flex items-center justify-center border-b border-gray-100 overflow-hidden ${!tpl.image ? tpl.bg : 'bg-gray-50'}`}>
                    {tpl.image ? (
                      <div className="w-full h-full relative">
                        <img src={getTemplateImageUrl(tpl.image)} alt={tpl.title} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${tpl.bg} ${tpl.color} group-hover:scale-110 transition-transform duration-300 bg-white`}>
                        <Icon size={32} />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1.5">{t(`tpl_title_${tpl.id}`) || tpl.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{t(`tpl_desc_${tpl.id}`) || tpl.description}</p>
                  </div>

                  <div className="absolute inset-0 border-2 border-primary rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: null })}
        feature={upgradeModal.feature}
      />
    </div>
  );
}
