import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm dark:bg-slate-950 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">
            Loading...
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Please wait while we prepare your content
          </p>
        </div>
        
        {/* Animated Dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}