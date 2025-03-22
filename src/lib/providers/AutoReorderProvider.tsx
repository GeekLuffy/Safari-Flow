import React, { useEffect } from 'react';
import { setupAutoReorderSchedule } from '../services/reorderService';

export const AutoReorderProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  useEffect(() => {
    // Initialize the auto-reorder scheduler when the app mounts
    setupAutoReorderSchedule();
  }, []);

  return <>{children}</>;
}; 