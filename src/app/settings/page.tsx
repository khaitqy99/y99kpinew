'use client';

import React from 'react';
// Tabs removed; render content directly
import { UsersDepartmentsTab } from '@/components/UsersDepartmentsTab';
// Removed KPI creation from settings

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <UsersDepartmentsTab />
    </div>
  );
}
