'use client';

import React from 'react';
// Tabs removed; render content directly
import { UsersDepartmentsTab } from '@/components/UsersDepartmentsTab';
// Removed KPI creation from settings

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý người dùng, phòng ban và các thiết lập hệ thống.
        </p>
      </div>
      <div className="mt-6">
        <UsersDepartmentsTab />
      </div>
    </div>
  );
}
