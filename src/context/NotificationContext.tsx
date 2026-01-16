// context/NotificationContext.tsx
'use client'; // If using Next.js App Router

import React, { createContext, useContext, useState, ReactNode } from 'react';
import AuthNotification from '@/components/ui/AuthNotification';

interface NotificationState {
  title: string;
  message: string;
}

interface NotificationContextType {
  showNotification: (details: NotificationState) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = (details: NotificationState) => {
    setNotification(details);
    // Hide the notification after 4 seconds
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <AuthNotification title={notification.title} message={notification.message} />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};