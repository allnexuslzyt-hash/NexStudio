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
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    globalNotifications,
    addGlobalNotification,
    deleteGlobalNotification,
    clearAllGlobalNotifications
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

  useEffect(() => {
    try {
      localStorage.setItem('nexstudio_read_notif_ids', JSON.stringify(readIds));
    } catch {
      // Ignore
    }
  }, [readIds]);

  // Combine global notifications with user's read state
  const notifications: AppNotification[] = useMemo(() => {
    return (globalNotifications || []).map((n) => ({
      ...n,
      isRead: readIds.includes(n.id) || Boolean(n.isRead)
    }));
  }, [globalNotifications, readIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllAsRead = () => {
    const allIds = (globalNotifications || []).map((n) => n.id);
    setReadIds(allIds);
  };

  const deleteNotification = async (id: string) => {
    await deleteGlobalNotification(id);
  };

  const clearAllNotifications = async () => {
    await clearAllGlobalNotifications();
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
