'use client';

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UsersDepartmentsTab } from '@/components/UsersDepartmentsTab';
import { SessionContext } from '@/contexts/SessionContext';
import { useTranslation } from '@/hooks/use-translation';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useContext(SessionContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <UsersDepartmentsTab />
    </div>
  );
}
