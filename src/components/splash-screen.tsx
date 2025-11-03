'use client';

import React from 'react';

interface SplashScreenProps {
  isFadingOut?: boolean;
}

export const SplashScreen = React.memo(function SplashScreen({ isFadingOut = false }: SplashScreenProps) {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 transition-opacity duration-300 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Logo với animation - key stable để tránh re-mount */}
        <div key="splash-logo-container">
          <img 
            alt="Y99 Logo" 
            className="w-40 h-40 object-contain animate-scale-in"
            src="https://y99.vn/logo.png"
            loading="eager"
            decoding="async"
          />
        </div>
        
        {/* Loading spinner */}
        <div className="flex items-center space-x-2 mt-4">
          <div 
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          ></div>
          <div 
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          ></div>
          <div 
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    </div>
  );
});

