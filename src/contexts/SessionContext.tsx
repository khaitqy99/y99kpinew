'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth-service';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
  department_id: string;
  avatar: string;
  position: string;
  employee_code: string;
  branch_name?: string;
};

type SelectedBranch = {
  id: number;
  name: string;
  code: string;
} | null;

type SessionContextType = {
  user: User | null;
  language: string;
  selectedBranch: SelectedBranch;
  login: (userData: User) => void;
  logout: () => void;
  setLanguage: (language: string) => void;
  setSelectedBranch: (branch: SelectedBranch) => void;
  isLoading: boolean;
  isLoggingOut: boolean;
  isLoggingIn: boolean;
  setIsLoggingIn: (value: boolean) => void;
};

export const SessionContext = createContext<SessionContextType>({
  user: null,
  language: 'vi',
  selectedBranch: null,
  login: () => {},
  logout: () => {},
  setLanguage: () => {},
  setSelectedBranch: () => {},
  isLoading: true,
  isLoggingOut: false,
  isLoggingIn: false,
  setIsLoggingIn: () => {},
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('vi');
  const [selectedBranch, setSelectedBranch] = useState<SelectedBranch>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  // Load selected branch and language from storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBranch = sessionStorage.getItem('selectedBranch');
      if (savedBranch) {
        try {
          setSelectedBranch(JSON.parse(savedBranch));
        } catch (e) {
          console.error('Error parsing saved branch:', e);
        }
      }
      
      // Load language preference from localStorage (persists across sessions)
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  // Save selected branch to sessionStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedBranch) {
        sessionStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
      } else {
        sessionStorage.removeItem('selectedBranch');
      }
    }
  }, [selectedBranch]);
  
  useEffect(() => {
    // This effect runs once on mount to check for an existing session.
    const checkSession = async () => {
      try {
        // Đảm bảo admin account tồn tại
        await AuthService.ensureAdminExists();
        
        // Kiểm tra session hiện tại
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Failed to check session", error);
        sessionStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = (userData: User) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
      setUser(null);
      // The redirection is now handled in the AppLayout component
      // Delay redirect to show splash screen longer
      setTimeout(() => {
        router.push('/login');
        // Reset logging out state after redirect
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 300);
      }, 1000);
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    // Save language preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const handleSetSelectedBranch = (branch: SelectedBranch) => {
    setSelectedBranch(branch);
  };

  const value = {
      user,
      language,
      selectedBranch,
      login,
      logout,
      setLanguage: handleSetLanguage,
      setSelectedBranch: handleSetSelectedBranch,
      isLoading,
      isLoggingOut,
      isLoggingIn,
      setIsLoggingIn,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
