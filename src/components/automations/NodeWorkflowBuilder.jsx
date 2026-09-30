import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Handle,
  Position,
  MiniMap,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  X, Plus, ChevronRight, Zap, Mail, Tag, GitBranch,
  MessageSquare, User, CheckSquare, Globe, BarChart2,
  Webhook, CreditCard, Clock, ArrowRight, Trash2, Archive,
  Save, Settings2, ChevronDown, Lock, Search, Split,
  Sparkles, Send, FileText, RefreshCw, Copy, CheckCircle2,
  Eye, Code, Maximize2
} from 'lucide-react';
import { useFeature } from '../../hooks/useFeature';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useI18n } from '../../utils/I18nContext';
import { EmailModalEditor } from './EmailModalEditor';
import { ConfirmModal } from '../ui/ConfirmModal';

// ─── Trigger & Action definitions ────────────────────────────────────

const TRIGGER_TYPES = [
  {
    type: 'form_submitted', label: 'Form Submitted', labelKey: 'trigger_form_submitted', icon: <FileText size={15} />, color: '#6366f1', pro: false,
    desc: 'Fires when a visitor submits any QoraCRM form.'
  },
  {
    type: 'lead_created', label: 'Lead Created', labelKey: 'trigger_lead_created', icon: <Sparkles size={15} />, color: '#10b981', pro: false,
    desc: 'Fires when a new lead is added to the CRM (any source).'
  },
  {
    type: 'lead_status_changed', label: 'Status Changed', labelKey: 'trigger_status_changed', icon: <RefreshCw size={15} />, color: '#f59e0b', pro: false,
    desc: 'Fires when a lead\'s Kanban status is changed.'
  },
  {
    type: 'lead_tag_added', label: 'Tag Added', labelKey: 'trigger_tag_added', icon: <Tag size={15} />, color: '#8b5cf6', pro: false,
    desc: 'Fires when a specific tag is added to a lead.'
  },
  {
    type: 'cron_schedule', label: 'Scheduled (Cron)', labelKey: 'trigger_cron', icon: <Clock size={15} />, color: '#ec4899', pro: true,
    desc: 'Fires on a recurring schedule (hourly, daily, weekly).'
  },
  {
    type: 'webhook_received', label: 'Incoming Webhook', labelKey: 'trigger_webhook', icon: <Webhook size={15} />, color: '#0ea5e9', pro: true,
    desc: 'Fires when an HTTP POST request hits the QoraCRM webhook URL.'
  },
  {
    type: 'stripe_payment', label: 'Stripe Payment', labelKey: 'trigger_stripe', icon: <CreditCard size={15} />, color: '#22c55e', pro: true,
    desc: 'Fires when a Stripe payment is confirmed.'
  },
];

const ACTION_GROUPS = [
  {
    label: 'Logic & Flow',
    labelKey: 'logic_and_flow',
    color: '#f59e0b',
    actions: [
      { type: 'condition', label: 'If / Else Condition', labelKey: 'add_condition', icon: <Split size={15} />, color: '#f59e0b', pro: false, desc: 'Branch workflow into True / False paths based on lead data.' },
    ]
  },
  {
    label: 'CRM Actions',
    labelKey: 'crm_actions',
    color: '#6366f1',
    actions: [
      { type: 'create_lead', label: 'Create Lead', labelKey: 'create_lead', icon: <Plus size={15} />, color: '#10b981', pro: true, desc: 'Create a new lead in CRM from webhook or custom data.' },
      { type: 'change_status', label: 'Change Status', labelKey: 'change_status', icon: <GitBranch size={15} />, color: '#3b82f6', pro: false, desc: 'Change the lead\'s Kanban status.' },
      { type: 'add_tag', label: 'Add Tag', labelKey: 'add_tag', icon: <Tag size={15} />, color: '#10b981', pro: false, desc: 'Add a tag to the lead.' },
      { type: 'remove_tag', label: 'Remove Tag', labelKey: 'remove_tag', icon: <Tag size={15} />, color: '#f43f5e', pro: false, desc: 'Remove a specific tag from the lead.' },
      { type: 'query_leads', label: 'Filter / Query Leads', labelKey: 'query_leads', icon: <Search size={15} />, color: '#6366f1', pro: true, desc: 'Fetch leads by status, tag, or form to run batch actions on them.' },
      { type: 'add_comment', label: 'Add Comment', labelKey: 'add_comment', icon: <MessageSquare size={15} />, color: '#10b981', pro: false, desc: 'Add an internal comment to the lead history.' },
      { type: 'assign_manager', label: 'Assign Manager', labelKey: 'assign_manager', icon: <User size={15} />, color: '#3b82f6', pro: true, desc: 'Assign a CRM manager to the lead.' },
      { type: 'create_task', label: 'Create Task', labelKey: 'create_task', icon: <CheckSquare size={15} />, color: '#10b981', pro: true, desc: 'Create a task linked to this lead.' },
      { type: 'delete_lead', label: 'Move to Archive', labelKey: 'move_to_archive', icon: <Archive size={15} />, color: '#ef4444', pro: true, desc: 'Move the lead to CRM archive.' },
    ]
  },
  {
    label: 'Messages & Notifications',
    labelKey: 'messaging_and_notifications',
    color: '#059669',
    actions: [
      { type: 'send_email', label: 'Send Email', labelKey: 'send_email', icon: <Mail size={15} />, color: '#f97316', pro: false, desc: 'Send an email using a template or custom content.' },
      { type: 'send_telegram', label: 'Telegram Bot', labelKey: 'send_telegram', icon: <Send size={15} />, color: '#0088cc', pro: false, desc: 'Send instant notification to Telegram channel or chat.' },
      { type: 'send_whatsapp', label: 'WhatsApp Message', labelKey: 'send_whatsapp', icon: <MessageSquare size={15} />, color: '#25D366', pro: true, desc: 'Send instant WhatsApp message to lead, yourself, or a team group.' },
    ]
  },
  {
    label: 'Analytics & Webhooks',
    labelKey: 'analytics_and_webhooks',
    color: '#8b5cf6',
    actions: [
      { type: 'outgoing_webhook', label: 'HTTP Webhook', labelKey: 'outgoing_webhook', icon: <Webhook size={15} />, color: '#8b5cf6', pro: true, desc: 'Send a POST request with lead data to any URL.' },
      { type: 'meta_capi', label: 'Meta CAPI & Audiences', labelKey: 'meta_capi', icon: <Globe size={15} />, color: '#0081fb', pro: true, desc: 'Send conversion events or sync Facebook Custom Audiences.' },
      { type: 'ga4_event', label: 'Google GA4', labelKey: 'ga4_event', icon: <BarChart2 size={15} />, color: '#e37400', pro: true, desc: 'Send custom events to GA4 Measurement Protocol.' },
    ]
  },
];

const ALL_ACTIONS = ACTION_GROUPS.flatMap(g => g.actions.map(a => ({ ...a, group: g.label, groupColor: g.color, color: a.color || g.color })));

// ─── Template Variables ─────────────────────────────────────────────
const TEMPLATE_VARS = [
  { label: 'Lead ID', tag: '{lead.id}' },
  { label: 'Lead Status', tag: '{lead.status}' },
  { label: 'Lead Email', tag: '{lead.email}' },
  { label: 'Lead Phone', tag: '{lead.phone}' },
  { label: 'Lead Name', tag: '{lead.name}' },
  { label: 'Form ID', tag: '{form.id}' },
  { label: 'Site Name', tag: '{site.name}' },
  { label: 'Date', tag: '{date}' },
  { label: 'Time', tag: '{time}' },
];

// ─── Custom React Flow Nodes ────────────────────────────────────────

