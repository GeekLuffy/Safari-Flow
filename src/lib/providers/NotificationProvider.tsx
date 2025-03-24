import React, { useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { NotificationService } from '../services/notificationService';
import { useQuery } from '@tanstack/react-query';
import { getAllProducts } from '@/api/product';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { notifications } = useNotificationStore();
  const initialCheckDone = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch products using React Query
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-notifications'],
    queryFn: getAllProducts,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Check for low stock items on initialization and after product data updates
  useEffect(() => {
    if (products.length > 0) {
      console.log('Checking stock levels for notifications');
      NotificationService.checkStockLevels(products);
      initialCheckDone.current = true;
    }
  }, [products]);
  
  // Set up periodic stock level checks
  useEffect(() => {
    // Clean up previous interval if it exists
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    
    // Check every 5 minutes
    checkIntervalRef.current = setInterval(() => {
      if (products.length > 0) {
        console.log('Performing periodic stock level check');
        NotificationService.checkStockLevels(products);
      }
    }, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [products]);
  
  return <>{children}</>;
}; 