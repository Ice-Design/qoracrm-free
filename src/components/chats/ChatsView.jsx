import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare, Search, Send, User, Phone, Mail, Globe,
  CheckCircle2, Clock, Zap, ArrowRight, UserPlus, Filter,
  RefreshCw, Loader2, Sparkles, Tag, ChevronDown, Check,
  Paperclip, Smile, MoreVertical, X, ExternalLink, Trash2,
  ArrowLeft, Info, Monitor, Smartphone
} from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';
import { useSettingsStore } from '../../store/useSettingsStore';
import { refreshAllLeads } from '../leads/leadHelpers';
import { ConfirmModal } from '../ui/ConfirmModal';

const CHANNEL_CONFIG = {
  web_chat: { label: 'Web Chat', icon: '💬', color: '#d4af37', bg: 'bg-amber-50 text-amber-800' },
  whatsapp: { label: 'WhatsApp', icon: '🟢', color: '#25d366', bg: 'bg-emerald-50 text-emerald-800' },
  telegram: { label: 'Telegram', icon: '✈️', color: '#0ea5e9', bg: 'bg-sky-50 text-sky-700' },
  viber: { label: 'Viber', icon: '🟣', color: '#7360f2', bg: 'bg-purple-50 text-purple-800' },
  fb_messenger: { label: 'Messenger', icon: '💬', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700' },
  instagram: { label: 'Instagram', icon: '📸', color: '#ec4899', bg: 'bg-pink-50 text-pink-700' },
};

const TelegramIcon = ({ size = 18, className = 'text-[#0088cc]' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z" />
  </svg>
);

function ChatStatusDropdown({ status, onChange, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const statuses = [
    {
      id: 'open',
      label: t('status_open') || 'Open',
      color: '#10b981',
      dotClass: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.35)]',
      pillClass: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/80 hover:border-emerald-300',
    },
    {
      id: 'pending',
      label: t('status_pending') || 'Pending',
      color: '#f59e0b',
      dotClass: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.35)]',
      pillClass: 'bg-amber-50/90 text-amber-800 border-amber-200/90 hover:bg-amber-100/80 hover:border-amber-300',
    },
    {
      id: 'closed',
      label: t('status_closed') || 'Closed',
      color: '#ef4444',
      dotClass: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.35)]',
      pillClass: 'bg-rose-50/90 text-rose-800 border-rose-200/90 hover:bg-rose-100/80 hover:border-rose-300',
    },
  ];

  const current = statuses.find(s => s.id === status) || statuses[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs select-none ${current.pillClass}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${current.dotClass}`} />
        <span className="truncate">{current.label}</span>
        <ChevronDown size={13} className={`opacity-60 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 min-w-[145px] bg-white rounded-2xl border border-gray-200/90 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {statuses.map(s => {
            const isSelected = s.id === (status || 'open');
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${isSelected ? 'bg-gray-100/90 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.dotClass}`} />
                  <span className="truncate">{s.label}</span>
                </div>
                {isSelected && <Check size={13} className="text-gray-900 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const getAvatarBg = (name = '') => {
  const colors = [
    'bg-emerald-600 text-white',
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-teal-600 text-white',
    'bg-cyan-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getConvAvatarUrl = (conv) => {
  if (!conv) return '';
  if (conv.avatar_url) return conv.avatar_url;
  if (conv.metadata) {
    if (typeof conv.metadata === 'object' && conv.metadata.avatar_url) {
      return conv.metadata.avatar_url;
    }
    if (typeof conv.metadata === 'string') {
      try {
        const parsed = JSON.parse(conv.metadata);
        if (parsed?.avatar_url) return parsed.avatar_url;
      } catch {
        // ignore
      }
    }
  }
  return '';
};

function ChatAvatar({ conv, size = 'md', className = '' }) {
  const visitorName = conv?.visitor_name || 'Visitor';
  const avatarUrl = getConvAvatarUrl(conv);
  const channel = conv?.channel || 'web_chat';
  const ch = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.web_chat;

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs font-bold',
    lg: 'w-11 h-11 text-sm font-bold',
    xl: 'w-14 h-14 text-xl font-bold',
  };

  const badgeSizeClasses = {
    sm: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 p-[1px]',
    md: 'w-4 h-4 -bottom-0.5 -right-0.5 p-[1px]',
    lg: 'w-4.5 h-4.5 -bottom-0.5 -right-0.5 p-0.5',
    xl: 'w-5 h-5 -bottom-0.5 -right-0.5 p-0.5',
  };

  const iconSizes = {
    sm: 9,
    md: 11,
    lg: 12,
    xl: 14,
  };

  const initial = (visitorName === 'Website Visitor' ? 'W' : visitorName.charAt(0)).toUpperCase();
  const bgClass = getAvatarBg(visitorName);

  return (
    <div className={`relative shrink-0 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={visitorName}
          className="w-full h-full rounded-full object-cover shadow-xs border border-gray-200/60"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div
        className={`w-full h-full rounded-full flex items-center justify-center shadow-xs select-none ${bgClass}`}
        style={{ display: avatarUrl ? 'none' : 'flex' }}
      >
        {initial}
      </div>

      {/* Social channel badge at bottom-right corner */}
      <div
        className={`absolute rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center ${badgeSizeClasses[size] || badgeSizeClasses.md}`}
        title={ch.label}
      >
        {channel === 'telegram' ? (
          <TelegramIcon size={iconSizes[size] || 11} className="text-[#0088cc]" />
        ) : channel === 'instagram' ? (
          <span className="text-[9px] leading-none">📸</span>
        ) : channel === 'fb_messenger' ? (
          <span className="text-[9px] leading-none text-[#0084ff]">💬</span>
        ) : (
          <MessageSquare size={iconSizes[size] || 11} className="text-primary" />
        )}
      </div>
    </div>
  );
}

// Date helpers for chats
const isDifferentDay = (d1, d2) => {
  if (!d1 || !d2) return true;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
};

const formatMessageDateDivider = (dateStr, t) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return t ? (t('today') || 'Today') : 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t ? (t('yesterday') || 'Yesterday') : 'Yesterday';
  }

  const isCurrentYear = date.getFullYear() === now.getFullYear();
  const options = isCurrentYear
    ? { day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long', year: 'numeric' };

  return date.toLocaleDateString(undefined, options);
};

const formatMessageTime = (dateStr, t) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) {
    return time;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const isCurrentYear = date.getFullYear() === now.getFullYear();

  if (isCurrentYear) {
    return `${day}.${month}, ${time}`;
  }
  return `${day}.${month}.${date.getFullYear()}, ${time}`;
};

const formatConvDate = (dateStr, t) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();

  // If today: HH:mm
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // If yesterday: "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t ? (t('yesterday') || 'Yesterday') : 'Yesterday';
  }

  // Older: DD.MM.YYYY
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
};

export function ChatsView({ routeConvId }) {
  const { t } = useI18n();
  const { statuses = [], tags = [] } = useSettingsStore();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [crmUsers, setCrmUsers] = useState([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convToDelete, setConvToDelete] = useState(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    assignee_id: '',
    note: '',
    tags: ['chat_lead'],
  });
  const [cannedReplies, setCannedReplies] = useState([]);
  const [showCannedMenu, setShowCannedMenu] = useState(false);
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch conversations ───────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const q = new URLSearchParams({
        channel: channelFilter,
        status: statusFilter,
        search: searchQuery,
      });
      const res = await window.wp?.apiFetch?.({ path: `/qoracrm/v1/chats/conversations?${q.toString()}` });
      const fetched = res?.conversations || [];
      setConversations(prev => {
        if (activeConvId && !fetched.some(c => String(c.id) === String(activeConvId))) {
          const currentActive = prev.find(c => String(c.id) === String(activeConvId));
          if (currentActive) {
            return [currentActive, ...fetched];
          }
        }
        return fetched;
      });
    } catch {
      /* non-fatal */
    } finally {
      setIsLoadingConv(false);
    }
  }, [channelFilter, statusFilter, searchQuery, activeConvId]);

  useEffect(() => {
    fetchConversations();
    // Auto-refresh conversations list every 5s
    const timer = setInterval(fetchConversations, 5000);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  // Handle routeConvId from URL (#/chats/3)
  useEffect(() => {
    if (routeConvId && !isNaN(Number(routeConvId))) {
      const targetId = Number(routeConvId);
      setActiveConvId(targetId);
      setChannelFilter('all');
      setStatusFilter('all');
    }
  }, [routeConvId]);

  // If activeConvId is specified but not yet in conversations list, fetch it directly
  useEffect(() => {
    if (activeConvId && !conversations.some(c => String(c.id) === String(activeConvId))) {
      window.wp?.apiFetch?.({ path: `/qoracrm/v1/chats/${activeConvId}` })
        .then(res => {
          if (res?.conversation) {
            setConversations(prev => {
              if (prev.some(c => String(c.id) === String(res.conversation.id))) return prev;
              return [res.conversation, ...prev];
            });
          }
        })
        .catch(() => {
          showToast(t('chat_not_found_or_deleted') || 'This conversation was deleted or not found.', 'error');
        });
    }
  }, [activeConvId, conversations, t]);

  // ── Fetch canned replies ──────────────────────────────────────────────
  useEffect(() => {
    window.wp?.apiFetch?.({ path: '/qoracrm/v1/chats/canned-replies' })
      .then(res => setCannedReplies(res?.replies || []))
      .catch(() => { });

    window.wp?.apiFetch?.({ path: '/qoracrm/v1/settings/users' })
      .then(users => {
        if (Array.isArray(users)) setCrmUsers(users);
      })
      .catch(() => { });
  }, []);

  // ── Fetch active messages ─────────────────────────────────────────────
  const fetchMessages = useCallback(async (convId, isPoll = false) => {
    if (!convId) return;
    if (!isPoll) setIsLoadingMsg(true);
    try {
      const res = await window.wp?.apiFetch?.({ path: `/qoracrm/v1/chats/${convId}/messages` });
      setMessages(res?.messages || []);
      if (!isPoll) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {
      /* non-fatal */
    } finally {
      if (!isPoll) setIsLoadingMsg(false);
    }
  }, []);

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeConvId);

    // Poll active chat messages every 2.5s
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => fetchMessages(activeConvId, true), 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeConvId, fetchMessages]);

  // ── Send Manager Message ──────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeConvId || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);
    setShowCannedMenu(false);

    // Optimistic UI update
    const tempMsg = {
      id: 'temp_' + Date.now(),
      sender_type: 'manager',
      message_text: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await window.wp?.apiFetch?.({
        path: '/qoracrm/v1/chats/send',
        method: 'POST',
        data: { conversation_id: activeConvId, message: textToSend },
      });
      fetchMessages(activeConvId, true);
    } catch (err) {
      showToast(err.message || 'Failed to send message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // ── Convert to Lead Modal & Submit ───────────────────────────────────
  const openConvertModal = () => {
    if (!activeConv) return;
    const visitorMsgs = messages.filter(m => m.sender_type === 'visitor');
    const lastMsg = visitorMsgs.length > 0 ? visitorMsgs[visitorMsgs.length - 1].message_text : '';

    const isPhoneLid = activeConv.visitor_phone && activeConv.external_id?.includes(activeConv.visitor_phone.replace(/[^0-9]/g, ''));

    setLeadForm({
      name: activeConv.visitor_name && activeConv.visitor_name !== 'Website Visitor' ? activeConv.visitor_name : '',
      email: activeConv.visitor_email || '',
      phone: !isPhoneLid ? (activeConv.visitor_phone || '') : '',
      status: statuses[0]?.id || 'new',
      assignee_id: activeConv.assigned_user_id || '',
      note: lastMsg,
      tags: ['chat_lead'],
    });
    setShowConvertModal(true);
  };

  const handleConfirmConvert = async (e) => {
    e?.preventDefault?.();
    if (!activeConvId || isConverting) return;
    setIsConverting(true);
    try {
      const res = await window.wp?.apiFetch?.({
        path: `/qoracrm/v1/chats/${activeConvId}/convert-to-lead`,
        method: 'POST',
        data: leadForm,
      });
      if (res?.lead_id) {
        showToast(`${t('chat_created_lead') || 'Lead created from chat'} #${res.lead_id}!`);
        // Update local state
        setConversations(prev => prev.map(c => String(c.id) === String(activeConvId) ? {
          ...c,
          lead_id: res.lead_id,
          visitor_name: leadForm.name || c.visitor_name,
          visitor_email: leadForm.email || c.visitor_email,
          visitor_phone: leadForm.phone || c.visitor_phone,
        } : c));
        setShowConvertModal(false);
        refreshAllLeads?.();
      }
    } catch (err) {
      showToast(err.message || 'Conversion failed.', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // ── Update Conversation Status ────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (!activeConvId) return;
    try {
      await window.wp?.apiFetch?.({
        path: `/qoracrm/v1/chats/${activeConvId}/status`,
        method: 'PATCH',
        data: { status: newStatus },
      });
      setConversations(prev => prev.map(c => String(c.id) === String(activeConvId) ? { ...c, status: newStatus } : c));
    } catch { /* non-fatal */ }
  };

  // ── Delete Conversation ───────────────────────────────────────────────
  const handleDeleteConversation = (convId) => {
    if (!convId) return;
    setConvToDelete(convId);
  };

  const handleConfirmDelete = async () => {
    if (!convToDelete) return;
    try {
      setIsDeletingChat(true);
      await window.wp?.apiFetch?.({
        path: `/qoracrm/v1/chats/${convToDelete}`,
        method: 'DELETE',
      });
      showToast(t('chat_deleted') || 'Conversation deleted successfully');
      setConversations(prev => prev.filter(c => String(c.id) !== String(convToDelete)));
      if (String(activeConvId) === String(convToDelete)) {
        setActiveConvId(null);
        window.location.hash = '#/chats';
        setMessages([]);
      }
      setConvToDelete(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete conversation', 'error');
    } finally {
      setIsDeletingChat(false);
    }
  };

  const activeConv = conversations.find(c => String(c.id) === String(activeConvId));

  const metadata = useMemo(() => {
    if (!activeConv?.metadata) return {};
    if (typeof activeConv.metadata === 'object') return activeConv.metadata;
    try {
      return JSON.parse(activeConv.metadata) || {};
    } catch {
      return {};
    }
  }, [activeConv?.metadata]);

  const parsedUa = useMemo(() => {
    const ua = metadata.user_agent || metadata.client_user_agent || '';
    if (!ua || typeof ua !== 'string') return null;

    let browser = 'Browser';
    let browserVer = '';
    let os = '';
    const isMobile = /mobile|iphone|ipod|android.*mobile/i.test(ua);
    const isTablet = /ipad|tablet|android(?!.*mobile)/i.test(ua);

    // OS Detection
    if (/macintosh|mac os x/i.test(ua)) {
      os = 'macOS';
    } else if (/windows nt 10/i.test(ua)) {
      os = 'Windows 10/11';
    } else if (/windows nt 6\.3/i.test(ua)) {
      os = 'Windows 8.1';
    } else if (/windows nt 6\.1/i.test(ua)) {
      os = 'Windows 7';
    } else if (/windows/i.test(ua)) {
      os = 'Windows';
    } else if (/iphone/i.test(ua)) {
      os = 'iPhone';
    } else if (/ipad/i.test(ua)) {
      os = 'iPad';
    } else if (/android/i.test(ua)) {
      os = 'Android';
    } else if (/linux/i.test(ua)) {
      os = 'Linux';
    }

    // Browser Detection
    if (/edg\/([0-9.]+)/i.test(ua)) {
      browser = 'Edge';
      browserVer = RegExp.$1.split('.')[0];
    } else if (/yabrowser\/([0-9.]+)/i.test(ua)) {
      browser = 'Yandex';
      browserVer = RegExp.$1.split('.')[0];
    } else if (/samsungbrowser\/([0-9.]+)/i.test(ua)) {
      browser = 'Samsung Internet';
      browserVer = RegExp.$1.split('.')[0];
    } else if (/opr\/([0-9.]+)/i.test(ua) || /opera/i.test(ua)) {
      browser = 'Opera';
      browserVer = RegExp.$1.split('.')[0];
    } else if (/chrome\/([0-9.]+)/i.test(ua)) {
      browser = 'Chrome';
      browserVer = RegExp.$1.split('.')[0];
    } else if (/firefox\/([0-9.]+)/i.test(ua)) {
      browser = 'Firefox';
      browserVer = RegExp.$1.split('.')[0];
    } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
      browser = 'Safari';
      browserVer = RegExp.$1.split('.')[0];
    }

    return {
      browser: browserVer ? `${browser} ${browserVer}` : browser,
      os: os || 'Unknown OS',
      deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      raw: ua,
    };
  }, [metadata]);

  const utmParams = useMemo(() => {
    const utms = {};
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'yclid', 'ttclid', 'adset_id', 'ad_id'];

    keys.forEach(k => {
      if (metadata[k]) utms[k] = String(metadata[k]);
    });

    if (metadata.utm && typeof metadata.utm === 'object') {
      keys.forEach(k => {
        if (metadata.utm[k] && !utms[k]) utms[k] = String(metadata.utm[k]);
      });
    }

    if (metadata.page_url && typeof metadata.page_url === 'string' && metadata.page_url.includes('?')) {
      try {
        const qIdx = metadata.page_url.indexOf('?');
        const queryStr = metadata.page_url.substring(qIdx + 1);
        const sp = new URLSearchParams(queryStr);
        keys.forEach(k => {
          const val = sp.get(k);
          if (val && !utms[k]) utms[k] = val;
        });
      } catch { /* ignore */ }
    }

    return utms;
  }, [metadata]);

  const hasUtm = Object.keys(utmParams).length > 0;

  const renderVisitorProfile = () => {
    if (!activeConv) return null;
    return (
      <>
        {/* Customer Avatar & Name */}
        <div className="text-center pb-4 border-b border-gray-100">
          <ChatAvatar conv={activeConv} size="xl" className="mx-auto mb-2.5" />
          <h4 className="font-bold text-gray-900 text-sm">
            {activeConv.visitor_name === 'Website Visitor' ? (t('website_visitor') || 'Website Visitor') : activeConv.visitor_name}
          </h4>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${CHANNEL_CONFIG[activeConv.channel]?.bg}`}>
              {activeConv.channel === 'telegram' && <TelegramIcon size={12} className="text-[#0088cc]" />}
              {t('channel_' + activeConv.channel) || CHANNEL_CONFIG[activeConv.channel]?.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${activeConv.status === 'pending'
                ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                : activeConv.status === 'closed'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200/70'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeConv.status === 'pending' ? 'bg-amber-500' : activeConv.status === 'closed' ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />
              {activeConv.status === 'pending'
                ? (t('status_pending') || 'Pending')
                : activeConv.status === 'closed'
                  ? (t('status_closed') || 'Closed')
                  : (t('status_open') || 'Open')}
            </span>
          </div>
        </div>

        {/* 1-Click Convert to Lead Box */}
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/15 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-xs font-bold text-gray-900">{t('crm_lead_integration') || 'CRM Lead Integration'}</span>
          </div>

          {activeConv.lead_id ? (
            <div className="space-y-2">
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> {t('linked_to_lead') || 'Linked to Lead'} #{activeConv.lead_id}
              </p>
              <a
                href={`#/leads/kanban/${activeConv.lead_id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark !text-white text-xs font-bold shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer"
              >
                {t('open_lead_card') || 'Open Lead Card →'}
              </a>
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-gray-500 mb-3">
                {t('convert_to_lead_desc') || 'Convert this conversation and contact data into a CRM Lead in 1 click.'}
              </p>
              <button
                onClick={openConvertModal}
                disabled={isConverting}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:-translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isConverting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                {t('convert_to_lead') || 'Convert to Lead'}
              </button>
            </div>
          )}
        </div>

        {/* Visitor Details */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('visitor_info') || 'Visitor Info'}</p>

          {/* Email */}
          {activeConv.visitor_email && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Mail size={13} className="text-gray-400 shrink-0" />
              <a href={`mailto:${activeConv.visitor_email}`} className="truncate hover:text-primary hover:underline">
                {activeConv.visitor_email}
              </a>
            </div>
          )}

          {/* Phone */}
          {activeConv.visitor_phone && !activeConv.external_id?.includes(activeConv.visitor_phone.replace(/[^0-9]/g, '')) && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Phone size={13} className="text-gray-400 shrink-0" />
              <a href={`tel:${activeConv.visitor_phone}`} className="hover:text-primary hover:underline">
                {activeConv.visitor_phone}
              </a>
            </div>
          )}

          {/* IP Address */}
          {metadata.ip && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Globe size={13} className="text-gray-400 shrink-0" />
              <span className="font-mono text-[11px] text-gray-600">IP: {metadata.ip}</span>
            </div>
          )}

          {/* Browser & OS */}
          {parsedUa && (
            <div className="flex items-start gap-2 text-xs text-gray-700" title={metadata.user_agent || ''}>
              {parsedUa.deviceType === 'mobile' ? (
                <Smartphone size={13} className="text-gray-400 shrink-0 mt-0.5" />
              ) : (
                <Monitor size={13} className="text-gray-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="font-medium text-gray-800">{parsedUa.browser}</span>
                {parsedUa.os && (
                  <span className="text-gray-400 text-[11px] ml-1.5 font-normal">({parsedUa.os})</span>
                )}
              </div>
            </div>
          )}

          {/* Visited Page */}
          {metadata.page_url && (
            <div className="pt-1 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {t('visited_page') || 'Visited Page'}
              </p>
              <a
                href={metadata.page_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs !text-primary hover:underline break-all flex items-center gap-1 group"
                title={metadata.page_url}
              >
                <ExternalLink size={11} className="shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{metadata.page_url}</span>
              </a>
            </div>
          )}

          {/* Referrer / Traffic Source */}
          {(metadata.referrer || metadata.referer) && (
            <div className="pt-1 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {t('referer') || 'Referrer'}
              </p>
              <a
                href={metadata.referrer || metadata.referer}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gray-700 hover:text-primary hover:underline break-all flex items-center gap-1 group"
                title={metadata.referrer || metadata.referer}
              >
                <ExternalLink size={11} className="shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{metadata.referrer || metadata.referer}</span>
              </a>
            </div>
          )}

          {/* UTM & Marketing Parameters */}
          {hasUtm && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <Tag size={11} className="text-primary" />
                <span>{t('campaign_utm') || 'Campaign / UTM'}</span>
              </div>
              <div className="space-y-1.5 bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-[11px]">
                {utmParams.utm_source && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 font-medium">Source:</span>
                    <span className="font-semibold text-gray-800 bg-white px-2 py-0.5 rounded-md border border-gray-200/60 truncate max-w-[140px]" title={utmParams.utm_source}>
                      {utmParams.utm_source}
                    </span>
                  </div>
                )}
                {utmParams.utm_medium && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 font-medium">Medium:</span>
                    <span className="font-semibold text-gray-800 bg-white px-2 py-0.5 rounded-md border border-gray-200/60 truncate max-w-[140px]" title={utmParams.utm_medium}>
                      {utmParams.utm_medium}
                    </span>
                  </div>
                )}
                {utmParams.utm_campaign && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 font-medium">Campaign:</span>
                    <span className="font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20 truncate max-w-[140px]" title={utmParams.utm_campaign}>
                      {utmParams.utm_campaign}
                    </span>
                  </div>
                )}
                {utmParams.utm_term && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 font-medium">Term:</span>
                    <span className="text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200/60 truncate max-w-[140px]" title={utmParams.utm_term}>
                      {utmParams.utm_term}
                    </span>
                  </div>
                )}
                {utmParams.utm_content && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 font-medium">Content:</span>
                    <span className="text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200/60 truncate max-w-[140px]" title={utmParams.utm_content}>
                      {utmParams.utm_content}
                    </span>
                  </div>
                )}
                {utmParams.gclid && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-blue-600 font-medium">Google Click:</span>
                    <span className="font-mono text-[9px] text-gray-600 truncate max-w-[120px]" title={utmParams.gclid}>
                      {utmParams.gclid}
                    </span>
                  </div>
                )}
                {utmParams.fbclid && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-indigo-600 font-medium">FB Click:</span>
                    <span className="font-mono text-[9px] text-gray-600 truncate max-w-[120px]" title={utmParams.fbclid}>
                      {utmParams.fbclid}
                    </span>
                  </div>
                )}
                {utmParams.yclid && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-amber-600 font-medium">Yandex Click:</span>
                    <span className="font-mono text-[9px] text-gray-600 truncate max-w-[120px]" title={utmParams.yclid}>
                      {utmParams.yclid}
                    </span>
                  </div>
                )}
                {utmParams.ttclid && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-pink-600 font-medium">TikTok Click:</span>
                    <span className="font-mono text-[9px] text-gray-600 truncate max-w-[120px]" title={utmParams.ttclid}>
                      {utmParams.ttclid}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#f5f6f8] relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[99999] px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Column 1: Conversations List (Width: 320px) ──────────────── */}
      <div className={`w-full lg:w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full ${activeConvId ? 'hidden lg:flex' : 'flex'}`}>

        {/* Header & Search */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div className="font-bold text-gray-900 text-base">{t('chats') || 'Live Chat'}</div>
            </div>
            <button
              onClick={fetchConversations}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary focus-within:bg-white transition-all">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('search_chats') !== 'search_chats' ? t('search_chats') : 'Search conversations...'}
              className="w-full text-xs !bg-transparent !border-0 !p-0 !m-0 !shadow-none !outline-none text-gray-800 placeholder-gray-400"
              style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, boxShadow: 'none' }}
            />
          </div>

          {/* Channel Filters */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {['all', ...Object.keys(CHANNEL_CONFIG)].map(ch => {
              const trKey = ch === 'all' ? 'channel_all' : 'channel_' + ch;
              const tr = t(trKey);
              const label = (tr && tr !== trKey)
                ? tr
                : (ch === 'all' ? (t('channel_all') !== 'channel_all' ? t('channel_all') : 'All') : (CHANNEL_CONFIG[ch]?.label || ch));
              return (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${channelFilter === ch
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {isLoadingConv ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-4 text-gray-400 text-xs">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-gray-700">{t('no_conversations') || 'No conversations found.'}</p>
              <div className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                {t('no_conversations_desc') || 'Enable the widget on your site to start receiving messages from visitors.'}
              </div>
              <a
                href="#/settings/chats"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold !text-primary hover:text-primary-dark hover:underline"
              >
                <span>{t('configure_chat_widget') || 'Configure Widget'}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          ) : (
            conversations.map(conv => {
              const ch = CHANNEL_CONFIG[conv.channel] || CHANNEL_CONFIG.web_chat;
              const isSelected = String(activeConvId) === String(conv.id);
              const visitorDisplayName = conv.visitor_name === 'Website Visitor'
                ? (t('website_visitor') || 'Website Visitor')
                : conv.visitor_name;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    if (window.location.hash !== `#/chats/${conv.id}`) {
                      window.location.hash = `#/chats/${conv.id}`;
                    }
                  }}
                  className={`group p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-gray-50'
                    }`}
                >
                  {/* Visitor Avatar with Channel Badge */}
                  <div className="relative shrink-0 mt-0.5">
                    <ChatAvatar conv={conv} size="md" />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 truncate">{visitorDisplayName}</span>
                      <span
                        className="text-[10px] text-gray-400 shrink-0 font-medium"
                        title={conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : ''}
                      >
                        {formatConvDate(conv.last_message_at, t)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 ${ch.bg}`}>
                          {t('channel_' + conv.channel) || ch.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 ${conv.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            : conv.status === 'closed'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/50'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${conv.status === 'pending' ? 'bg-amber-500' : conv.status === 'closed' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`} />
                          {conv.status === 'pending'
                            ? (t('status_pending') || 'Pending')
                            : conv.status === 'closed'
                              ? (t('status_closed') || 'Closed')
                              : (t('status_open') || 'Open')}
                        </span>
                        {conv.lead_id && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/50">
                            Lead #{conv.lead_id}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                        title={t('delete_chat') || 'Delete'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Column 2: Active Chat Window (Flex: 1) ────────────────────── */}
      <div className={`flex-1 flex-col h-full bg-[#f8fafc] border-r border-gray-200 overflow-hidden ${activeConvId ? 'flex' : 'hidden lg:flex'}`}>
        {activeConv ? (
          <>
            {/* Active chat top bar */}
            <div className="py-2 px-3 sm:py-0 sm:px-6 sm:h-16 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 shadow-sm gap-2">
              {/* Row 1 on mobile: User info + Mobile Profile toggle */}
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {/* Back to conversations list on mobile */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConvId(null);
                      window.location.hash = '#/chats';
                    }}
                    className="flex lg:hidden p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
                    title={t('back') || 'Back'}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  {/* Visitor Avatar */}
                  <ChatAvatar conv={activeConv} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {activeConv.visitor_name === 'Website Visitor' ? (t('website_visitor') || 'Website Visitor') : activeConv.visitor_name}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-gray-400 truncate block">
                      {t('channel_' + activeConv.channel) || CHANNEL_CONFIG[activeConv.channel]?.label} • {activeConv.visitor_phone || `ID: ${activeConv.external_id}`}
                    </span>
                  </div>
                </div>

                {/* Info button on mobile only */}
                <button
                  type="button"
                  onClick={() => setShowMobileDetails(true)}
                  className="flex sm:hidden p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                  title={t('visitor_info') || 'Visitor Info'}
                >
                  <Info size={18} />
                </button>
              </div>

              {/* Row 2 on mobile / Right side on desktop: Status Selector & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t border-gray-100 sm:border-t-0">
                {/* Status Selector */}
                <ChatStatusDropdown
                  status={activeConv.status}
                  onChange={handleStatusChange}
                  t={t}
                />

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Info button on tablet/desktop */}
                  <button
                    type="button"
                    onClick={() => setShowMobileDetails(true)}
                    className="hidden sm:flex xl:hidden p-1.5 sm:p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                    title={t('visitor_info') || 'Visitor Info'}
                  >
                    <Info size={18} />
                  </button>

                  {/* Convert to Lead Button directly in top bar */}
                  {activeConv.lead_id ? (
                    <a
                      href={`#/leads/kanban/${activeConv.lead_id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 !text-emerald-700 hover:bg-emerald-100 hover:!text-emerald-800 text-xs font-bold border border-emerald-200/80 transition-all shadow-xs"
                      title={t('open_lead_card') || 'Open Lead Card'}
                    >
                      <CheckCircle2 size={13} className="!text-emerald-600 shrink-0" />
                      <span className="!text-emerald-700">{t('lead') || 'Lead'} #{activeConv.lead_id}</span>
                    </a>
                  ) : (
                    <button
                      onClick={openConvertModal}
                      disabled={isConverting}
                      className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-[0_2px_8px_rgba(212,175,55,0.25)] hover:-translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isConverting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                      <span className="hidden xs:inline">{t('convert_to_lead') || 'Convert to Lead'}</span>
                      <span className="xs:hidden">{t('convert_to_lead_short') || t('convert') || 'Convert'}</span>
                    </button>
                  )}

                  {/* Delete Chat Button */}
                  <button
                    onClick={() => handleDeleteConversation(activeConv.id)}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t('delete_chat') || 'Delete Conversation'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isLoadingMsg ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs">
                  {t('no_messages_yet') || 'No messages in this conversation yet.'}
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOutgoing = msg.sender_type === 'manager' || msg.sender_type === 'bot';
                  const isBot = msg.sender_type === 'bot';
                  const isSystem = msg.sender_type === 'system';
                  const prevMsg = i > 0 ? messages[i - 1] : null;
                  const showDateDivider = !prevMsg || isDifferentDay(msg.created_at, prevMsg.created_at);

                  if (isSystem) {
                    return (
                      <div key={msg.id || i} className="space-y-2">
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-3.5 select-none">
                            <span className="px-3.5 py-1 rounded-full bg-gray-100/90 border border-gray-200/70 text-gray-600 text-[11px] font-semibold shadow-xs">
                              {formatMessageDateDivider(msg.created_at, t)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-center my-1.5 select-none">
                          <div className="text-[11px] text-gray-400 font-medium text-center bg-gray-50/70 px-3 py-1 rounded-lg border border-gray-100/80">
                            {msg.message_text}{' '}
                            <span className="text-[10px] text-gray-400/80 ml-1.5" title={msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}>
                              {formatMessageTime(msg.created_at, t)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id || i} className="space-y-2">
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-3.5 select-none">
                          <span className="px-3.5 py-1 rounded-full bg-gray-100/90 border border-gray-200/70 text-gray-600 text-[11px] font-semibold shadow-xs">
                            {formatMessageDateDivider(msg.created_at, t)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${isOutgoing
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                          }`}>
                          {isBot && (
                            <div className="text-[10px] font-semibold text-white/80 mb-1 flex items-center gap-1 select-none">
                              <span>🤖</span>
                              <span>{t('bot_auto_reply') || 'Auto-Reply'}</span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.message_text}</div>
                          <div
                            className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 select-none ${isOutgoing ? 'text-white/75' : 'text-gray-400'
                              }`}
                            title={msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                          >
                            <span>{formatMessageTime(msg.created_at, t)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Canned Replies Popup Menu */}
            {showCannedMenu && (
              <div className="mx-6 mb-2 p-2 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-48 overflow-y-auto space-y-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">
                  <span>{t('quick_replies') || 'Quick Replies'}</span>
                  <button onClick={() => setShowCannedMenu(false)}><X size={12} /></button>
                </div>
                {cannedReplies.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setInputText(r.content); setShowCannedMenu(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-primary/5 text-xs text-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-bold text-primary font-mono">{r.shortcut}</span>
                    <span className="text-gray-400 truncate max-w-xs ml-2">{r.content}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCannedMenu(!showCannedMenu)}
                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors shrink-0"
                title="Quick Canned Replies"
              >
                <Sparkles size={16} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={t('type_your_message') || 'Type a message... (Press Enter to send)'}
                className="flex-1 text-xs border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-primary text-white shadow hover:bg-primary-dark transition-all disabled:opacity-40 shrink-0 cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-2xl mb-3">💬</div>
            <div className="font-bold text-gray-700 text-sm mb-1">{t('select_conversation') || 'Select a conversation'}</div>
            <p className="text-xs text-gray-400 max-w-xs">{t('select_conversation_desc') || 'Choose a chat thread from the left list to start replying.'}</p>
          </div>
        )}
      </div>

      {/* ── Column 3: Customer Profile & Lead Converter (Width: 280px on desktop xl+) ─ */}
      {activeConv && (
        <div className="hidden xl:flex w-72 shrink-0 bg-white flex flex-col h-full overflow-y-auto p-5 space-y-6">
          {renderVisitorProfile()}
        </div>
      )}

      {/* ── Mobile/Tablet Customer Profile Drawer ─ */}
      {showMobileDetails && activeConv && (
        <div className="xl:hidden fixed inset-0 z-[99999] flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setShowMobileDetails(false)}
          />
          <div className="relative w-full sm:w-80 bg-white h-full shadow-2xl flex flex-col overflow-y-auto p-5 space-y-6 z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <span className="font-bold text-gray-900 text-sm">{t('visitor_info') || 'Visitor Info'}</span>
              <button
                type="button"
                onClick={() => setShowMobileDetails(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {renderVisitorProfile()}
          </div>
        </div>
      )}

      {/* ── Convert to Lead Modal ────────────────────────────────────── */}
      {showConvertModal && (
        <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[460px] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles size={17} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t('create_lead_from_chat') || 'Create Lead from Chat'}</div>
                  <p className="text-[11px] text-gray-500">{t('create_lead_from_chat_desc') || 'Review and customize visitor details before adding to CRM.'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConvertModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleConfirmConvert} className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('contact_name') || 'Contact Name'}</label>
                <div className="flex items-center gap-2 px-3 h-8.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary focus-within:bg-white transition-all">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={leadForm.name}
                    onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder={t('name_label') || 'Name'}
                    className="w-full text-xs !bg-transparent !border-0 !p-0 !m-0 !shadow-none !outline-none text-gray-900 font-medium"
                    style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, boxShadow: 'none' }}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('contact_email') || 'Email'}</label>
                  <div className="flex items-center gap-2 px-3 h-8.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary focus-within:bg-white transition-all">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <input
                      type="email"
                      value={leadForm.email}
                      onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="visitor@example.com"
                      className="w-full text-xs !bg-transparent !border-0 !p-0 !m-0 !shadow-none !outline-none text-gray-900 font-medium"
                      style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, boxShadow: 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('contact_phone') || 'Phone'}</label>
                  <div className="flex items-center gap-2 px-3 h-8.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary focus-within:bg-white transition-all">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <input
                      type="tel"
                      value={leadForm.phone}
                      onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full text-xs !bg-transparent !border-0 !p-0 !m-0 !shadow-none !outline-none text-gray-900 font-medium"
                      style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, boxShadow: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Manager */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('initial_status') || 'Initial Status'}</label>
                  <select
                    value={leadForm.status}
                    onChange={e => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full h-8.5 text-xs px-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium cursor-pointer"
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('assigned_manager') || 'Assigned Manager'}</label>
                  <select
                    value={leadForm.assignee_id}
                    onChange={e => setLeadForm({ ...leadForm, assignee_id: e.target.value })}
                    className="w-full h-8.5 text-xs px-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="">— {t('unassigned') || 'Unassigned'} —</option>
                    {crmUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.display_name || u.user_login}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note / Last Visitor Message */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('lead_note') || 'Note / Message'}</label>
                <textarea
                  rows={2}
                  value={leadForm.note}
                  onChange={e => setLeadForm({ ...leadForm, note: e.target.value })}
                  placeholder={t('enter_message') || 'Visitor message or details...'}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-medium resize-none"
                />
              </div>

              {/* Tags selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('lead_tags') || 'Lead Tags'}</label>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                    <Tag size={11} />
                    {t('chat_lead') || 'Chat Lead'}
                  </span>
                  {tags.map(tg => {
                    const isSelected = leadForm.tags.includes(tg.id);
                    return (
                      <button
                        type="button"
                        key={tg.id}
                        onClick={() => {
                          const newTags = isSelected
                            ? leadForm.tags.filter(id => id !== tg.id)
                            : [...leadForm.tags, tg.id];
                          setLeadForm({ ...leadForm, tags: newTags });
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${isSelected
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        {tg.label}
                        {isSelected && <Check size={11} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info notice */}
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-[11px] text-amber-900 flex items-start gap-2">
                <Sparkles size={13} className="text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {t('chat_lead_info_note') || 'Conversation history and visitor metadata (IP, visited page) will be automatically attached to this lead.'}
                </span>
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:-translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isConverting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                  <span>{t('create_lead_btn') || 'Create Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {convToDelete && (
        <ConfirmModal
          title={t('delete_chat') || 'Delete Chat'}
          message={t('confirm_delete_chat') || 'Delete this conversation and all its messages?'}
          confirmText={t('delete') || 'Delete'}
          isDestructive={true}
          isBusy={isDeletingChat}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConvToDelete(null)}
        />
      )}
    </div>
  );
}
