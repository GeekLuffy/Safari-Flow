import React, { useEffect } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { mockProducts } from '../mockData';
import { NotificationService } from '../services/notificationService';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { notifications } = useNotificationStore();
  
  // Check for low stock items on initialization
  useEffect(() => {
    // Only run stock check if there are no existing notifications
    // This prevents spamming users with notifications on every page refresh
    if (notifications.length === 0) {
      console.log('Initializing notification system and checking stock levels');
      NotificationService.checkStockLevels(mockProducts);
    }
  }, [notifications.length]);
  
  return <>{children}</>;
}; 