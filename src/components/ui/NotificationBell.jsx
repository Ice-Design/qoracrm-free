import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { formatCrmDate, getLeadDisplayName } from '../../utils/helpers';

export function NotificationBell({ onOpenLead, onCloseLead, t }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await window.wp?.apiFetch?.({ path: '/qoracrm/v1/notifications' });
      if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleLeadRead = (e) => {
      const readLeadId = e.detail?.leadId;
      if (readLeadId) {
        setNotifications(prev => prev.filter(n => String(n.id) !== String(readLeadId)));
      }
    };
    window.addEventListener('qoracrm-lead-read', handleLeadRead);
    return () => window.removeEventListener('qoracrm-lead-read', handleLeadRead);
  }, []);

  const clearNotifications = async () => {
    try {
      await window.wp?.apiFetch?.({ path: '/qoracrm/v1/notifications/clear', method: 'POST' });
      setNotifications([]);
      setIsOpen(false);
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && onCloseLead) {
      onCloseLead();
    }
  };

  const handleNotificationClick = async (n) => {
    setIsOpen(false);
    const targetLeadId = n.notification_type === 'task' ? n.lead_id : n.id;
    onOpenLead(targetLeadId);

    // Mark as read locally immediately for snappier UI
    setNotifications(prev => prev.filter(item => item.id !== n.id || item.notification_type !== n.notification_type));

    // Send to backend
    try {
      await window.wp?.apiFetch?.({ 
        path: `/qoracrm/v1/notifications/${n.id}/read?type=${n.notification_type || 'lead'}`, 
        method: 'POST' 
      });
      if (n.notification_type !== 'task') {
        window.dispatchEvent(new CustomEvent('qoracrm-lead-read', { detail: { leadId: n.id } }));
      }
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center p-2.5 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all"
        title={t('notifications') || "Notifications"}
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
            <div className="font-bold text-gray-900 flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              {t('notifications') || 'Notifications'}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-white rounded-md border border-gray-200 shadow-sm">
              <X size={14} />
            </button>
          </div>

          <div className="flex px-4 border-b border-gray-100 shrink-0">
            <button className="px-4 py-3 text-sm font-semibold border-b-2 border-primary text-primary">
              {t('all') || 'All'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400 font-medium">
                {t('no_new_notifications') || "No new notifications"}
              </div>
            ) : (
              <div className="space-y-1.5">
                {notifications.map(n => {
                  if (n.notification_type === 'task') {
                    return (
                      <div
                        key={`task_${n.id}`}
                        onClick={() => handleNotificationClick(n)}
                        className="bg-blue-50/50 hover:bg-blue-50 p-3 rounded-xl cursor-pointer transition-colors border border-blue-100/50 shadow-sm flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-gray-900">{t('new_task') || 'New task assigned'}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{formatCrmDate(n.created_at, t)}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          <span className="font-medium text-gray-800 line-clamp-1">{n.task_text}</span>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {t('assigned_by') || 'Assigned by'} <span className="font-medium">{n.creator?.name || 'System'}</span>
                        </div>
                      </div>
                    );
                  }

                  const leadName = getLeadDisplayName(n, t);
                  const source = n.meta_data?.source;
                  let creatorName = t('form') || 'Form';
                  if (source === 'api_webhook') creatorName = t('api') || 'API';
                  else if (source === 'manual') creatorName = t('manual') || 'Manual';

                  return (
                    <div
                      key={`lead_${n.id}`}
                      onClick={() => handleNotificationClick(n)}
                      className="bg-green-50/50 hover:bg-green-50 p-3 rounded-xl cursor-pointer transition-colors border border-green-100/50 shadow-sm flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold text-gray-900">{t('new_lead') || 'New lead'}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{formatCrmDate(n.created_at, t)}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium text-gray-800">{leadName}</span>, {t('created_by') || 'created by'}: <span className="font-medium text-gray-500">{creatorName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 shrink-0 bg-white">
              <button
                onClick={clearNotifications}
                className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Check size={16} />
                {t('clear_all') || 'Clear all'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
