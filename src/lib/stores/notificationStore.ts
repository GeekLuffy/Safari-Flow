import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          id: uuidv4(),
          timestamp: new Date(),
          read: false,
          ...notification,
        };
        
        return {
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      }),
      
      markAsRead: (id) => set((state) => {
        const updatedNotifications = state.notifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        );
        
        const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount: newUnreadCount,
        };
      }),
      
      markAllAsRead: () => set(() => ({
        notifications: get().notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),
      
      removeNotification: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
        };
      }),
      
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'invenhub-notifications-storage',
    }
  )
); 