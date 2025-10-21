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
};

type SessionContextType = {
  user: User | null;
  language: string;
  login: (userData: User) => void;
  logout: () => void;
  setLanguage: (language: string) => void;
  isLoading: boolean;
};

export const SessionContext = createContext<SessionContextType>({
  user: null,
  language: 'vi',
  login: () => {},
  logout: () => {},
  setLanguage: () => {},
  isLoading: true,
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('vi');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
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
    await AuthService.logout();
    setUser(null);
    // The redirection is now handled in the AppLayout component
    router.push('/login');
  };

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
  };

  const value = {
      user,
      language,
      login,
      logout,
      setLanguage: handleSetLanguage,
      isLoading,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
