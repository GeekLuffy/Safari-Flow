import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center">
      <Loader2 className={`mr-2 h-4 w-4 animate-spin ${className || ''}`} />
      <span>Processing...</span>
    </div>
  );
} 