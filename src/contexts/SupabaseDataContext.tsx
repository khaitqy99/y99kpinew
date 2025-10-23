'use client';

import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext } from 'react';
import { 
  employeeService, 
  departmentService, 
  kpiService, 
  kpiRecordService, 
  notificationService,
  dailyKpiProgressService,
  companyService,
  roleService,
  type Employee,
  type Department,
  type Kpi,
  type KpiRecord,
  type Notification,
  type DailyKpiProgress
} from '@/services/supabase-service';
import { notificationManager } from '@/services/notification-service';
import { notificationScheduler } from '@/services/notification-scheduler';
import { SessionContext } from './SessionContext';

// Type definitions
export type KpiStatus = KpiRecord['status'];
export type Feedback = {
  id: string;
  comment: string;
  rating: number;
  createdBy: string;
  createdAt: string;
};

// Context type
type SupabaseDataContextType = {
  // State
  users: any[];
  kpis: Kpi[];
  kpiRecords: KpiRecord[];
  dailyKpiProgress: DailyKpiProgress[];
  notifications: Notification[];
  departments: Department[];
  companies: any[];
  roles: any[];

  // Loading states
  loading: {
    users: boolean;
    kpis: boolean;
    kpiRecords: boolean;
    dailyKpiProgress: boolean;
    notifications: boolean;
    departments: boolean;
    companies: boolean;
    roles: boolean;
  };

  // Actions
  addUser: (user: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUser: (userId: string, updatedUser: Partial<any>) => Promise<void>;
  addKpi: (kpi: Omit<Kpi, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editKpi: (kpiId: string, updatedKpi: Omit<Kpi, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteKpi: (kpiId: string) => Promise<void>;
  assignKpi: (record: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at' | 'last_updated'>) => Promise<void>;
  addKpiRecord: (record: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at' | 'last_updated'>) => Promise<void>;
  editKpiRecord: (recordId: string, updatedRecord: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at' | 'last_updated'>) => Promise<void>;
  deleteKpiRecord: (recordId: string) => Promise<void>;
  addDailyKpiProgress: (progress: Omit<DailyKpiProgress, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editDailyKpiProgress: (progressId: string, updatedProgress: Omit<DailyKpiProgress, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteDailyKpiProgress: (progressId: string) => Promise<void>;
  updateKpiRecordActual: (recordId: string, actual: number) => Promise<void>;
  submitKpiRecord: (recordId: string, submission: { actual: number; submissionDetails: string; attachment: string | null }) => Promise<void>;
  updateKpiRecordStatus: (recordId: string, status: KpiStatus, feedback?: Feedback) => Promise<void>;
  addKpiFeedback: (recordId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addDepartment: (department: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => Promise<void>;
  updateDepartment: (departmentId: string, updatedDepartment: Partial<Department>) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  addCompany: (company: any) => Promise<void>;
  updateCompany: (companyId: string, updatedCompany: any) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  addRole: (role: any) => Promise<void>;
  updateRole: (roleId: string, updatedRole: any) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;

  // Getters
  getDepartments: () => Department[];
  getDepartmentNames: () => string[];
  getFrequencies: () => string[];
  getKpiCategories: () => string[];
  getKpiStatuses: () => string[];
  getNotificationTypes: () => string[];
  getNotificationPriorities: () => string[];
  getNotificationCategories: () => string[];

  // Refresh functions
  refreshUsers: () => Promise<void>;
  refreshKpis: () => Promise<void>;
  refreshKpiRecords: () => Promise<void>;
  refreshDailyKpiProgress: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshDepartments: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

// Context creation
export const SupabaseDataContext = createContext<SupabaseDataContextType>({} as SupabaseDataContextType);

// Provider component
export const SupabaseDataProvider = ({ children }: { children: ReactNode }) => {
  const { user: currentUser } = useContext(SessionContext);
  const [users, setUsers] = useState<any[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [dailyKpiProgress, setDailyKpiProgress] = useState<DailyKpiProgress[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [loading, setLoading] = useState({
    users: false,
    kpis: false,
    kpiRecords: false,
    dailyKpiProgress: false,
    notifications: false,
    departments: false,
    companies: false,
    roles: false,
  });

  // Load data functions
  const loadUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const data = await employeeService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  const loadKpis = useCallback(async () => {
    setLoading(prev => ({ ...prev, kpis: true }));
    try {
      const data = await kpiService.getAll();
      setKpis(data);
    } catch (error) {
      console.error('Error loading kpis:', error);
    } finally {
      setLoading(prev => ({ ...prev, kpis: false }));
    }
  }, []);

  const loadKpiRecords = useCallback(async () => {
    setLoading(prev => ({ ...prev, kpiRecords: true }));
    try {
      const data = await kpiRecordService.getAll();
      setKpiRecords(data);
    } catch (error) {
      console.error('Error loading kpi records:', error);
    } finally {
      setLoading(prev => ({ ...prev, kpiRecords: false }));
    }
  }, []);

  const loadDailyKpiProgress = useCallback(async () => {
    setLoading(prev => ({ ...prev, dailyKpiProgress: true }));
    try {
      const data = await dailyKpiProgressService.getAll();
      setDailyKpiProgress(data);
    } catch (error) {
      console.error('Error loading daily KPI progress:', error);
    } finally {
      setLoading(prev => ({ ...prev, dailyKpiProgress: false }));
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    setLoading(prev => ({ ...prev, departments: true }));
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    setLoading(prev => ({ ...prev, companies: true }));
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  }, []);

  const loadRoles = useCallback(async () => {
    setLoading(prev => ({ ...prev, roles: true }));
    try {
      const data = await roleService.getAll();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    loadUsers();
    loadKpis();
    loadKpiRecords();
    loadDailyKpiProgress();
    loadNotifications();
    loadDepartments();
    loadCompanies();
    loadRoles();
    
    // Khởi động notification scheduler
    notificationScheduler.startScheduler();
    
    // Cleanup khi component unmount
    return () => {
      notificationScheduler.stopScheduler();
    };
  }, []);

  // Action functions
  const addUser = async (userData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await employeeService.create(userData);
      await loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updatedUserData: Partial<any>) => {
    try {
      await employeeService.update(userId, updatedUserData);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const addDepartment = async (deptData: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
    try {
      // Lấy company_id mặc định
      const company = await companyService.getDefault();
      if (!company) {
        throw new Error('Không tìm thấy company mặc định');
      }
      
      // Thêm company_id vào dữ liệu department
      const departmentWithCompany = {
        ...deptData,
        company_id: company.id
      };
      
      await departmentService.create(departmentWithCompany);
      await loadDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      throw error;
    }
  };

  const addCompany = async (companyData: any) => {
    try {
      await companyService.create(companyData);
      await loadCompanies();
    } catch (error) {
      console.error('Error adding company:', error);
      throw error;
    }
  };

  const addRole = async (roleData: any) => {
    try {
      await roleService.create(roleData);
      await loadRoles();
    } catch (error) {
      console.error('Error adding role:', error);
      throw error;
    }
  };

  const updateDepartment = async (departmentId: string, updatedDepartmentData: Partial<Department>) => {
    try {
      await departmentService.update(departmentId, updatedDepartmentData);
      await loadDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    try {
      await departmentService.delete(departmentId);
      await loadDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  };

  const updateCompany = async (companyId: string, updatedCompanyData: any) => {
    try {
      await companyService.update(companyId, updatedCompanyData);
      await loadCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  };

  const deleteCompany = async (companyId: string) => {
    try {
      await companyService.delete(companyId);
      await loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  };

  const updateRole = async (roleId: string, updatedRoleData: any) => {
    try {
      await roleService.update(roleId, updatedRoleData);
      await loadRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      await roleService.delete(roleId);
      await loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  };

  const addKpi = async (kpiData: Omit<Kpi, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Get default company for KPI
      const company = await companyService.getDefault();
      if (!company) {
        throw new Error('Không tìm thấy công ty mặc định');
      }

      // Map UI fields to DB columns; avoid sending unknown fields
      const payload: any = {
        company_id: company.id,
        name: (kpiData as any).name,
        description: (kpiData as any).description || null,
        target: Number((kpiData as any).target) || null,
        unit: (kpiData as any).unit || null,
        frequency: (kpiData as any).frequency || null,
        category: (kpiData as any).category || 'performance',
        weight: Number((kpiData as any).weight) || 1,
        status: (kpiData as any).status || 'active',
        reward_penalty_config: (kpiData as any).rewardPenaltyConfig || null,
        created_by: null, // Will be set by current user context
        is_active: true,
      }
      await kpiService.create(payload);
      await loadKpis();
    } catch (error) {
      console.error('Error adding kpi:', error);
      throw error;
    }
  };
  
  const editKpi = async (kpiId: string, updatedKpiData: Omit<Kpi, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const updates: any = {
        name: (updatedKpiData as any).name,
        description: (updatedKpiData as any).description || null,
        target: Number((updatedKpiData as any).target) || null,
        unit: (updatedKpiData as any).unit || null,
        frequency: (updatedKpiData as any).frequency || null,
        category: (updatedKpiData as any).category || 'performance',
        weight: Number((updatedKpiData as any).weight) || 1,
        status: (updatedKpiData as any).status || 'active',
        reward_penalty_config: (updatedKpiData as any).rewardPenaltyConfig || null,
      }
      await kpiService.update(kpiId, updates);
      await loadKpis();
    } catch (error) {
      console.error('Error editing kpi:', error);
      throw error;
    }
  };
  
  const deleteKpi = async (kpiId: string) => {
    try {
      await kpiService.delete(kpiId);
      await loadKpis();
    } catch (error) {
      console.error('Error deleting kpi:', error);
      throw error;
    }
  };

  const assignKpi = async (recordData: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at' | 'last_updated'>) => {
    try {
      console.log('Assigning KPI with data:', recordData);
      
      const createdRecord = await kpiRecordService.create(recordData);
      console.log('KPI record created successfully:', createdRecord);
      
      await loadKpiRecords();
      
      // Tạo thông báo cho người được giao KPI
      const assigneeInfo = {
        id: recordData.employee_id || recordData.department_id || '',
        name: recordData.employee_id ? 
          users.find(u => u.id === recordData.employee_id)?.name || 'Nhân viên' :
          departments.find(d => d.id === recordData.department_id)?.name || 'Phòng ban',
        type: recordData.employee_id ? 'employee' as const : 'department' as const
      };
      
      console.log('Assignee info:', assigneeInfo);
      
      // Chỉ gửi thông báo nếu có assignee hợp lệ
      if (assigneeInfo.id && assigneeInfo.id !== '') {
        const kpiInfo = kpis.find(k => k.id === recordData.kpi_id);
        const notificationData = {
          ...createdRecord,
          kpi_name: kpiInfo?.name || 'KPI',
          unit: kpiInfo?.unit || '',
          period: recordData.period || '',
          employee_name: assigneeInfo.name
        };
        
        try {
          await notificationManager.notifyKpiAssigned(notificationData, assigneeInfo);
        } catch (notificationError) {
          console.warn('Failed to send notification:', notificationError);
          // Không throw error để không làm gián đoạn việc assign KPI
        }
      } else {
        console.warn('No valid assignee found, skipping notification');
      }
    } catch (error) {
      console.error('Error assigning kpi:', error);
      console.error('Record data:', recordData);
      throw error;
    }
  };

  const updateKpiRecordActual = async (recordId: string, actual: number) => {
    try {
      const record = await kpiRecordService.getById(recordId);
      if (!record) throw new Error('Record not found');
      
      const progress = Math.min(100, Math.max(0, Math.round((actual / record.target) * 100)));
      const newStatus = record.status === 'not_started' ? 'in_progress' : record.status;
      
      await kpiRecordService.update(recordId, {
        actual,
        progress,
        status: newStatus,
      });
      await loadKpiRecords();
    } catch (error) {
      console.error('Error updating kpi record actual:', error);
      throw error;
    }
  };
  
  const submitKpiRecord = async (recordId: string, submission: { actual: number; submissionDetails: string; attachment: string | null }) => {
    try {
      const record = await kpiRecordService.getById(recordId);
      if (!record) throw new Error('Record not found');
      
      const progress = Math.min(100, Math.max(0, Math.round((submission.actual / record.target) * 100)));
      
      await kpiRecordService.update(recordId, {
        actual: submission.actual,
        progress,
        submission_details: submission.submissionDetails,
        attachment: submission.attachment,
        submission_date: new Date().toISOString(),
        status: 'pending_approval',
      });
      await loadKpiRecords();
      
      // Tạo thông báo cho admin khi submit
      const submitterInfo = {
        id: record.employee_id || '',
        name: users.find(u => u.id === record.employee_id)?.name || 'Nhân viên'
      };
      
      const kpiInfo = kpis.find(k => k.id === record.kpi_id);
      const notificationData = {
        ...record,
        kpi_name: kpiInfo?.name || 'KPI',
        unit: kpiInfo?.unit || '',
        period: record.period || '',
        employee_name: submitterInfo.name,
        actual: submission.actual
      };
      
      try {
        await notificationManager.notifyKpiSubmitted(notificationData, submitterInfo);
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Không throw error để không làm gián đoạn việc submit KPI
      }
    } catch (error) {
      console.error('Error submitting kpi record:', error);
      console.error('Error details:', {
        recordId,
        submission,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };
  
  const updateKpiRecordStatus = async (recordId: string, status: KpiStatus, feedback?: Feedback) => {
    try {
      const record = await kpiRecordService.getById(recordId);
      if (!record) throw new Error('Record not found');
      
      const newFeedback = feedback ? [...record.feedback, feedback] : record.feedback;
      const approvalDate = (status === 'approved' || status === 'rejected') ? new Date().toISOString() : record.approval_date;
      
      await kpiRecordService.update(recordId, {
        status,
        feedback: newFeedback,
        approval_date: approvalDate,
      });
      await loadKpiRecords();
      
      // Tạo thông báo cho nhân viên khi approve/reject
      const approverInfo = {
        id: 'admin', // Hoặc lấy từ current user
        name: 'Quản lý'
      };
      
      const kpiInfo = kpis.find(k => k.id === record.kpi_id);
      const notificationData = {
        ...record,
        kpi_name: kpiInfo?.name || 'KPI',
        unit: kpiInfo?.unit || '',
        period: record.period || '',
        employee_name: users.find(u => u.id === record.employee_id)?.name || 'Nhân viên',
        score: record.score
      };
      
      try {
        await notificationManager.notifyKpiApproved(notificationData, approverInfo, status);
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Không throw error để không làm gián đoạn việc approve/reject KPI
      }
      
      // Gửi thông báo bonus/penalty nếu được approve
      if (status === 'approved') {
        const kpiInfo = kpis.find(k => k.id === record.kpi_id);
        if (kpiInfo) {
          const { bonusAmount, penaltyAmount } = notificationScheduler.calculateBonusPenalty(record, kpiInfo);
          if (bonusAmount > 0 || penaltyAmount > 0) {
            await notificationScheduler.sendBonusPenaltyNotification(notificationData, bonusAmount, penaltyAmount);
          }
        }
      }
    } catch (error) {
      console.error('Error updating kpi record status:', error);
      throw error;
    }
  };

  const addKpiFeedback = async (recordId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) => {
    try {
      const record = await kpiRecordService.getById(recordId);
      if (!record) throw new Error('Record not found');
      
      const newFeedback: Feedback = {
        id: `fb-${Date.now()}`,
        ...feedback,
        createdAt: new Date().toISOString(),
      };
      
      await kpiRecordService.update(recordId, {
        feedback: [...record.feedback, newFeedback],
      });
      await loadKpiRecords();
    } catch (error) {
      console.error('Error adding kpi feedback:', error);
      throw error;
    }
  };

  const addKpiRecord = async (recordData: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at' | 'last_updated'>) => {
    try {
      console.log('Adding KPI record with data:', recordData);
      
      const createdRecord = await kpiRecordService.create(recordData);
      console.log('KPI record created successfully:', createdRecord);
      
      await loadKpiRecords();
    } catch (error) {
      console.error('Error adding kpi record:', error);
      console.error('Record data:', recordData);
      throw error;
    }
  };

  const editKpiRecord = async (recordId: string, updatedRecordData: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at' | 'last_updated'>) => {
    try {
      console.log('Editing KPI record:', recordId, 'with data:', updatedRecordData);
      
      await kpiRecordService.update(recordId, updatedRecordData);
      await loadKpiRecords();
    } catch (error) {
      console.error('Error editing kpi record:', error);
      console.error('Record data:', updatedRecordData);
      throw error;
    }
  };

  const deleteKpiRecord = async (recordId: string) => {
    try {
      await kpiRecordService.delete(recordId);
      await loadKpiRecords();
    } catch (error) {
      console.error('Error deleting kpi record:', error);
      throw error;
    }
  };

  const addDailyKpiProgress = async (progressData: Omit<DailyKpiProgress, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Adding daily KPI progress with data:', progressData);
      
      const createdProgress = await dailyKpiProgressService.create(progressData);
      console.log('Daily KPI progress created successfully:', createdProgress);
      
      await loadDailyKpiProgress();
    } catch (error) {
      console.error('Error adding daily KPI progress:', error);
      console.error('Progress data:', progressData);
      throw error;
    }
  };

  const editDailyKpiProgress = async (progressId: string, updatedProgressData: Omit<DailyKpiProgress, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Editing daily KPI progress:', progressId, 'with data:', updatedProgressData);
      
      await dailyKpiProgressService.update(progressId, updatedProgressData);
      await loadDailyKpiProgress();
    } catch (error) {
      console.error('Error editing daily KPI progress:', error);
      console.error('Progress data:', updatedProgressData);
      throw error;
    }
  };

  const deleteDailyKpiProgress = async (progressId: string) => {
    try {
      await dailyKpiProgressService.delete(progressId);
      await loadDailyKpiProgress();
    } catch (error) {
      console.error('Error deleting daily KPI progress:', error);
      throw error;
    }
  };
  
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };
  
  const markAllNotificationsAsRead = async () => {
    try {
      if (currentUser?.id) {
        await notificationService.markAllAsRead(currentUser.id);
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await notificationService.create(notificationData);
      await loadNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  };

  // Getter functions
  const getDepartments = useCallback(() => [...departments].sort((a, b) => a.name.localeCompare(b.name)), [departments]);
  const getDepartmentNames = useCallback(() => [...new Set(departments.map(d => d.name))].sort(), [departments]);
  const getFrequencies = useCallback(() => [...new Set(kpis.map(k => k.frequency))].sort(), [kpis]);
  const getKpiCategories = useCallback(() => [...new Set(kpis.map(k => k.category))].sort(), [kpis]);
  const getKpiStatuses = useCallback(() => [...new Set(kpiRecords.map(r => r.status))].sort(), [kpiRecords]);
  const getNotificationTypes = useCallback(() => [...new Set(notifications.map(n => n.type))].sort(), [notifications]);
  const getNotificationPriorities = useCallback(() => [...new Set(notifications.map(n => n.priority))].sort(), [notifications]);
  const getNotificationCategories = useCallback(() => [...new Set(notifications.map(n => n.category))].sort(), [notifications]);

  // Provider value
  const value = {
    users,
    kpis,
    kpiRecords,
    dailyKpiProgress,
    notifications,
    departments,
    companies,
    roles,
    loading,
    addUser,
    updateUser,
    addKpi,
    editKpi,
    deleteKpi,
    assignKpi,
    addKpiRecord,
    editKpiRecord,
    deleteKpiRecord,
    addDailyKpiProgress,
    editDailyKpiProgress,
    deleteDailyKpiProgress,
    updateKpiRecordActual,
    submitKpiRecord,
    updateKpiRecordStatus,
    addKpiFeedback,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addCompany,
    updateCompany,
    deleteCompany,
    addRole,
    updateRole,
    deleteRole,
    getDepartments,
    getDepartmentNames,
    getFrequencies,
    getKpiCategories,
    getKpiStatuses,
    getNotificationTypes,
    getNotificationPriorities,
    getNotificationCategories,
    refreshUsers: loadUsers,
    refreshKpis: loadKpis,
    refreshKpiRecords: loadKpiRecords,
    refreshDailyKpiProgress: loadDailyKpiProgress,
    refreshNotifications: loadNotifications,
    refreshDepartments: loadDepartments,
    refreshCompanies: loadCompanies,
    refreshRoles: loadRoles,
  };

  return (
    <SupabaseDataContext.Provider value={value}>
      {children}
    </SupabaseDataContext.Provider>
  );
};
