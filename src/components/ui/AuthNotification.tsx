// components/ui/AuthNotification.tsx
import React from 'react';

interface AuthNotificationProps {
  title: string;
  message: string;
}

const AuthNotification: React.FC<AuthNotificationProps> = ({ title, message }) => {
  return (
    <div
      className="fixed top-5 right-5 w-auto max-w-sm p-4 rounded-lg shadow-lg bg-red-500 text-white z-50 animate-slide-in"
    >
      {/* <p className="text-lg font-light">{title}</p> */}
      <p className="text-base text-white">{title}</p>
      <p className="text-sm text-white font-light">{message}</p>
    </div>
  );
};

export default AuthNotification;