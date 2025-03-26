// Simple mock implementation of a toast hook
// In a real app, you would use a proper toast library like react-hot-toast or shadcn/ui

import { useState, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // in milliseconds
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Use useCallback to ensure the toast function doesn't change on every render
  const toast = useCallback((props: ToastProps) => {
    // In a real implementation, this would display a toast notification
    console.log(`Toast: ${props.title} - ${props.description || ''}`);
    
    // For now, we'll just log to the console
    const newToast = {
      ...props,
      variant: props.variant || 'default',
      duration: props.duration || 3000
    };

    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t !== newToast));
    }, newToast.duration);
  }, []);

  return { toast, toasts };
} 