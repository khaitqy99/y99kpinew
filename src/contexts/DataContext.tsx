'use client';

import React, { createContext, useState, ReactNode } from 'react';
import { employees as initialEmployees } from '@/data/employees';
import { kpis as initialKpis } from '@/data/kpis';
import { kpiRecords as initialKpiRecords } from '@/data/kpiRecords';
import { notifications as initialNotifications } from '@/data/notifications';

// --- TYPE DEFINITIONS ---

export type Employee = (typeof initialEmployees)[0];
export type Kpi = (typeof initialKpis)[0];
export type KpiRecord = (typeof initialKpiRecords)[0];
export type Notification = (typeof initialNotifications)[0];
export type KpiStatus = KpiRecord['status'];
export type Feedback = KpiRecord['feedback'][0];


// --- CONTEXT TYPE ---

type DataContextType = {
  // State
  users: Employee[];
  kpis: Kpi[];
  kpiRecords: KpiRecord[];
  notifications: Notification[];
  departments: string[];

  // Actions
  addUser: (user: Omit<Employee, 'id'>) => void;
  addKpi: (kpi: Omit<Kpi, 'id'>) => void;
  editKpi: (kpiId: string, updatedKpi: Omit<Kpi, 'id'>) => void;
  deleteKpi: (kpiId: string) => void;
  assignKpi: (record: Omit<KpiRecord, 'id' | 'attachment'>) => void;
  updateKpiRecord: (recordId: string, updates: Partial<Pick<KpiRecord, 'actual' | 'submissionDetails' | 'attachment'>>) => void;
  updateKpiRecordStatus: (recordId: string, status: KpiStatus, feedback?: Feedback) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  addDepartment: (department: string) => void;

  // Getters
  getDepartments: () => string[];
  getFrequencies: () => string[];
};

// --- CONTEXT CREATION ---

export const DataContext = createContext<DataContextType>({} as DataContextType);


// --- PROVIDER COMPONENT ---

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<Employee[]>(initialEmployees);
  const [kpis, setKpis] = useState<Kpi[]>(initialKpis);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>(initialKpiRecords);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [departments, setDepartments] = useState<string[]>([...new Set([...initialEmployees.map(u => u.department), ...initialKpis.map(k => k.department)])]);

  // --- ACTIONS ---

  const addUser = (userData: Omit<Employee, 'id'>) => {
    const newUser: Employee = {
        id: `emp-${String(users.length + 1).padStart(2, '0')}`,
        ...userData,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const addDepartment = (deptName: string) => {
    if (!departments.includes(deptName)) {
        setDepartments(prev => [...prev, deptName]);
    }
  }

  const addKpi = (kpiData: Omit<Kpi, 'id'>) => {
    const newKpi: Kpi = {
        id: `KPI-${String(kpis.length + 1).padStart(3, '0')}`,
        ...kpiData,
    };
    setKpis(prev => [...prev, newKpi]);
  };
  
  const editKpi = (kpiId: string, updatedKpiData: Omit<Kpi, 'id'>) => {
    setKpis(prevKpis => prevKpis.map(k => k.id === kpiId ? { ...k, ...updatedKpiData } : k));
  };
  
  const deleteKpi = (kpiId: string) => {
    setKpis(prevKpis => prevKpis.filter(k => k.id !== kpiId));
  };

  const assignKpi = (recordData: Omit<KpiRecord, 'id' | 'attachment'>) => {
    const newRecord: KpiRecord = {
        id: `rec-${String(kpiRecords.length + 1).padStart(3, '0')}`,
        attachment: null,
        ...recordData,
    };
    setKpiRecords(prev => [newRecord, ...prev]);
  };

  const updateKpiRecord = (recordId: string, updates: Partial<Pick<KpiRecord, 'actual' | 'submissionDetails' | 'attachment'>>) => {
    setKpiRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        return { ...rec, ...updates };
      }
      return rec;
    }));
  };
  
  const updateKpiRecordStatus = (recordId: string, status: KpiStatus, feedback?: Feedback) => {
     setKpiRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const newFeedback = feedback ? [...rec.feedback, feedback] : rec.feedback;
        return { ...rec, status, feedback: newFeedback };
      }
      return rec;
    }));
  };
  
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // --- GETTERS ---
  const getDepartments = () => [...departments].sort();
  const getFrequencies = () => [...new Set(kpis.map(k => k.frequency))].sort();

  // --- PROVIDER VALUE ---
  const value = {
    users,
    kpis,
    kpiRecords,
    notifications,
    departments,
    addUser,
    addKpi,
    editKpi,
    deleteKpi,
    assignKpi,
    updateKpiRecord,
    updateKpiRecordStatus,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addDepartment,
    getDepartments,
    getFrequencies,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
