'use client';

import React, { createContext, useState, ReactNode, useCallback } from 'react';
// Types will be imported from supabase service instead
import type { Employee, Kpi, KpiRecord, Notification, Department } from '@/services/supabase-service';

// --- TYPE DEFINITIONS ---

export type { Employee, Kpi, KpiRecord, Notification, Department };
export type KpiStatus = KpiRecord['status'];
export type Feedback = {
  id: string;
  author: string;
  comment: string;
  timestamp: string;
};


// --- CONTEXT TYPE ---

type DataContextType = {
  // State
  users: Employee[];
  kpis: Kpi[];
  kpiRecords: KpiRecord[];
  notifications: Notification[];
  departments: Department[];

  // Actions
  addUser: (user: Omit<Employee, 'id'>) => void;
  updateUser: (userId: string, updatedUser: Partial<Employee>) => void;
  addKpi: (kpi: Omit<Kpi, 'id'>) => void;
  editKpi: (kpiId: string, updatedKpi: Omit<Kpi, 'id'>) => void;
  deleteKpi: (kpiId: string) => void;
  assignKpi: (record: Omit<KpiRecord, 'id'>) => void;
  updateKpiRecordActual: (recordId: string, actual: number) => void;
  submitKpiRecord: (recordId: string, submission: { actual: number; submissionDetails: string; attachment: string | null }) => void;
  updateKpiRecordStatus: (recordId: string, status: KpiStatus, feedback?: Feedback) => void;
  addKpiFeedback: (recordId: string, feedback: Omit<Feedback, 'id'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  addDepartment: (department: Omit<Department, 'id'>) => void;

  // Getters
  getDepartments: () => Department[];
  getDepartmentNames: () => string[];
  getFrequencies: () => string[];
  getKpiStatuses: () => string[];
  getNotificationTypes: () => string[];
  getNotificationPriorities: () => string[];
  getNotificationCategories: () => string[];
};

// --- CONTEXT CREATION ---

export const DataContext = createContext<DataContextType>({} as DataContextType);


// --- PROVIDER COMPONENT ---

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<Employee[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // --- ACTIONS ---

  const addUser = (userData: Omit<Employee, 'id'>) => {
    const newUser: Employee = {
        id: `emp-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...userData,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (userId: string, updatedUserData: Partial<Employee>) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, ...updatedUserData, updatedAt: new Date().toISOString() }
        : u
    ));
  };

  const addDepartment = (deptData: Omit<Department, 'id'>) => {
    const newDepartment: Department = {
        id: `dept-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...deptData,
    };
    setDepartments(prev => [...prev, newDepartment]);
  };

  const addKpi = (kpiData: Omit<Kpi, 'id'>) => {
    const newKpi: Kpi = {
        id: `KPI-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...kpiData,
    };
    setKpis(prev => [...prev, newKpi]);
  };
  
  const editKpi = (kpiId: string, updatedKpiData: Omit<Kpi, 'id'>) => {
    setKpis(prevKpis => prevKpis.map(k => 
      k.id === kpiId 
        ? { ...k, ...updatedKpiData, updatedAt: new Date().toISOString() }
        : k
    ));
  };
  
  const deleteKpi = (kpiId: string) => {
    setKpis(prevKpis => prevKpis.filter(k => k.id !== kpiId));
  };

  const assignKpi = (recordData: Omit<KpiRecord, 'id'>) => {
    const newRecord: KpiRecord = {
        id: `rec-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        ...recordData,
    };
    setKpiRecords(prev => [newRecord, ...prev]);
  };

  const updateKpiRecordActual = (recordId: string, actual: number) => {
    setKpiRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        // Calculate progress based on actual vs target
        const progress = Math.min(100, Math.max(0, (actual / rec.target) * 100));
        const newStatus = rec.status === 'not_started' ? 'in_progress' : rec.status;
        return { 
          ...rec, 
          actual, 
          progress,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      }
      return rec;
    }));
  };
  
  const submitKpiRecord = (recordId: string, submission: { actual: number; submissionDetails: string; attachment: string | null }) => {
    setKpiRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const progress = Math.min(100, Math.max(0, (submission.actual / rec.target) * 100));
        return { 
          ...rec, 
          actual: submission.actual,
          progress,
          submissionDetails: submission.submissionDetails,
          attachment: submission.attachment,
          submissionDate: new Date().toISOString(),
          status: 'pending_approval',
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      }
      return rec;
    }));
  };
  
  const updateKpiRecordStatus = (recordId: string, status: KpiStatus, feedback?: Feedback) => {
     setKpiRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const newFeedback = feedback ? [...rec.feedback, feedback] : rec.feedback;
        const approvalDate = (status === 'approved' || status === 'rejected') ? new Date().toISOString() : rec.approvalDate;
        return { 
          ...rec, 
          status, 
          feedback: newFeedback,
          approvalDate,
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      }
      return rec;
    }));
  };

  const addKpiFeedback = (recordId: string, feedback: Omit<Feedback, 'id'>) => {
    setKpiRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const newFeedback: Feedback = {
          id: `fb-${Date.now()}`,
          ...feedback,
        };
        return { 
          ...rec, 
          feedback: [...rec.feedback, newFeedback],
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      }
      return rec;
    }));
  };
  
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId 
        ? { ...n, read: true, updatedAt: new Date().toISOString() }
        : n
    ));
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ 
      ...n, 
      read: true, 
      updatedAt: new Date().toISOString() 
    })));
  };

  const addNotification = (notificationData: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...notificationData,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // --- GETTERS ---
  const getDepartments = useCallback(() => [...departments].sort((a, b) => a.name.localeCompare(b.name)), [departments]);
  const getDepartmentNames = useCallback(() => {
    const names = [...new Set(departments.map(d => d.name))].sort();
    return names.length > 0 ? names : ['IT', 'HR', 'Marketing', 'Finance', 'Operations'];
  }, [departments]);
  const getFrequencies = useCallback(() => {
    const frequencies = [...new Set(kpis.map(k => k.frequency))].sort();
    return frequencies.length > 0 ? frequencies : ['monthly', 'quarterly', 'annually'];
  }, [kpis]);
  const getKpiStatuses = useCallback(() => {
    const statuses = [...new Set(kpiRecords.map(r => r.status))].sort();
    return statuses.length > 0 ? statuses : ['not_started', 'in_progress', 'completed', 'pending_approval', 'approved', 'rejected', 'overdue'];
  }, [kpiRecords]);
  const getNotificationTypes = useCallback(() => {
    const types = [...new Set(notifications.map(n => n.type))].sort();
    return types.length > 0 ? types : ['assigned', 'reminder', 'approved', 'rejected', 'reward', 'deadline', 'system'];
  }, [notifications]);
  const getNotificationPriorities = useCallback(() => {
    const priorities = [...new Set(notifications.map(n => n.priority))].sort();
    return priorities.length > 0 ? priorities : ['low', 'medium', 'high', 'urgent'];
  }, [notifications]);
  const getNotificationCategories = useCallback(() => {
    const categories = [...new Set(notifications.map(n => n.category))].sort();
    return categories.length > 0 ? categories : ['kpi', 'bonus', 'system', 'deadline', 'approval'];
  }, [notifications]);

  // --- PROVIDER VALUE ---
  const value = {
    users,
    kpis,
    kpiRecords,
    notifications,
    departments,
    addUser,
    updateUser,
    addKpi,
    editKpi,
    deleteKpi,
    assignKpi,
    updateKpiRecordActual,
    submitKpiRecord,
    updateKpiRecordStatus,
    addKpiFeedback,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    addDepartment,
    getDepartments,
    getDepartmentNames,
    getFrequencies,
    getKpiStatuses,
    getNotificationTypes,
    getNotificationPriorities,
    getNotificationCategories,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
