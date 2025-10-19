'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  department: string;
  avatar: string;
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
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (pathname !== '/login') {
        router.replace('/login');
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('user');
      if (pathname !== '/login') {
        router.replace('/login');
      }
    } finally {
        setIsLoading(false);
    }
  }, [pathname, router]);

  const login = (userData: User) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
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