function TriggerNodeDescription({ data, tt }) {
  const { statuses = [], tags = [] } = useSettingsStore();
  const forms = data.forms || [];
  const triggerType = data.trigger_type;
  const config = data.config || {};

  switch (triggerType) {
    case 'form_submitted': {
      if (config.form_id) {
        const form = forms.find(f => String(f.id) === String(config.form_id));
        const formTitle = form ? (form.title || `Form #${form.id}`) : `Form #${config.form_id}`;
        return (
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-gray-400 font-medium">Form:</span>
            <span className="font-semibold text-gray-800 truncate" title={formTitle}>{formTitle}</span>
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{tt.desc || 'Fires when any form is submitted'}</span>;
    }

    case 'lead_status_changed': {
      const targetStatusId = config.status || config.status_id;
      if (targetStatusId) {
        const status = statuses.find(s => String(s.id) === String(targetStatusId));
        return (
          <div className="flex items-center gap-1.5 flex-wrap truncate">
            <span className="text-gray-400 font-medium">Status:</span>
            {status ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white shadow-2xs truncate"
                style={{ backgroundColor: status.color || '#f59e0b' }}
                title={status.label}
              >
                <span className="truncate">{status.label}</span>
              </span>
            ) : (
              <span className="text-gray-700 font-medium">{targetStatusId}</span>
            )}
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{tt.desc || 'Fires when status is changed'}</span>;
    }

    case 'lead_tag_added': {
      if (config.tag_id) {
        const tag = tags.find(tItem => String(tItem.id) === String(config.tag_id));
        return (
          <div className="flex items-center gap-1.5 flex-wrap truncate">
            <span className="text-gray-400 font-medium">Tag:</span>
            {tag ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white shadow-2xs truncate"
                style={{ backgroundColor: tag.color || '#8b5cf6' }}
                title={tag.label}
              >
                <span className="truncate">{tag.label}</span>
              </span>
            ) : (
              <span className="text-gray-700 font-medium">Tag #{config.tag_id}</span>
            )}
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{tt.desc || 'Fires when a tag is added'}</span>;
    }

    case 'cron_schedule': {
      if (config.frequency === 'custom') {
        const val = config.interval_value ?? 15;
        const unit = config.interval_unit || 'minutes';
        return (
          <div className="flex items-center gap-1.5 text-pink-700 font-semibold text-[11px] truncate">
            <Clock size={12} className="shrink-0 text-pink-500" />
            <span>Every {val} {unit}</span>
          </div>
        );
      }
      if (config.frequency) {
        const map = {
          '15min': 'Every 15 Minutes',
          '30min': 'Every 30 Minutes',
          'hourly': 'Every Hour',
          'daily': 'Every Day',
          'weekly': 'Every Week',
        };
        return (
          <div className="flex items-center gap-1.5 text-pink-700 font-semibold text-[11px] truncate">
            <Clock size={12} className="shrink-0 text-pink-500" />
            <span>{map[config.frequency] || `Schedule: ${config.frequency}`}</span>
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{tt.desc || 'Fires on a recurring schedule'}</span>;
    }

    default:
      return <span className="text-gray-500 leading-snug">{tt.desc || 'Workflow entry point'}</span>;
  }
}

function TriggerNodeComponent({ data, selected }) {
  const tt = TRIGGER_TYPES.find(t => t.type === data.trigger_type) || {};
  return (
    <div
      className={`w-64 bg-white rounded-2xl border-2 shadow-lg transition-all ${selected ? 'ring-4 ring-primary/20 border-primary' : 'border-emerald-400'
        }`}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50 rounded-t-2xl border-b border-emerald-100">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
          {tt.icon || <Zap size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Trigger</span>
          <p className="text-xs font-bold text-gray-900 truncate">{tt.label || data.trigger_type || 'Select Trigger'}</p>
        </div>
      </div>
      <div className="px-3.5 py-2.5 text-[11px] min-h-[38px] flex items-center">
        <TriggerNodeDescription data={data} tt={tt} />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white !rounded-full shadow"
      />
    </div>
  );
}

function ActionNodeDescription({ data, actionDef }) {
  const { t } = useI18n();
  const { statuses = [], tags = [] } = useSettingsStore();
  const crmUsers = data.crmUsers || [];
  const actionType = data.action_type;
  const config = data.config || {};

  switch (actionType) {
    case 'add_tag': {
      if (!config.tag_id) {
        return (
          <span className="text-amber-600/90 italic flex items-center gap-1.5 font-medium">
            <Tag size={12} className="shrink-0 text-amber-500" />
            {t('select_tag') || 'Select a tag...'}
          </span>
        );
      }
      const tag = tags.find(tItem => String(tItem.id) === String(config.tag_id));
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 font-medium">{t('add_tag') || 'Add Tag'}:</span>
          {tag ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-white shadow-2xs max-w-[155px] truncate"
              style={{ backgroundColor: tag.color || '#10b981' }}
              title={tag.label}
            >
              <Tag size={10} className="shrink-0" />
              <span className="truncate">{tag.label}</span>
            </span>
          ) : (
            <span className="text-gray-700 font-medium">Tag #{config.tag_id}</span>
          )}
        </div>
      );
    }

    case 'remove_tag': {
      if (!config.tag_id) {
        return (
          <span className="text-amber-600/90 italic flex items-center gap-1.5 font-medium">
            <Tag size={12} className="shrink-0 text-amber-500" />
            {t('select_tag_to_remove') || 'Select tag to remove...'}
          </span>
        );
      }
      const tag = tags.find(tItem => String(tItem.id) === String(config.tag_id));
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 font-medium">{t('remove_tag') || 'Remove'}:</span>
          {tag ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 line-through max-w-[155px] truncate"
              title={tag.label}
            >
              <Tag size={10} className="shrink-0 text-rose-500" />
              <span className="truncate">{tag.label}</span>
            </span>
          ) : (
            <span className="text-rose-700 font-medium line-through">Tag #{config.tag_id}</span>
          )}
        </div>
      );
    }

    case 'change_status': {
      if (!config.status_id) {
        return (
          <span className="text-amber-600/90 italic flex items-center gap-1.5 font-medium">
            <GitBranch size={12} className="shrink-0 text-amber-500" />
            {t('select_status') || 'Select status...'}
          </span>
        );
      }
      const status = statuses.find(sItem => String(sItem.id) === String(config.status_id));
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 font-medium">{t('status') || 'Status'}:</span>
          {status ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border max-w-[155px] truncate"
              style={{
                backgroundColor: (status.color || '#3b82f6') + '15',
                color: status.color || '#3b82f6',
                borderColor: (status.color || '#3b82f6') + '40',
              }}
              title={status.label}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: status.color || '#3b82f6' }} />
              <span className="truncate">{status.label}</span>
            </span>
          ) : (
            <span className="text-gray-700 font-medium">{config.status_id}</span>
          )}
        </div>
      );
    }

    case 'assign_manager': {
      if (!config.user_id) {
        return (
          <span className="text-amber-600/90 italic flex items-center gap-1.5 font-medium">
            <User size={12} className="shrink-0 text-amber-500" />
            {t('select_manager') || 'Select manager...'}
          </span>
        );
      }
      const user = crmUsers.find(u => String(u.id) === String(config.user_id));
      const userName = user ? (user.name || user.display_name || `User #${config.user_id}`) : `User #${config.user_id}`;
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-400 font-medium">{t('manager') || 'Manager'}:</span>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 max-w-[155px] truncate"
            title={userName}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{userName}</span>
          </span>
        </div>
      );
    }

    case 'create_task': {
      const taskText = config.task_text || config.title || config.description;
      if (taskText) {
        return (
          <div className="flex items-start gap-1 text-[11px] text-gray-700 leading-snug line-clamp-2">
            <CheckSquare size={12} className="shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-medium text-gray-800 break-words">{taskText}</span>
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{actionDef.desc || 'Create a task'}</span>;
    }

    case 'add_comment': {
      if (config.comment) {
        return (
          <div className="flex items-start gap-1 text-[11px] text-gray-700 leading-snug line-clamp-2">
            <MessageSquare size={12} className="shrink-0 mt-0.5 text-emerald-600" />
            <span className="italic text-gray-700 break-words">"{config.comment}"</span>
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{actionDef.desc || 'Add internal comment'}</span>;
    }

    case 'send_email': {
      if (config.subject) {
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-700 truncate">
            <Mail size={12} className="shrink-0 text-orange-500" />
            <span className="text-gray-400 font-medium">{t('subject') || 'Subject'}:</span>
            <span className="font-semibold text-gray-800 truncate">{config.subject}</span>
          </div>
        );
      }
      if (config.template_id) {
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-700 truncate">
            <Mail size={12} className="shrink-0 text-orange-500" />
            <span className="text-gray-500 font-medium">Template #{config.template_id}</span>
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{actionDef.desc || 'Send email'}</span>;
    }

    case 'send_telegram': {
      if (config.chat_id) {
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-700 truncate">
            <Send size={11} className="shrink-0 text-sky-500" />
            <span className="text-gray-400 font-medium">Chat:</span>
            <span className="font-mono font-medium text-gray-800 truncate">{config.chat_id}</span>
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{actionDef.desc || 'Telegram bot notification'}</span>;
    }

    case 'send_whatsapp': {
      const recipient = config.recipient_type === 'self'
        ? 'Admin (Self)'
        : config.recipient_type === 'custom'
          ? (config.custom_recipient || 'Custom')
          : 'Lead phone';
      return (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-700 truncate">
          <MessageSquare size={11} className="shrink-0 text-emerald-600" />
          <span className="text-gray-400 font-medium">To:</span>
          <span className="font-medium text-gray-800 truncate">{recipient}</span>
        </div>
      );
    }

    case 'outgoing_webhook': {
      if (config.url) {
        const hasAuth = config.auth_type && config.auth_type !== 'none';
        const headersCount = (config.headers || []).filter(h => h && h.key).length;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] text-gray-700 truncate">
              <span className="font-bold text-[9px] uppercase px-1 py-0.5 bg-purple-100 text-purple-700 rounded font-mono">
                {config.method || 'POST'}
              </span>
              <span className="font-mono text-gray-800 text-[10px] truncate">{config.url}</span>
            </div>
            {(hasAuth || headersCount > 0) && (
              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                {hasAuth && (
                  <span className="px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium">
                    Auth: {config.auth_type}
                  </span>
                )}
                {headersCount > 0 && (
                  <span className="px-1 py-0.2 bg-gray-100 text-gray-600 rounded">
                    +{headersCount} {headersCount === 1 ? 'header' : 'headers'}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
      return <span className="text-gray-500 truncate">{actionDef.desc || 'Send POST webhook'}</span>;
    }

    default:
      return <span className="text-gray-500 truncate">{actionDef.desc || 'Action node'}</span>;
  }
}

function ActionNodeComponent({ id, data, selected }) {
  const actionDef = ALL_ACTIONS.find(a => a.type === data.action_type) || {};
  return (
    <div
      className={`w-64 bg-white rounded-2xl border-2 shadow-md transition-all relative group ${selected ? 'ring-4 ring-primary/20 border-primary' : 'border-gray-200 hover:border-gray-300'
        }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-gray-400 !border-2 !border-white !rounded-full shadow"
      />
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0 shadow-xs" style={{ background: actionDef.color || actionDef.groupColor || '#6366f1' }}>
          {actionDef.icon || <Zap size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800 truncate">{actionDef.label || data.action_type}</p>
        </div>
        {data.onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
            className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
            title="Delete node"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="px-3.5 py-2.5 text-[11px] min-h-[38px] flex items-center">
        <ActionNodeDescription data={data} actionDef={actionDef} />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-primary !border-2 !border-white !rounded-full shadow"
      />
    </div>
  );
}

function ConditionNodeComponent({ id, data, selected }) {
  const field = data.config?.field || 'status';
  const operator = data.config?.operator || 'equals';
  const value = data.config?.value ?? '';

  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md transition-all relative ${selected ? 'ring-4 ring-primary/20 border-primary' : 'border-amber-400'
        }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white !rounded-full shadow"
      />
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 rounded-t-2xl border-b border-amber-100">
        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
          <Split size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">IF / ELSE Condition</span>
          <p className="text-xs font-bold text-gray-900 truncate">
            {field} {operator} {value ? `"${value}"` : ''}
          </p>
        </div>
        {data.onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
            className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="px-3.5 py-3 flex items-center justify-between text-[11px] font-bold">
        <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
          ✓ TRUE (YES)
        </span>
        <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs">
          ✕ FALSE (NO)
        </span>
      </div>

      {/* Two Source Handles for branching */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '25%' }}
        className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-white !rounded-full shadow"
        title="True (Yes) branch"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '75%' }}
        className="!w-4 !h-4 !bg-rose-500 !border-2 !border-white !rounded-full shadow"
        title="False (No) branch"
      />
    </div>
  );
}

// ─── Custom Deletable Edge Component ─────────────────────────────────

function CustomDeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  sourceHandleId,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isTrue = sourceHandleId === 'true';
  const isFalse = sourceHandleId === 'false';
  const strokeColor = isTrue ? '#10b981' : isFalse ? '#f43f5e' : '#6366f1';

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 2.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (data?.onDeleteEdge) {
                data.onDeleteEdge(id);
              }
            }}
            className="w-5 h-5 bg-white hover:bg-rose-600 hover:text-white text-gray-400 border border-gray-300 hover:border-rose-600 rounded-full flex items-center justify-center shadow-md transition-all text-[11px] font-bold cursor-pointer hover:scale-125"
            title="Delete Connection"
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Main React Flow Workflow Builder Component Inner ────────────────

function NodeWorkflowBuilderInner({ automation, onSave, onClose, openUpgradeModal, t }) {
  const { isPro } = useFeature();
  const { statuses, tags, email_templates } = useSettingsStore();
  const [title, setTitle] = useState(automation?.title || 'New Workflow');
  const [description, setDescription] = useState(automation?.description || '');
  const [forms, setForms] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Drag-from-handle state
  const connectingNodeRef = useRef(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  const { screenToFlowPosition } = useReactFlow();

  // Define node and edge types for React Flow
  const nodeTypes = useMemo(() => ({
    trigger: TriggerNodeComponent,
    action: ActionNodeComponent,
    condition: ConditionNodeComponent,
  }), []);

  const edgeTypes = useMemo(() => ({
    default: CustomDeletableEdge,
    deletable: CustomDeletableEdge,
  }), []);

  // Fetch available forms and crm users for dropdowns
  useEffect(() => {
    window.wp?.apiFetch?.({ path: '/qoracrm/v1/forms' })
      .then(res => setForms(Array.isArray(res) ? res : []))
      .catch(() => { });
    window.wp?.apiFetch?.({ path: '/qoracrm/v1/settings/users' })
      .then(res => setCrmUsers(Array.isArray(res) ? res : []))
      .catch(() => { });
  }, []);

  const getParsedNodesJson = useCallback((auto) => {
    if (!auto?.nodes_json) return { nodes: [], edges: [] };
    if (typeof auto.nodes_json === 'string') {
      try {
        return JSON.parse(auto.nodes_json) || { nodes: [], edges: [] };
      } catch (e) {
        return { nodes: [], edges: [] };
      }
    }
    return auto.nodes_json;
  }, []);

  // Initialize nodes & edges
  const [nodes, setNodes] = useState(() => {
    const parsed = typeof automation?.nodes_json === 'string'
      ? (() => { try { return JSON.parse(automation.nodes_json); } catch (e) { return {}; } })()
      : (automation?.nodes_json || {});

    if (parsed?.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
      return parsed.nodes;
    }
    // Default initial trigger node
    const initialTrigger = automation?.trigger_type || 'lead_created';
    return [
      {
        id: 'node_trigger',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: {
          trigger_type: initialTrigger,
          config: automation?.trigger_config || {},
        },
      }
    ];
  });

  const [edges, setEdges] = useState(() => {
    const parsed = typeof automation?.nodes_json === 'string'
      ? (() => { try { return JSON.parse(automation.nodes_json); } catch (e) { return {}; } })()
      : (automation?.nodes_json || {});

    if (parsed?.edges && Array.isArray(parsed.edges)) {
      return parsed.edges;
    }
    return [];
  });

  // Synchronize state once on mount or when automation ID actually changes (prevent wiping dirty edits)
  const initializedIdRef = useRef(null);
  useEffect(() => {
    if (!automation || !automation.id) return;
    if (initializedIdRef.current === automation.id) {
      return;
    }
    initializedIdRef.current = automation.id;

    if (automation.title !== undefined) {
      setTitle(automation.title || 'New Workflow');
    }
    if (automation.description !== undefined) {
      setDescription(automation.description || '');
    }

    const parsed = typeof automation.nodes_json === 'string'
      ? (() => { try { return JSON.parse(automation.nodes_json); } catch (e) { return {}; } })()
      : (automation.nodes_json || {});

    if (parsed?.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
      setNodes(parsed.nodes);
    }

    if (parsed?.edges && Array.isArray(parsed.edges)) {
      setEdges(parsed.edges);
    }
    setIsDirty(false);
  }, [automation?.id]);

  // Sync isDirty with window global and intercept beforeunload
  useEffect(() => {
    window.__qoracrm_automation_is_dirty = isDirty;
    return () => {
      window.__qoracrm_automation_is_dirty = false;
    };
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Attach delete handlers to nodes
  const deleteNode = useCallback((idToDelete) => {
    setIsDirty(true);
    setNodes(nds => nds.filter(n => n.id !== idToDelete));
    setEdges(eds => eds.filter(e => e.source !== idToDelete && e.target !== idToDelete));
    if (selectedNodeId === idToDelete) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const deleteEdge = useCallback((edgeId) => {
    setIsDirty(true);
    setEdges(eds => eds.filter(e => e.id !== edgeId));
  }, []);

  const nodesWithHandlers = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        crmUsers,
        forms,
        onDelete: n.type !== 'trigger' ? deleteNode : undefined,
      }
    }));
  }, [nodes, crmUsers, forms, deleteNode]);

  const edgesWithHandlers = useMemo(() => {
    return edges.map(e => ({
      ...e,
      type: 'deletable',
      data: {
        ...e.data,
        onDeleteEdge: deleteEdge,
      },
    }));
  }, [edges, deleteEdge]);

  // React Flow Handlers
  const onNodesChange = useCallback(
    (changes) => {
      const hasMeaningfulChanges = changes.some(c => c.type === 'position' || c.type === 'remove' || c.type === 'add');
      if (hasMeaningfulChanges) setIsDirty(true);
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const hasMeaningfulChanges = changes.some(c => c.type === 'remove' || c.type === 'add');
      if (hasMeaningfulChanges) setIsDirty(true);
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const [contextMenu, setContextMenu] = useState(null); // { x, y, type, targetId, node }

  // Close context menu on outside click
  useEffect(() => {
    const handleOutside = () => setContextMenu(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const onEdgeClick = useCallback((e, edge) => {
    e.stopPropagation();
    deleteEdge(edge.id);
  }, [deleteEdge]);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'pane',
    });
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      targetId: node.id,
      node: node,
    });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'edge',
      targetId: edge.id,
    });
  }, []);

  const onConnectStart = useCallback((event, params) => {
    connectingNodeRef.current = params; // { nodeId, handleId, handleType }
  }, []);

  const onConnectEnd = useCallback((event) => {
    if (!connectingNodeRef.current) return;

    // Check if target is not a connection handle
    const targetIsHandle = event.target.classList?.contains('react-flow__handle') || event.target.closest?.('.react-flow__handle');

    if (!targetIsHandle) {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const { nodeId, handleId } = connectingNodeRef.current;

      setPendingConnection({
        sourceNodeId: nodeId,
        sourceHandleId: handleId || null,
        position,
      });

      setPaletteOpen(true);
    }

    connectingNodeRef.current = null;
  }, [screenToFlowPosition]);

  const onConnect = useCallback(
    (params) => {
      setIsDirty(true);
      setEdges((eds) => addEdge({
        ...params,
        type: 'deletable',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 2.5, stroke: params.sourceHandle === 'true' ? '#10b981' : params.sourceHandle === 'false' ? '#f43f5e' : '#6366f1' }
      }, eds));
    },
    []
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Add Action or Condition Node
  const addNode = (actionDef) => {
    if (actionDef.pro && !isPro) {
      const lbl = actionDef.labelKey ? (t(actionDef.labelKey) !== actionDef.labelKey ? t(actionDef.labelKey) : actionDef.label) : actionDef.label;
      openUpgradeModal?.(lbl);
      return;
    }

    setIsDirty(true);
    const newId = `node_${Date.now()}`;
    let posX = 250;
    let posY = (nodes.length * 140) + 50;

    let shouldConnectFrom = null;
    let sourceHandle = null;

    if (pendingConnection) {
      posX = Math.round(pendingConnection.position.x - 128);
      posY = Math.round(pendingConnection.position.y - 20);
      shouldConnectFrom = pendingConnection.sourceNodeId;
      sourceHandle = pendingConnection.sourceHandleId;
      setPendingConnection(null);
    }

    const newNode = {
      id: newId,
      type: actionDef.type === 'condition' ? 'condition' : 'action',
      position: { x: posX, y: posY },
      data: {
        type: actionDef.type === 'condition' ? 'condition' : 'action',
        action_type: actionDef.type,
        label: actionDef.label,
        config: actionDef.type === 'condition'
          ? { field: 'status', operator: 'equals', value: '' }
          : actionDef.type === 'create_lead'
            ? { name: '{lead.name}', email: '{lead.email}', phone: '{lead.phone}', status_id: 'new' }
            : {},
      }
    };

    setNodes(nds => [...nds, newNode]);

    if (shouldConnectFrom) {
      const stroke = sourceHandle === 'true' ? '#10b981' : sourceHandle === 'false' ? '#f43f5e' : '#6366f1';
      setEdges(eds => addEdge({
        id: `edge_${shouldConnectFrom}_${newId}_${Date.now()}`,
        source: shouldConnectFrom,
        sourceHandle: sourceHandle || null,
        target: newId,
        type: 'deletable',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 2.5, stroke }
      }, eds));
    } else if (nodes.length > 0) {
      // Auto-connect from last node if applicable
      const lastNode = nodes[nodes.length - 1];
      if (lastNode.type !== 'condition') {
        setEdges(eds => addEdge({
          id: `edge_${lastNode.id}_${newId}`,
          source: lastNode.id,
          target: newId,
          type: 'deletable',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          style: { strokeWidth: 2.5, stroke: '#6366f1' }
        }, eds));
      }
    }

    setSelectedNodeId(newId);
    setPaletteOpen(false);
  };

  // Update selected node config
  const updateNodeData = (nodeId, newConfig, newTriggerType) => {
    setIsDirty(true);
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        data: {
          ...n.data,
          ...(newTriggerType ? { trigger_type: newTriggerType } : {}),
          config: newConfig,
        }
      };
    }));
  };

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    const triggerNode = nodes.find(n => n.type === 'trigger');
    const triggerType = triggerNode?.data?.trigger_type || 'lead_created';
    const triggerConfig = triggerNode?.data?.config || {};

    // Validate Pro features if user is on Free plan
    if (!isPro) {
      const isProTrigger = TRIGGER_TYPES.some(t => t.type === triggerType && t.pro);
      if (isProTrigger) {
        const trigDef = TRIGGER_TYPES.find(t => t.type === triggerType);
        const lbl = trigDef?.labelKey ? (t(trigDef.labelKey) !== trigDef.labelKey ? t(trigDef.labelKey) : trigDef.label) : (trigDef?.label || 'Pro Trigger');
        openUpgradeModal?.(lbl);
        return;
      }

      const proNode = nodes.find(n => {
        const actType = n.data?.action_type || n.action_type;
        const actDef = ALL_ACTIONS.find(a => a.type === actType);
        return Boolean(actDef?.pro);
      });

      if (proNode) {
        const actType = proNode.data?.action_type || proNode.action_type;
        const actDef = ALL_ACTIONS.find(a => a.type === actType);
        const lbl = actDef?.labelKey ? (t(actDef.labelKey) !== actDef.labelKey ? t(actDef.labelKey) : actDef.label) : (actDef?.label || t('pro_actions') || 'Pro Actions');
        openUpgradeModal?.(lbl);
        return;
      }
    }

    const cleanNodes = nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        type: n.data.type || n.type,
        action_type: n.data.action_type || '',
        trigger_type: n.data.trigger_type || '',
        config: n.data.config || {},
      }
    }));

    const cleanEdges = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
    }));

    const payload = {
      title: title.trim(),
      description: description.trim(),
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      nodes_json: {
        nodes: cleanNodes,
        edges: cleanEdges,
      },
      status: automation?.status || 'active',
    };

    setIsSaving(true);
    try {
      await onSave(payload);
      setIsDirty(false);
      window.__qoracrm_automation_is_dirty = false;
    } finally {
      setIsSaving(false);
    }
  };

  // Support global Save & Continue prompt from App.jsx
  useEffect(() => {
    const handleRequestSave = async (e) => {
      const { onSuccess, onError } = e.detail || {};
      try {
        await handleSave();
        onSuccess?.();
      } catch (err) {
        onError?.(err);
      }
    };
    window.addEventListener('qoracrm_request_save', handleRequestSave);
    return () => window.removeEventListener('qoracrm_request_save', handleRequestSave);
  }, [handleSave]);

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col bg-gray-100 overflow-hidden font-sans">
      {/* ── Top Header ───────────────────────────────────────────── */}
      <div className="h-14 sm:h-16 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => {
              if (isDirty) {
                setShowConfirmClose(true);
              } else {
                onClose();
              }
            }}
            className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            title={t('close') || 'Close'}
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={t('workflow_title') || 'Workflow Title'}
                style={{
                  border: 'none',
                  background: 'transparent',
                  boxShadow: 'none',
                  outline: 'none',
                  minHeight: 'unset',
                  lineHeight: '1.25',
                  padding: '2px 4px'
                }}
                className="text-xs sm:text-base font-bold text-gray-900 !border-0 !shadow-none !bg-transparent !outline-none hover:bg-gray-100/70 rounded-lg transition-colors w-28 xs:w-44 sm:w-72 truncate focus:bg-white focus:ring-1 focus:ring-primary/30"
              />
              {isDirty && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="hidden xs:inline">{t('unsaved') || 'Unsaved'}</span>
                </span>
              )}
            </div>
            <input
              type="text"
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              placeholder={t('add_description') || 'Add description...'}
              style={{
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
                outline: 'none',
                minHeight: 'unset',
                lineHeight: '1.25',
                padding: '2px 4px'
              }}
              className="text-[11px] sm:text-xs text-gray-400 !border-0 !shadow-none !bg-transparent !outline-none hover:bg-gray-100/70 rounded-lg transition-colors w-28 xs:w-44 sm:w-72 truncate hidden xs:block focus:bg-white focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => { setPendingConnection(null); setPaletteOpen(true); }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} className="sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{t('add_node') || 'Add Node'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
          >
            <Save size={14} className="sm:w-3.5 sm:h-3.5" />
            <span>{isSaving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}</span>
          </button>
        </div>
      </div>

      {/* ── Main Canvas & Sidebar ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodesWithHandlers}
            edges={edgesWithHandlers}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            deleteKeyCode={['Backspace', 'Delete']}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="bg-slate-50"
          >
            <Background color="#cbd5e1" gap={18} size={1} />
            <Controls className="!bg-white !rounded-xl !shadow-lg !border !border-gray-200" />
            <MiniMap
              nodeStrokeColor="#6366f1"
              nodeColor="#f8fafc"
              className="!rounded-xl !shadow-md !border !border-gray-200 !bg-white/80 backdrop-blur hidden sm:block"
            />
          </ReactFlow>

          {/* ── Bottom-Center Floating Action Bar ───────────────── */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl shadow-xl border border-gray-200/80 max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setPendingConnection(null); setPaletteOpen(true); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary text-white hover:bg-primary-dark text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus size={14} className="sm:w-3.5 sm:h-3.5" /> {t('add_node') || 'Add Action'}
            </button>
            <button
              onClick={() => addNode(ACTION_GROUPS[0].actions[0])}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Split size={14} /> {t('add_condition') || 'Condition (If/Else)'}
            </button>
            <button
              onClick={() => {
                const triggerNode = nodes.find(n => n.type === 'trigger');
                if (triggerNode) setSelectedNodeId(triggerNode.id);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap size={14} className="text-amber-500" /> {t('trigger') || 'Trigger'}
            </button>
          </div>

          {/* ── Right-Click Context Menu ─────────────────────────── */}
          {contextMenu && (
            <div
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 min-w-[190px] animate-fade-in text-xs"
            >
              {contextMenu.type === 'pane' && (
                <>
                  <button
                    onClick={() => { setPendingConnection(null); setPaletteOpen(true); setContextMenu(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700 cursor-pointer"
                  >
                    <Plus size={14} className="text-primary" /> {t('add_node') || 'Add Action'}
                  </button>
                  <button
                    onClick={() => { addNode(ACTION_GROUPS[0].actions[0]); setContextMenu(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700 cursor-pointer"
                  >
                    <Split size={14} className="text-amber-500" /> {t('add_condition') || 'Condition (If/Else)'}
                  </button>
                </>
              )}

              {contextMenu.type === 'node' && (
                <>
                  <button
                    onClick={() => { setSelectedNodeId(contextMenu.targetId); setContextMenu(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700 cursor-pointer"
                  >
                    <Settings2 size={14} className="text-primary" /> {t('configure_node') || 'Configure'}
                  </button>
                  {contextMenu.node?.type !== 'trigger' && (
                    <button
                      onClick={() => { deleteNode(contextMenu.targetId); setContextMenu(null); }}
                      className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 font-medium text-red-600 cursor-pointer"
                    >
                      <Trash2 size={14} /> {t('delete_node') || 'Delete Action'}
                    </button>
                  )}
                </>
              )}

              {contextMenu.type === 'edge' && (
                <button
                  onClick={() => {
                    deleteEdge(contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 font-medium text-red-600 cursor-pointer"
                >
                  <X size={14} /> {t('delete_connection') || 'Delete Connection'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Mobile Backdrop for Node Settings Drawer ────────────── */}
        {selectedNode && (
          <div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 transition-opacity"
            onClick={() => setSelectedNodeId(null)}
          />
        )}

        {/* ── Right Configuration Sidebar (Responsive Drawer on Mobile) ── */}
        <div className={`${selectedNode ? 'fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex' : 'hidden'} lg:flex lg:relative lg:z-10 lg:w-84 shrink-0 bg-white border-l border-gray-200 flex-col overflow-hidden shadow-2xl lg:shadow-xl`}>
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-800">
                {selectedNode ? (selectedNode.type === 'trigger' ? 'Trigger Settings' : selectedNode.type === 'condition' ? 'Condition Settings' : 'Action Settings') : 'Node Settings'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedNode && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {selectedNode.type}
                </span>
              )}
              {selectedNode && (
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  title={t('close') || 'Close'}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedNode ? (
              selectedNode.type === 'trigger' ? (
                <TriggerConfigPanel
                  node={selectedNode}
                  onChange={(cfg, triggerType) => updateNodeData(selectedNode.id, cfg, triggerType)}
                  forms={forms}
                  statuses={statuses}
                  tags={tags}
                  t={t}
                  isPro={isPro}
                  openUpgradeModal={openUpgradeModal}
                />
              ) : selectedNode.type === 'condition' ? (
                <ConditionConfigPanel
                  node={selectedNode}
                  onChange={(cfg) => updateNodeData(selectedNode.id, cfg)}
                  statuses={statuses}
                  tags={tags}
                  crmUsers={crmUsers}
                  forms={forms}
                  t={t}
                />
              ) : (
                <ActionConfigPanel
                  node={selectedNode}
                  onChange={(cfg) => updateNodeData(selectedNode.id, cfg)}
                  statuses={statuses}
                  tags={tags}
                  emailTemplates={email_templates}
                  forms={forms}
                  crmUsers={crmUsers}
                  t={t}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                <Settings2 size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-medium text-gray-500">{t('select_node_to_configure') || 'Click any node to configure its parameters'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Node Modal Palette ───────────────────────────────── */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-fade-in">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-gray-900">{t('add_workflow_node') || 'Add Workflow Node'}</span>
              <button
                onClick={() => { setPaletteOpen(false); setPendingConnection(null); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
              {ACTION_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: group.color }}>{t(group.labelKey) || group.label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {group.actions.map(action => {
                      const itemColor = action.color || group.color;
                      return (
                        <button
                          key={action.type}
                          onClick={() => addNode(action)}
                          className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50/80 transition-all text-left group cursor-pointer"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base shrink-0 shadow-xs" style={{ background: itemColor + '18', color: itemColor }}>
                            {action.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-800">{t(action.labelKey) || action.label}</span>
                              {action.pro && !isPro && <Lock size={11} className="text-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate mt-0.5">{t(action.type + '_desc') || action.desc}</div>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Unsaved Changes Confirmation Modal ────────────────────── */}
      {showConfirmClose && (
        <ConfirmModal
          title={t('unsaved_changes') || "Unsaved Changes"}
          message={t('unsaved_changes_msg') || "You have unsaved changes in this workflow. Are you sure you want to leave? Your changes will be lost."}
          confirmText={t('discard_changes') || "Discard Changes"}
          isDestructive={true}
          onConfirm={() => {
            setIsDirty(false);
            window.__qoracrm_automation_is_dirty = false;
            setShowConfirmClose(false);
            onClose();
          }}
          onCancel={() => setShowConfirmClose(false)}
          isBusy={isSaving}
          extraAction={{
            label: t('save_and_continue') || 'Save & Close',
            onClick: async () => {
              await handleSave();
              setShowConfirmClose(false);
            }
          }}
        />
      )}
    </div>
  );
}

export function NodeWorkflowBuilder(props) {
  return (
    <ReactFlowProvider>
      <NodeWorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}

// ─── Sub-Panels: Trigger, Condition, Action ──────────────────────────

function TriggerConfigPanel({ node, onChange, forms = [], statuses = [], tags = [], t, isPro, openUpgradeModal }) {
  const currentType = node.data?.trigger_type || 'lead_created';
  const config = node.data?.config || {};
  const [copied, setCopied] = useState(false);
  const set = (k, v) => onChange({ ...config, [k]: v }, currentType);

  const handleTriggerChange = (newType) => {
    const triggerDef = TRIGGER_TYPES.find(tt => tt.type === newType);
    if (triggerDef?.pro && !isPro) {
      const lbl = triggerDef.labelKey ? (t(triggerDef.labelKey) !== triggerDef.labelKey ? t(triggerDef.labelKey) : triggerDef.label) : triggerDef.label;
      openUpgradeModal?.(lbl);
      return;
    }
    onChange(config, newType);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">{t('trigger_event') || 'Trigger Event'}</label>
        <select
          value={currentType}
          onChange={e => handleTriggerChange(e.target.value)}
          className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
        >
          {TRIGGER_TYPES.map(tt => (
            <option key={tt.type} value={tt.type}>
              {t(tt.labelKey) || tt.label}{tt.pro && !isPro ? ' 🔒 (PRO)' : ''}
            </option>
          ))}
        </select>
      </div>

      {currentType === 'form_submitted' && (
        <ConfigField label={t('filter_by_form') || 'Filter by Form'}>
          <select value={config.form_id || ''} onChange={e => set('form_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
            <option value="">— Any Form —</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.title || `Form #${f.id}`}</option>
            ))}
          </select>
        </ConfigField>
      )}

      {currentType === 'lead_status_changed' && (
        <ConfigField label={t('target_status') || 'When status becomes'}>
          <select value={config.status || ''} onChange={e => set('status', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
            <option value="">— Any Status —</option>
            {statuses.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </ConfigField>
      )}

      {currentType === 'lead_tag_added' && (
        <ConfigField label={t('target_tag') || 'When tag added'}>
          <select value={config.tag_id || ''} onChange={e => set('tag_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
            <option value="">— Any Tag —</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.label}</option>
            ))}
          </select>
        </ConfigField>
      )}

      {currentType === 'cron_schedule' && (
        <div className="space-y-3">
          <ConfigField label={t('schedule_frequency') || 'Schedule Frequency'}>
            <select
              value={config.frequency || 'hourly'}
              onChange={e => set('frequency', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium"
            >
              <option value="15min">{t('cron_every_15min') || 'Every 15 Minutes'}</option>
              <option value="30min">{t('cron_every_30min') || 'Every 30 Minutes'}</option>
              <option value="hourly">{t('cron_every_hour') || 'Every Hour'}</option>
              <option value="daily">{t('cron_every_day') || 'Every Day'}</option>
              <option value="weekly">{t('cron_every_week') || 'Every Week'}</option>
              <option value="custom">{t('cron_custom') || 'Custom Interval (Manual)'}</option>
            </select>
          </ConfigField>

          {config.frequency === 'custom' && (
            <div className="p-3 bg-pink-50/50 border border-pink-100 rounded-xl space-y-2.5">
              <label className="block text-[11px] font-bold text-pink-900 uppercase tracking-wider">
                {t('cron_custom_interval') || 'Custom Schedule'}
              </label>

              <div className="flex items-center gap-2">
                <div className="w-1/2">
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    {t('interval_value') || 'Run Every'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={config.interval_value ?? 15}
                    onChange={e => set('interval_value', Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-xs bg-white border border-pink-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  />
                </div>

                <div className="w-1/2">
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    {t('interval_unit') || 'Time Unit'}
                  </label>
                  <select
                    value={config.interval_unit || 'minutes'}
                    onChange={e => set('interval_unit', e.target.value)}
                    className="w-full text-xs bg-white border border-pink-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold cursor-pointer"
                  >
                    <option value="minutes">{t('unit_minutes') || 'Minutes'}</option>
                    <option value="hours">{t('unit_hours') || 'Hours'}</option>
                    <option value="days">{t('unit_days') || 'Days'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-pink-800 font-medium pt-1 border-t border-pink-100/70">
                <Clock size={12} className="text-pink-600 shrink-0" />
                <span>
                  {t('cron_runs_every') || 'Runs every'}{' '}
                  <strong>{config.interval_value ?? 15} {t(`unit_${config.interval_unit || 'minutes'}`) || config.interval_unit || 'minutes'}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {currentType === 'webhook_received' && (
        <div className="space-y-3">
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 leading-relaxed">
            {t('webhook_help') || 'Send HTTP POST requests with JSON payload to this endpoint.'}
          </div>

          <ConfigField label={t('webhook_token') || 'Secret Token (Optional)'}>
            <input
              type="text"
              value={config.token || ''}
              onChange={e => set('token', e.target.value)}
              placeholder="e.g. secret123"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
            />
          </ConfigField>

          <ConfigField label={t('webhook_url') || 'Webhook Endpoint URL'}>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/wp-json/qoracrm/v1/automations/webhook${config.token ? `?token=${encodeURIComponent(config.token)}` : ''}`}
                className="w-full text-[11px] bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-gray-700 font-mono px-1.5 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/wp-json/qoracrm/v1/automations/webhook${config.token ? `?token=${encodeURIComponent(config.token)}` : ''}`;
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copied ? (t('webhook_copied') || 'Copied!') : (t('webhook_copy_url') || 'Copy')}
              </button>
            </div>
          </ConfigField>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Example Payload</p>
            <pre className="text-[10px] bg-slate-900 text-emerald-400 p-2.5 rounded-xl overflow-x-auto font-mono">
              {JSON.stringify({ name: 'Alex Smith', email: 'alex@example.com', phone: '+123456789', company: 'Acme Inc' }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function ConditionConfigPanel({ node, onChange, statuses = [], tags = [], crmUsers = [], forms = [], t }) {
  const config = node.data?.config || {};
  const set = (k, v) => onChange({ ...config, [k]: v });

  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
        <strong>Branching Node:</strong> Connect the green handle for <b>TRUE</b> path, and red handle for <b>FALSE</b> path.
      </div>

      <ConfigField label={t('condition_field') || 'Field to Check'}>
        <select
          value={config.field || 'status'}
          onChange={e => set('field', e.target.value)}
          className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
        >
          <optgroup label={t('crm_fields') || "CRM Fields"}>
            <option value="status">{t('field_status') || "Lead Status"}</option>
            <option value="tag">{t('field_tag') || "Lead Tag"}</option>
            <option value="assigned_to">{t('field_assigned_to') || "Assigned Manager"}</option>
            <option value="created_at">{t('field_created_at') || "Created Date"}</option>
            <option value="form_id">{t('field_form_id') || "Form ID"}</option>
            <option value="total">{t('field_total') || "Total / Amount"}</option>
          </optgroup>

          <optgroup label={t('contact_info') || "Contact Info"}>
            <option value="name">{t('field_name') || "Name"}</option>
            <option value="email">{t('field_email') || "Email"}</option>
            <option value="phone">{t('field_phone') || "Phone"}</option>
          </optgroup>

          <optgroup label={t('tracking_and_utm') || "Tracking & UTM"}>
            <option value="utm_source">UTM Source</option>
            <option value="utm_medium">UTM Medium</option>
            <option value="utm_campaign">UTM Campaign</option>
            <option value="utm_content">UTM Content</option>
            <option value="utm_term">UTM Term / Keyword</option>
            <option value="page_url">{t('field_page_url') || "Page URL"}</option>
            <option value="referrer">{t('field_referrer') || "Referrer"}</option>
            <option value="ip_address">{t('field_ip_address') || "IP Address"}</option>
            <option value="country">{t('field_country') || "Country"}</option>
            <option value="device">{t('field_device') || "Device Type"}</option>
          </optgroup>

          <optgroup label={t('other') || "Other"}>
            <option value="custom">{t('field_custom') || "Custom Key"}</option>
          </optgroup>
        </select>
      </ConfigField>

      {config.field === 'custom' && (
        <ConfigField label={t('custom_field_key') || 'Custom Key'}>
          <input
            value={config.custom_field || ''}
            onChange={e => set('custom_field', e.target.value)}
            placeholder="e.g. company or age"
            className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </ConfigField>
      )}

      <ConfigField label={t('operator') || 'Operator'}>
        <select
          value={config.operator || 'equals'}
          onChange={e => set('operator', e.target.value)}
          className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
        >
          <option value="equals">{t('operator_equals') || 'Equals (==)'}</option>
          <option value="not_equals">{t('operator_not_equals') || 'Not Equals (!=)'}</option>
          <option value="contains">{t('operator_contains') || 'Contains'}</option>
          <option value="not_contains">{t('operator_not_contains') || 'Does Not Contain'}</option>
          <option value="greater_than">{t('operator_greater_than') || 'Greater Than (>)'}</option>
          <option value="less_than">{t('operator_less_than') || 'Less Than (<)'}</option>
          <option value="is_empty">{t('operator_is_empty') || 'Is Empty'}</option>
          <option value="is_not_empty">{t('operator_is_not_empty') || 'Is Not Empty'}</option>
        </select>
      </ConfigField>

      {config.operator !== 'is_empty' && config.operator !== 'is_not_empty' && (
        <ConfigField label={t('value_to_compare') || 'Compare Value'}>
          {config.field === 'status' ? (
            <select
              value={config.value || ''}
              onChange={e => set('value', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">— {t('select_status') || 'Select Status'} —</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          ) : config.field === 'tag' ? (
            <select
              value={config.value || ''}
              onChange={e => set('value', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">— {t('select_tag') || 'Select Tag'} —</option>
              {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
            </select>
          ) : config.field === 'assigned_to' ? (
            <select
              value={config.value || ''}
              onChange={e => set('value', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">— {t('select_manager') || 'Select Manager'} —</option>
              <option value="unassigned">{t('unassigned') || 'Unassigned only'}</option>
              {crmUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.display_name}</option>
              ))}
            </select>
          ) : config.field === 'form_id' ? (
            <select
              value={config.value || ''}
              onChange={e => set('value', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">— {t('any_form') || 'All Forms'} —</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>{f.title || `Form #${f.id}`}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={config.value || ''}
              onChange={e => set('value', e.target.value)}
              placeholder={
                config.field === 'utm_source' ? 'e.g. google, facebook, instagram'
                  : config.field === 'utm_medium' ? 'e.g. cpc, organic, email'
                    : config.field === 'utm_campaign' ? 'e.g. summer_sale'
                      : config.field === 'country' ? 'e.g. US, UA, DE'
                        : config.field === 'created_at' ? 'YYYY-MM-DD'
                          : (t('value_to_compare') || 'Value to compare against')
              }
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          )}
        </ConfigField>
      )}
    </div>
  );
}

function FieldWithVarSelect({ label, value, onChange, placeholder, quickTags = [], vars = null, t }) {
  const inputRef = useRef(null);
  const activeVars = vars && vars.length > 0 ? vars : TEMPLATE_VARS;

  const handleSelect = (tag) => {
    if (!tag) return;
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? (value || '').length;
      const end = input.selectionEnd ?? (value || '').length;
      const currentVal = value || '';

      if (!currentVal || /^\{[a-zA-Z0-9_.-]+\}$/.test(currentVal.trim()) || (start === 0 && end === currentVal.length)) {
        onChange(tag);
      } else {
        const newVal = currentVal.substring(0, start) + tag + currentVal.substring(end);
        onChange(newVal);
      }
      setTimeout(() => {
        if (input) input.focus();
      }, 50);
    } else {
      onChange(tag);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-gray-700">{label}</label>
        {activeVars.length > 0 && (
          <select
            value=""
            onChange={e => {
              if (e.target.value) {
                handleSelect(e.target.value);
              }
            }}
            className="text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2 py-0.5 text-gray-700 cursor-pointer font-medium max-w-[140px] truncate shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            title={t('insert_tag') || 'Insert Variable'}
          >
            <option value="">{t('insert_tag') || '+ Variable...'}</option>
            {activeVars.map(v => (
              <option key={v.tag} value={v.tag}>{v.label} ({v.tag})</option>
            ))}
          </select>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
      />

      {quickTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-gray-400 font-medium">{t('quick_select') || 'Quick:'}</span>
          {quickTags.map(qt => (
            <button
              key={qt.tag}
              type="button"
              onClick={() => handleSelect(qt.tag)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${value === qt.tag
                ? 'bg-primary text-white font-semibold shadow-2xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              title={qt.tag}
            >
              {qt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionConfigPanel({ node, onChange, statuses, tags, emailTemplates, forms = [], crmUsers = [], t }) {
  const { integrations } = useSettingsStore();
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const isWaConnected = Boolean(integrations?.whatsapp?.connected);
  const waPhone = String(integrations?.whatsapp?.phone || '').trim();

  const config = node.data?.config || {};
  const actionType = node.data?.action_type || '';
  const isCreateLead = actionType === 'create_lead';
  const effectiveConfig = isCreateLead ? {
    name: '{name}',
    email: '{email}',
    phone: '{phone}',
    status_id: 'new',
    ...config,
  } : config;
  const set = (key, val) => onChange({ ...effectiveConfig, [key]: val });
  const insertVar = (tag, field) => set(field, (effectiveConfig[field] || '') + tag);

  switch (actionType) {
    case 'create_lead':
      return (
        <div className="space-y-3">
          <FieldWithVarSelect
            label={t('field_name') || 'Lead Name'}
            value={effectiveConfig.name}
            onChange={v => set('name', v)}
            placeholder="{name} or John Doe"
            vars={[
              { label: 'Name', tag: '{name}' },
              { label: 'Lead Name', tag: '{lead.name}' },
            ]}
            quickTags={[
              { label: '{name}', tag: '{name}' },
              { label: '{lead.name}', tag: '{lead.name}' },
            ]}
            t={t}
          />
          <FieldWithVarSelect
            label={t('field_email') || 'Email'}
            value={effectiveConfig.email}
            onChange={v => set('email', v)}
            placeholder="{email} or client@mail.com"
            vars={[
              { label: 'Email', tag: '{email}' },
              { label: 'Lead Email', tag: '{lead.email}' },
            ]}
            quickTags={[
              { label: '{email}', tag: '{email}' },
              { label: '{lead.email}', tag: '{lead.email}' },
            ]}
            t={t}
          />
          <FieldWithVarSelect
            label={t('field_phone') || 'Phone'}
            value={effectiveConfig.phone}
            onChange={v => set('phone', v)}
            placeholder="{phone} or +123456789"
            vars={[
              { label: 'Phone', tag: '{phone}' },
              { label: 'Lead Phone', tag: '{lead.phone}' },
            ]}
            quickTags={[
              { label: '{phone}', tag: '{phone}' },
              { label: '{lead.phone}', tag: '{lead.phone}' },
            ]}
            t={t}
          />

          <ConfigField label={t('target_form') || 'Form'}>
            <select value={effectiveConfig.form_id || ''} onChange={e => set('form_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="">— {t('none') || 'No Form'} —</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>{f.title || `Form #${f.id}`}</option>
              ))}
            </select>
          </ConfigField>

          <ConfigField label={t('initial_status') || 'Initial Status'}>
            <select value={effectiveConfig.status_id || 'new'} onChange={e => set('status_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </ConfigField>
        </div>
      );

    case 'delete_lead':
      return (
        <div className="space-y-3">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong>📦 {t('move_to_archive') || 'Move to Archive'}:</strong> {t('archive_lead_desc') || 'Moves the lead to CRM archive. It will no longer appear on active boards or lists, but can be restored from the archive at any time.'}
          </div>
        </div>
      );

    case 'change_status':
      return (
        <div className="space-y-3">
          <ConfigField label={t('new_status') || 'New Status'}>
            <select value={config.status_id || ''} onChange={e => set('status_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="">— Select status —</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </ConfigField>
        </div>
      );

    case 'add_tag':
    case 'remove_tag':
      return (
        <div className="space-y-3">
          <ConfigField label={actionType === 'add_tag' ? (t('tag_to_add') || 'Tag to Add') : (t('tag_to_remove') || 'Tag to Remove')}>
            <select value={config.tag_id || ''} onChange={e => set('tag_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="">— Select tag —</option>
              {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
            </select>
          </ConfigField>
        </div>
      );

    case 'query_leads':
      return (
        <div className="space-y-3">
          <ConfigField label={t('filter_by_status') || 'Filter by Status'}>
            <select value={config.status_id || 'all'} onChange={e => set('status_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="all">— {t('all_statuses') || 'All Statuses'} —</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </ConfigField>

          <ConfigField label={t('filter_by_tag') || 'Filter by Tag'}>
            <select value={config.tag_id || 'all'} onChange={e => set('tag_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="all">— {t('all_tags') || 'All Tags'} —</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </ConfigField>

          <ConfigField label={t('target_form') || 'Filter by Form'}>
            <select value={config.form_id || 'all'} onChange={e => set('form_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="all">— {t('any_form') || 'All Forms'} —</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>{f.title || `Form #${f.id}`}</option>
              ))}
            </select>
          </ConfigField>

          <ConfigField label={t('filter_by_manager') || 'Filter by Manager'}>
            <select value={config.assignee_id || 'all'} onChange={e => set('assignee_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="all">— {t('all_managers') || 'All Managers'} —</option>
              <option value="unassigned">{t('unassigned') || 'Unassigned only'}</option>
              {crmUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.display_name}</option>
              ))}
            </select>
          </ConfigField>

          <ConfigField label={t('created_within') || 'Created within'}>
            <select
              value={config.date_range || 'all'}
              onChange={e => set('date_range', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">{t('all_time') || 'All Time'}</option>
              <option value="24h">{t('last_24h') || 'Last 24 Hours'}</option>
              <option value="7d">{t('last_7d') || 'Last 7 Days'}</option>
              <option value="30d">{t('last_30d') || 'Last 30 Days'}</option>
              <option value="custom">{t('custom_range') || 'Custom Range'}</option>
            </select>
          </ConfigField>

          {config.date_range === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <ConfigField label={t('date_from') || 'Date From'}>
                <input
                  type="date"
                  value={config.date_from || ''}
                  onChange={e => set('date_from', e.target.value)}
                  className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-2 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </ConfigField>
              <ConfigField label={t('date_to') || 'Date To'}>
                <input
                  type="date"
                  value={config.date_to || ''}
                  onChange={e => set('date_to', e.target.value)}
                  className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-2 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </ConfigField>
            </div>
          )}

          <ConfigField label={t('max_leads_limit') || 'Max leads to process'}>
            <input
              type="number"
              value={config.limit || 50}
              onChange={e => set('limit', parseInt(e.target.value, 10) || 50)}
              min={1}
              max={200}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </ConfigField>
        </div>
      );

    case 'add_comment':
      return (
        <div className="space-y-3">
          <VarsBar onInsert={(tag) => insertVar(tag, 'comment')} />
          <ConfigField label={t('comment_text') || 'Comment Text'}>
            <textarea
              value={config.comment || ''}
              onChange={e => set('comment', e.target.value)}
              rows={4}
              placeholder="e.g. Lead {lead.name} created from form #{form.id}"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </ConfigField>
          <ConfigField label={t('where_to_save_comment') || 'Where to save this note'}>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-medium">
                <input
                  type="radio"
                  name="comment_target"
                  checked={!config.is_internal}
                  onChange={() => set('is_internal', false)}
                  className="accent-primary w-4 h-4"
                />
                <span>{t('comments_tab') || 'Comments Tab'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-medium">
                <input
                  type="radio"
                  name="comment_target"
                  checked={!!config.is_internal}
                  onChange={() => set('is_internal', true)}
                  className="accent-primary w-4 h-4"
                />
                <span>{t('history_tab') || 'History Tab (Internal Note)'}</span>
              </label>
            </div>
          </ConfigField>
        </div>
      );

    case 'send_email':
      return (
        <SendEmailConfigPanel
          config={config}
          set={set}
          insertVar={insertVar}
          emailTemplates={emailTemplates}
          t={t}
        />
      );

    case 'meta_capi':
      return (
        <div className="space-y-3">
          <ConfigField label={t('event_name') || 'Event Name'}>
            <select value={config.event_name || 'Lead'} onChange={e => set('event_name', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200  px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="Lead">Lead</option>
              <option value="Purchase">Purchase</option>
              <option value="CompleteRegistration">CompleteRegistration</option>
              <option value="Contact">Contact</option>
              <option value="ViewContent">ViewContent</option>
              <option value="Subscribe">Subscribe</option>
              <option value="CustomAudienceSync">Custom Audience Sync</option>
            </select>
          </ConfigField>

          <ConfigField label={t('custom_audience_id') || 'Custom Audience ID (Optional)'}>
            <input
              value={config.custom_audience_id || ''}
              onChange={e => set('custom_audience_id', e.target.value)}
              placeholder="e.g. 1033724710525421"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </ConfigField>

          <VarsBar onInsert={(tag) => insertVar(tag, 'user_data_json')} label={t('json_vars') || 'JSON vars'} />
          <ConfigField label={t('custom_payload_json') || 'Custom User Data / Payload (JSON)'}>
            <textarea
              value={config.user_data_json || ''}
              onChange={e => set('user_data_json', e.target.value)}
              rows={4}
              placeholder={'{\n  "email": "{lead.email}",\n  "phone": "{lead.phone}"\n}'}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-[11px] resize-none"
            />
          </ConfigField>
          <p className="text-xs text-gray-400">{t('meta_capi_note') || 'Uses Pixel ID and Access Token from your Integrations settings.'}</p>
        </div>
      );

    case 'ga4_event':
      return (
        <div className="space-y-3">
          <ConfigField label={t('event_name') || 'Event Name'}>
            <input
              value={config.event_name !== undefined ? config.event_name : 'generate_lead'}
              onChange={e => set('event_name', e.target.value)}
              placeholder="generate_lead"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </ConfigField>

          <VarsBar onInsert={(tag) => insertVar(tag, 'event_params_json')} label={t('params_vars') || 'Params vars'} />
          <ConfigField label={t('custom_parameters_json') || 'Custom Parameters (JSON)'}>
            <textarea
              value={config.event_params_json || ''}
              onChange={e => set('event_params_json', e.target.value)}
              rows={4}
              placeholder={'{\n  "currency": "USD",\n  "value": 100,\n  "lead_name": "{lead.name}"\n}'}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-[11px] resize-none"
            />
          </ConfigField>
          <p className="text-xs text-gray-400">{t('ga4_note') || 'Uses GA4 Measurement ID and API Secret from your Integrations settings.'}</p>
        </div>
      );

    case 'send_telegram':
      return (
        <div className="space-y-3">
          <VarsBar onInsert={(tag) => insertVar(tag, 'message')} />
          <ConfigField label={t('telegram_message_text') || 'Notification Message (HTML format)'}>
            <textarea
              value={config.message || ''}
              onChange={e => set('message', e.target.value)}
              rows={5}
              placeholder="⚡ <b>New Lead!</b>&#10;Name: {lead.name}&#10;Phone: {lead.phone}"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-mono text-[11px]"
            />
          </ConfigField>
          <ConfigField label={t('telegram_chat_id_override') || 'Chat ID (Optional override)'}>
            <input
              value={config.chat_id || ''}
              onChange={e => set('chat_id', e.target.value)}
              placeholder="Defaults to Integrations settings"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </ConfigField>
          <ConfigField label={t('telegram_bot_token_override') || 'Bot Token (Optional override)'}>
            <input
              type="password"
              value={config.bot_token || ''}
              onChange={e => set('bot_token', e.target.value)}
              placeholder="Defaults to Integrations settings"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </ConfigField>
        </div>
      );

    case 'send_whatsapp':
      return (
        <div className="space-y-3">
          {/* Connection status card */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isWaConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <div className="text-xs">
                <span className="font-semibold text-gray-800">
                  {isWaConnected ? (t('wa_connected') || 'WhatsApp Connected') : (t('wa_not_connected') || 'WhatsApp Not Connected')}
                </span>
                {isWaConnected && waPhone && (
                  <span className="text-[11px] text-gray-500 block font-mono">+{waPhone.replace('+', '')}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              {isWaConnected ? (t('change_account') || 'Change') : (t('connect') || 'Connect')}
            </button>
          </div>

          <ConfigField label={t('recipient') || 'Recipient'}>
            <select
              value={config.recipient_type || 'lead'}
              onChange={e => set('recipient_type', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
            >
              <option value="lead">{t('wa_to_lead_phone') || 'Lead Phone Number ({lead.phone})'}</option>
              <option value="self">{t('wa_to_self') || 'Myself / Admin (WhatsApp Saved Messages)'}</option>
              <option value="custom">{t('wa_to_custom') || 'Custom Phone Number or Group ID'}</option>
            </select>
          </ConfigField>

          {config.recipient_type === 'custom' && (
            <ConfigField label={t('phone_or_group_id') || 'Phone number or Group JID'}>
              <input
                value={config.custom_recipient || ''}
                onChange={e => set('custom_recipient', e.target.value)}
                placeholder="+1234567890 or 12036304xxx@g.us"
                className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-[11px]"
              />
            </ConfigField>
          )}

          <VarsBar onInsert={(tag) => insertVar(tag, 'message')} />
          <ConfigField label={t('message_text') || 'WhatsApp Message'}>
            <textarea
              value={config.message || ''}
              onChange={e => set('message', e.target.value)}
              rows={5}
              placeholder="Hello {lead.name}! Thanks for reaching out. We received your request..."
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-sans text-xs"
            />
          </ConfigField>

          {(() => {
            const WhatsAppModal = window.QoraCRM?.getExtension?.('WhatsAppConnectModal');
            return WhatsAppModal ? (
              <WhatsAppModal
                isOpen={isWaModalOpen}
                onClose={() => setIsWaModalOpen(false)}
              />
            ) : null;
          })()}
        </div>
      );

    case 'assign_manager':
      return (
        <div className="space-y-3">
          <ConfigField label={t('assign_to_manager') || 'Assign to Manager'}>
            <select value={config.user_id || ''} onChange={e => set('user_id', e.target.value)} className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="">— {t('select_manager') || 'Select Manager'} —</option>
              {crmUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.display_name} (ID: {u.id})</option>
              ))}
            </select>
          </ConfigField>
        </div>
      );

    case 'create_task':
      return (
        <div className="space-y-3">
          <VarsBar onInsert={(tag) => insertVar(tag, 'task_text')} label={t('task_vars') || 'Task vars'} />
          <ConfigField label={t('task_text') || 'Task Description / Text'}>
            <textarea
              value={config.task_text || config.description || config.title || ''}
              onChange={e => set('task_text', e.target.value)}
              rows={3}
              placeholder="Call client {lead.name} regarding form #{form.id}"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </ConfigField>

          <ConfigField label={t('assign_task_to') || 'Assign Task To'}>
            <select
              value={config.assignee_id || config.assigned_to || config.user_id || ''}
              onChange={e => set('assignee_id', e.target.value)}
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">— {t('lead_manager_or_current') || 'Lead Manager (or Default)'} —</option>
              {crmUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.display_name}</option>
              ))}
            </select>
          </ConfigField>

          <div className="grid grid-cols-2 gap-2">
            <ConfigField label={t('task_due_in_days') || 'Due in (days)'}>
              <input
                type="number"
                value={config.due_days !== undefined ? config.due_days : 1}
                onChange={e => set('due_days', parseInt(e.target.value, 10) || 0)}
                min="0"
                className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </ConfigField>

            <ConfigField label={t('task_due_time') || 'Due Time'}>
              <input
                type="time"
                value={config.due_time || '18:00'}
                onChange={e => set('due_time', e.target.value)}
                className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </ConfigField>
          </div>
        </div>
      );

    case 'outgoing_webhook':
      return (
        <OutgoingWebhookConfigPanel
          config={config}
          set={set}
          t={t}
          insertVar={insertVar}
        />
      );

    default:
      return <p className="text-xs text-gray-400">No configuration needed.</p>;
  }
}

function OutgoingWebhookConfigPanel({ config, set, t }) {
  const authType = config.auth_type || 'none';
  const headers = Array.isArray(config.headers) ? config.headers : [];

  const handleAddHeader = () => {
    const newHeaders = [
      ...headers,
      { id: 'hdr_' + Math.random().toString(36).substring(2, 8), key: '', value: '' },
    ];
    set('headers', newHeaders);
  };

  const handleUpdateHeader = (index, field, val) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: val };
    set('headers', newHeaders);
  };

  const handleRemoveHeader = (index) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    set('headers', newHeaders);
  };

  return (
    <div className="space-y-3">
      <ConfigField label={t('webhook_url') || 'Webhook URL'}>
        <input
          value={config.url || ''}
          onChange={e => set('url', e.target.value)}
          placeholder="https://your-endpoint.com/webhook"
          className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-[11px] transition-all"
        />
      </ConfigField>

      <div className="grid grid-cols-2 gap-2">
        <ConfigField label={t('method') || 'Method'}>
          <select
            value={config.method || 'POST'}
            onChange={e => set('method', e.target.value)}
            className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
          >
            <option value="POST">POST</option>
            <option value="GET">GET</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </ConfigField>

        <ConfigField label={t('webhook_auth') || 'Authentication'}>
          <select
            value={authType}
            onChange={e => set('auth_type', e.target.value)}
            className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="none">{t('webhook_auth_none') || 'None (No Auth)'}</option>
            <option value="bearer">{t('webhook_auth_bearer') || 'Bearer Token'}</option>
            <option value="basic">{t('webhook_auth_basic') || 'Basic Auth'}</option>
            <option value="custom">{t('webhook_auth_custom') || 'Custom Header'}</option>
          </select>
        </ConfigField>
      </div>

      {authType === 'bearer' && (
        <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2">
          <label className="block text-[11px] font-semibold text-purple-900">
            {t('webhook_auth_bearer') || 'Bearer Token'}
          </label>
          <input
            type="text"
            value={config.auth_token || ''}
            onChange={e => set('auth_token', e.target.value)}
            placeholder="Bearer token (e.g. eyJ... or secret_token)"
            className="w-full text-xs bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-gray-800 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <p className="text-[10px] text-purple-700/80">
            Sends <code className="font-mono bg-purple-100/70 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> header.
          </p>
        </div>
      )}

      {authType === 'basic' && (
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
          <label className="block text-[11px] font-semibold text-blue-900">
            {t('webhook_auth_basic') || 'Basic Authentication'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={config.auth_user || ''}
              onChange={e => set('auth_user', e.target.value)}
              placeholder="Username"
              className="w-full text-xs bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-gray-800 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              value={config.auth_pass || ''}
              onChange={e => set('auth_pass', e.target.value)}
              placeholder="Password"
              className="w-full text-xs bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-gray-800 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <p className="text-[10px] text-blue-700/80">
            Sends <code className="font-mono bg-blue-100/70 px-1 py-0.5 rounded">Authorization: Basic base64(...)</code> header.
          </p>
        </div>
      )}

      {authType === 'custom' && (
        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
          <label className="block text-[11px] font-semibold text-amber-900">
            {t('webhook_auth_custom') || 'Custom Auth Header'}
          </label>
          <div className="space-y-1.5">
            <input
              type="text"
              value={config.auth_header_name || ''}
              onChange={e => set('auth_header_name', e.target.value)}
              placeholder="Header Name (e.g. X-API-Key)"
              className="w-full text-xs bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-gray-800 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="text"
              value={config.auth_header_value || ''}
              onChange={e => set('auth_header_value', e.target.value)}
              placeholder="Header Value (e.g. secret_key_123)"
              className="w-full text-xs bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-gray-800 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      )}

      {/* Additional Custom Headers */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700">
            {t('webhook_custom_headers') || 'Custom HTTP Headers'}
          </label>
          <button
            type="button"
            onClick={handleAddHeader}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark cursor-pointer transition-colors"
          >
            <Plus size={12} />
            <span>{t('add_header') || 'Add Header'}</span>
          </button>
        </div>

        {headers.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">
            Default <code className="font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded">Content-Type: application/json</code> is automatically included.
          </p>
        ) : (
          <div className="space-y-2.5">
            {headers.map((hdr, idx) => (
              <div
                key={hdr.id || idx}
                className="p-2.5 bg-gray-50/80 border border-gray-200/90 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Header #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(idx)}
                    className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                    title={t('remove_header') || 'Remove header'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <input
                  type="text"
                  value={hdr.key || ''}
                  onChange={e => handleUpdateHeader(idx, 'key', e.target.value)}
                  placeholder={t('header_name') || 'Header Name (e.g. X-API-Key)'}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  value={hdr.value || ''}
                  onChange={e => handleUpdateHeader(idx, 'value', e.target.value)}
                  placeholder={t('header_value') || 'Value (e.g. {lead.id})'}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 pt-1">
        {t('webhook_note') || 'Lead data will be sent as JSON body automatically.'}
      </p>
    </div>
  );
}

function SendEmailConfigPanel({ config, set, insertVar, emailTemplates = [], t }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-3">
      <ConfigField label={t('recipient_email') || 'Recipient Email'}>
        <input
          value={config.to || ''}
          onChange={e => set('to', e.target.value)}
          placeholder="{lead.email} or specific@email.com"
          className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </ConfigField>

      <ConfigField label={t('use_email_template') || 'Use Email Template'}>
        <select
          value={config.template_id || ''}
          onChange={e => set('template_id', e.target.value)}
          className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          <option value="">— {t('custom_below') || 'Custom (below)'} —</option>
          {emailTemplates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
        </select>
      </ConfigField>

      {!config.template_id && (
        <>
          <VarsBar onInsert={(tag) => insertVar(tag, 'subject')} label={t('subject_vars') || 'Subject vars'} />
          <ConfigField label={t('subject_label') || 'Subject'}>
            <input
              value={config.subject || ''}
              onChange={e => set('subject', e.target.value)}
              placeholder="New lead: {lead.name}"
              className="w-full text-xs bg-gray-50/70 hover:bg-gray-100/60 border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </ConfigField>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray-700">{t('body_html_label') || 'Body (HTML)'}</span>
              {config.body ? (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  ✓ {t('configured') || 'Configured'}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">
                  {t('not_configured') || 'Not configured'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-primary/10 via-primary/5 to-indigo-50/70 hover:from-primary/20 hover:to-indigo-100 border border-primary/20 rounded-xl text-xs font-bold text-primary shadow-2xs transition-all cursor-pointer group"
            >
              <Maximize2 size={13} className="transition-transform group-hover:scale-110" />
              <span>{t('open_visual_editor') || 'Open Visual Editor (WYSIWYG)'}</span>
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <EmailModalEditor
          initialSubject={config.subject || ''}
          initialBody={config.body || ''}
          onSave={({ subject, body }) => {
            set('subject', subject);
            set('body', body);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function VarsBar({ onInsert, label }) {
  return (
    <div>
      {label && <p className="text-[10px] font-semibold text-gray-400 mb-1">{label}</p>}
      <div className="flex flex-wrap gap-1">
        {TEMPLATE_VARS.map(v => (
          <button
            key={v.tag}
            type="button"
            onClick={() => onInsert(v.tag)}
            className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-primary hover:text-white text-gray-600 text-[10px] font-mono transition-colors cursor-pointer"
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfigField({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-gray-700">{label}</label>
      {children}
    </div>
  );
}
