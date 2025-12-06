'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionContext } from '@/contexts/SessionContext';
import { SplashScreen } from '@/components/splash-screen';

export default function HomePage() {
  const { user, isLoading } = useContext(SessionContext);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Delay redirect để splash screen hiển thị lâu hơn (500ms)
    setTimeout(() => {
      if (!user) {
        // Chưa đăng nhập -> redirect đến trang login
        router.replace('/login');
      } else {
        // Đã đăng nhập -> redirect dựa trên role
        if (user.role === 'admin') {
          router.replace('/admin/branches');
        } else {
          // Employee hoặc Manager
          router.replace('/employee/dashboard');
        }
      }
    }, 500);
  }, [user, isLoading, router]);

  // Hiển thị splash screen chỉ khi đang kiểm tra session (isLoading = true)
  if (isLoading) {
    return <SplashScreen />;
  }

  // Trong lúc redirect, vẫn hiển thị splash screen
  return <SplashScreen />;
}

