import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppNotification } from '../types';
import { useAdmin } from './AdminContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  restoreAllNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    globalNotifications,
    addGlobalNotification
  } = useAdmin();

  // Local storage of read notification IDs for this user
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_read_notif_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Local storage of dismissed notification IDs for this user
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexstudio_dismissed_notif_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_read_notif_ids', JSON.stringify(readIds));
    } catch {
      // Ignore
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_dismissed_notif_ids', JSON.stringify(dismissedIds));
    } catch {
      // Ignore
    }
  }, [dismissedIds]);

  // Combine global notifications with user's read & dismissed state
  const notifications: AppNotification[] = useMemo(() => {
    return (globalNotifications || [])
      .filter((n) => !dismissedIds.includes(n.id))
      .map((n) => ({
        ...n,
        isRead: readIds.includes(n.id) || Boolean(n.isRead)
      }));
  }, [globalNotifications, readIds, dismissedIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllAsRead = () => {
    const allIds = (globalNotifications || []).map((n) => n.id);
    setReadIds(allIds);
  };

  // User deletes a notification from their dropdown: only dismisses locally for this user
  const deleteNotification = async (id: string) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  // User clears all notifications from their dropdown: only dismisses locally for this user
  const clearAllNotifications = async () => {
    const allIds = (globalNotifications || []).map((n) => n.id);
    setDismissedIds((prev) => Array.from(new Set([...prev, ...allIds])));
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const restoreAllNotifications = () => {
    setDismissedIds([]);
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    await addGlobalNotification({
      ...notif,
      timestamp: 'Hace unos momentos',
      isRead: false
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        restoreAllNotifications,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};
