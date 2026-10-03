import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  Download,
  Headphones,
  Zap,
  Info,
  ExternalLink,
  X
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { AppNotification } from '../types';

interface NotificationDropdownProps {
  onSelectView?: (view: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onSelectView }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.isRead : true
  );

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'update':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'download':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Download className="w-4 h-4" />
          </div>
        );
      case 'support':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        );
    }
  };

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.actionView && onSelectView) {
      onSelectView(item.actionView);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="btn-notifications-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Centro de Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          </span>
        )}
      </button>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Leídas</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800/80 px-4 pt-2 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`pb-2 text-xs font-semibold border-b-2 mr-4 transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Todas ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                No leídas ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !item.isRead
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {getNotifIcon(item.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{item.timestamp}</span>
                        {item.actionView && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                            Ver detalles &rarr;
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                      title="Eliminar notificación"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Info className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium">No tienes notificaciones en este momento.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Limpiar todo el historial
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
