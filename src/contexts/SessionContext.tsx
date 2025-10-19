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
};

export const SessionContext = createContext<SessionContextType>({
  user: null,
  language: 'vi',
  login: () => {},
  logout: () => {},
  setLanguage: () => {},
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('vi');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // On initial load, try to get user from session storage
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (pathname !== '/login') {
        router.push('/login');
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('user');
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    // You could also store this in sessionStorage if you want it to persist
  };

  return (
    <SessionContext.Provider value={{ user, language, login, logout, setLanguage: handleSetLanguage }}>
      {children}
    </SessionContext.Provider>
  );
};
