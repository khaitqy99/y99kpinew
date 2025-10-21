'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeBonusPenaltyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employee/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-lg">Đang chuyển hướng...</div>
        <div className="text-sm text-muted-foreground mt-2">
          Trang này đã được tích hợp vào Dashboard
        </div>
      </div>
    </div>
  );
}