'use client';

import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext, useMemo } from 'react';
import { 
  employeeService, 
  departmentService, 
  branchService,
  kpiService, 
  kpiRecordService, 
  notificationService,
  dailyKpiProgressService,
  roleService,
  kpiSubmissionService,
  type Employee,
  type Department,
  type Branch,
  type Kpi,
  type KpiRecord,
  type Notification,
  type DailyKpiProgress,
  type KpiSubmissionItemInsert
} from '@/services/supabase-service';
import { notificationManager } from '@/services/notification-service';
import { notificationScheduler } from '@/services/notification-scheduler';
import { SessionContext } from './SessionContext';
import { supabase } from '@/lib/supabase';

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
  branches: Branch[];
  roles: any[];
  kpiSubmissions: any[];
  // Raw data (unfiltered) - for pages that need all data regardless of selected branch
  allUsers: any[];
  allDepartments: Department[];

  // Loading states
  loading: {
    users: boolean;
    kpis: boolean;
    kpiRecords: boolean;
    dailyKpiProgress: boolean;
    notifications: boolean;
    departments: boolean;
    branches: boolean;
    roles: boolean;
    kpiSubmissions: boolean;
  };

  // Actions
  addUser: (user: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Promise<Employee>;
  updateUser: (userId: string, updatedUser: Partial<any>) => Promise<void>;
  deleteUser: (userId: string | number) => Promise<void>;
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
  submitMultiKpiSubmission: (employeeId: number, items: Array<{ kpiRecordId: number; actual: number; notes?: string }>, submissionDetails: string, attachment: string | null) => Promise<void>;
  approveKpiSubmission: (submissionId: number, approvedBy: number) => Promise<void>;
  rejectKpiSubmission: (submissionId: number, rejectedBy: number, reason: string) => Promise<void>;
  updateKpiRecordStatus: (recordId: string, status: KpiStatus, feedback?: Feedback) => Promise<void>;
  addKpiFeedback: (recordId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addDepartment: (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDepartment: (departmentId: string, updatedDepartment: Partial<Department>) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  addBranch: (branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBranch: (branchId: string | number, updatedBranch: Partial<Branch>) => Promise<void>;
  deleteBranch: (branchId: string | number) => Promise<void>;
  addRole: (role: any) => Promise<void>;
  updateRole: (roleId: string, updatedRole: any) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;

  // Getters
  getDepartments: () => Department[];
  getDepartmentNames: () => string[];
  getFrequencies: () => string[];
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
  refreshRoles: () => Promise<void>;
  refreshKpiSubmissions: () => Promise<void>;
};

// Context creation
export const SupabaseDataContext = createContext<SupabaseDataContextType>({} as SupabaseDataContextType);

// Provider component
export const SupabaseDataProvider = ({ children }: { children: ReactNode }) => {
  const { user: currentUser, selectedBranch } = useContext(SessionContext);
  const [users, setUsers] = useState<any[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [dailyKpiProgress, setDailyKpiProgress] = useState<DailyKpiProgress[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [kpiSubmissions, setKpiSubmissions] = useState<any[]>([]);

  const [loading, setLoading] = useState({
    users: false,
    kpis: false,
    kpiRecords: false,
    dailyKpiProgress: false,
    notifications: false,
    departments: false,
    branches: false,
    roles: false,
    kpiSubmissions: false,
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
      // Đảm bảo feedback luôn là array cho mỗi record
      const transformedData = data.map(record => ({
        ...record,
        feedback: Array.isArray((record as any).feedback) ? (record as any).feedback : []
      }));
      setKpiRecords(transformedData as any);
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

  const loadKpiSubmissions = useCallback(async () => {
    setLoading(prev => ({ ...prev, kpiSubmissions: true }));
    try {
      const data = await kpiSubmissionService.getAll();
      setKpiSubmissions(data);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'message' in error)
          ? String((error as any).message)
          : 'Unknown error occurred';
      
      console.error('Error loading KPI submissions:', {
        error,
        message: errorMessage,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      
      // Set empty array on error to prevent UI issues
      setKpiSubmissions([]);
    } finally {
      setLoading(prev => ({ ...prev, kpiSubmissions: false }));
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

  const loadBranches = useCallback(async () => {
    setLoading(prev => ({ ...prev, branches: true }));
    try {
      const data = await branchService.getAll();
      setBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
      // Nếu bảng branches chưa tồn tại, set empty array
      setBranches([]);
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
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

  // Filter data by selected branch
  const filteredDepartments = useMemo(() => {
    if (!selectedBranch?.id) return departments;
    return departments.filter((dept: any) => dept.branch_id === selectedBranch.id);
  }, [departments, selectedBranch]);

  const filteredUsers = useMemo(() => {
    if (!selectedBranch?.id) return users;
    const branchDepartmentIds = filteredDepartments.map((d: any) => d.id);
    return users.filter((user: any) => {
      // Check if user belongs to any department in this branch
      // Support both old format (department_id) and new format (department_ids, all_departments)
      const userDeptIds = user.department_ids || 
                          (user.all_departments ? user.all_departments.map((d: any) => d.id) : []) ||
                          (user.department_id ? [user.department_id] : []);
      
      // Check if any of user's departments is in the branch
      return userDeptIds.some((deptId: number) => branchDepartmentIds.includes(deptId));
    });
  }, [users, filteredDepartments, selectedBranch]);

  const filteredKpis = useMemo(() => {
    if (!selectedBranch?.id) return kpis;
    const branchDepartmentIds = filteredDepartments.map((d: any) => d.id);
    return kpis.filter((kpi: any) => branchDepartmentIds.includes(kpi.department_id));
  }, [kpis, filteredDepartments, selectedBranch]);

  const filteredKpiRecords = useMemo(() => {
    if (!selectedBranch?.id) return kpiRecords;
    const branchDepartmentIds = filteredDepartments.map((d: any) => d.id);
    const branchUserIds = filteredUsers.map((u: any) => u.id);
    return kpiRecords.filter((record: any) => 
      (record.employee_id && branchUserIds.includes(record.employee_id)) ||
      (record.department_id && branchDepartmentIds.includes(record.department_id))
    );
  }, [kpiRecords, filteredDepartments, filteredUsers, selectedBranch]);

  const filteredDailyKpiProgress = useMemo(() => {
    if (!selectedBranch?.id) return dailyKpiProgress;
    const branchDepartmentIds = filteredDepartments.map((d: any) => d.id);
    const branchUserIds = filteredUsers.map((u: any) => u.id);
    return dailyKpiProgress.filter((progress: any) => 
      (progress.department_id && branchDepartmentIds.includes(progress.department_id)) ||
      (progress.employee_id && branchUserIds.includes(progress.employee_id))
    );
  }, [dailyKpiProgress, filteredDepartments, filteredUsers, selectedBranch]);

  // Load all data on mount
  useEffect(() => {
    loadUsers();
    loadKpis();
    loadKpiRecords();
    loadDailyKpiProgress();
    loadNotifications();
    loadDepartments();
    loadBranches();
    loadRoles();
    loadKpiSubmissions();
    
    // Khởi động notification scheduler
    notificationScheduler.startScheduler();
    
    // Set up realtime subscriptions
    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    // Subscribe to notifications for real-time updates
    const notificationChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('Notification realtime update:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => notificationChannel.unsubscribe() });

    // Subscribe to KPI records for real-time updates
    const kpiRecordsChannel = supabase
      .channel('kpi-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kpi_records',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('KPI records realtime update:', payload);
          loadKpiRecords();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => kpiRecordsChannel.unsubscribe() });

    // Subscribe to daily KPI progress for real-time updates
    const dailyKpiProgressChannel = supabase
      .channel('daily-kpi-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_kpi_progress',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('Daily KPI progress realtime update:', payload);
          loadDailyKpiProgress();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => dailyKpiProgressChannel.unsubscribe() });

    // Subscribe to KPIs for real-time updates
    const kpisChannel = supabase
      .channel('kpis-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kpis',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('KPIs realtime update:', payload);
          loadKpis();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => kpisChannel.unsubscribe() });

    // Subscribe to departments for real-time updates
    const departmentsChannel = supabase
      .channel('departments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departments',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('Departments realtime update:', payload);
          loadDepartments();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => departmentsChannel.unsubscribe() });

    // Subscribe to employees for real-time updates
    const employeesChannel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('Employees realtime update:', payload);
          loadUsers();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => employeesChannel.unsubscribe() });

    // Subscribe to roles for real-time updates
    const rolesChannel = supabase
      .channel('roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roles',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('Roles realtime update:', payload);
          loadRoles();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => rolesChannel.unsubscribe() });

    // Subscribe to KPI submissions for real-time updates
    const kpiSubmissionsChannel = supabase
      .channel('kpi-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kpi_submissions',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('KPI submissions realtime update:', payload);
          // When submission changes, also reload KPI records since they are linked
          loadKpiSubmissions();
          loadKpiRecords();
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => kpiSubmissionsChannel.unsubscribe() });

    // Subscribe to bonus_penalty_records for real-time updates
    const bonusPenaltyChannel = supabase
      .channel('bonus-penalty-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bonus_penalty_records',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('Bonus/Penalty records realtime update:', payload);
          // Note: bonus_penalty_records không có trong context state, nhưng có thể cần refresh trong components
        }
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => bonusPenaltyChannel.unsubscribe() });
    
    // Cleanup khi component unmount
    return () => {
      notificationScheduler.stopScheduler();
      // Unsubscribe from all realtime channels
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [
    loadUsers,
    loadKpis,
    loadKpiRecords,
    loadDailyKpiProgress,
    loadNotifications,
    loadDepartments,
    loadRoles,
    loadKpiSubmissions
  ]);

  // Action functions
  const addUser = async (userData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const createdUser = await employeeService.create(userData);
      await loadUsers();
      return createdUser;
    } catch (error: any) {
      // Log detailed error information
      const errorMessage = error?.message || 
                          error?.details || 
                          error?.hint || 
                          (typeof error === 'string' ? error : 'Unknown error occurred');
      const errorCode = error?.code;
      const errorDetails = {
        message: errorMessage,
        code: errorCode,
        details: error?.details,
        hint: error?.hint,
        error: error
      };
      console.error('Error adding user:', errorDetails);
      throw new Error(errorMessage);
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

  const deleteUser = async (userId: string | number) => {
    try {
      const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      await employeeService.delete(id);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const addDepartment = async (deptData: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await departmentService.create(deptData);
      await loadDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
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

  const updateDepartment = async (departmentId: string | number, updatedDepartmentData: Partial<Department>) => {
    try {
      const id = typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId;
      await departmentService.update(id, updatedDepartmentData);
      await loadDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  };

  const deleteDepartment = async (departmentId: string | number) => {
    try {
      const id = typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId;
      await departmentService.delete(id);
      await loadDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  };

  const addBranch = async (branchData: Omit<Branch, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await branchService.create(branchData);
      await loadBranches();
    } catch (error) {
      console.error('Error adding branch:', error);
      throw error;
    }
  };

  const updateBranch = async (branchId: string | number, updatedBranchData: Partial<Branch>) => {
    try {
      const id = typeof branchId === 'string' ? parseInt(branchId, 10) : branchId;
      await branchService.update(id, updatedBranchData);
      await loadBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  };

  const deleteBranch = async (branchId: string | number) => {
    try {
      const id = typeof branchId === 'string' ? parseInt(branchId, 10) : branchId;
      await branchService.delete(id);
      await loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
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
      // Find department by name to get department_id
      const departmentName = (kpiData as any).department;
      const department = departments.find(d => d.name === departmentName);
      if (!department) {
        throw new Error(`Không tìm thấy phòng ban: ${departmentName}`);
      }

      // Map UI fields to DB columns; avoid sending unknown fields
      const payload: any = {
        name: (kpiData as any).name,
        description: (kpiData as any).description || null,
        department_id: department.id, // Use department_id instead of department name
        target: Number((kpiData as any).target) || null,
        unit: (kpiData as any).unit || null,
        frequency: (kpiData as any).frequency || null,
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
      // Find department by name to get department_id if department is being updated
      let departmentId = null;
      if ((updatedKpiData as any).department) {
        const departmentName = (updatedKpiData as any).department;
        const department = departments.find(d => d.name === departmentName);
        if (!department) {
          throw new Error(`Không tìm thấy phòng ban: ${departmentName}`);
        }
        departmentId = department.id;
      }

      const updates: any = {
        name: (updatedKpiData as any).name,
        description: (updatedKpiData as any).description || null,
        target: Number((updatedKpiData as any).target) || null,
        unit: (updatedKpiData as any).unit || null,
        frequency: (updatedKpiData as any).frequency || null,
        status: (updatedKpiData as any).status || 'active',
        reward_penalty_config: (updatedKpiData as any).rewardPenaltyConfig || null,
      }
      
      // Only update department_id if department is being changed
      if (departmentId) {
        updates.department_id = departmentId;
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
      const assigneeId = recordData.employee_id || recordData.department_id;
      const assigneeInfo = {
        id: assigneeId ? String(assigneeId) : '',
        name: recordData.employee_id ? 
          users.find(u => u.id === recordData.employee_id)?.name || 'Nhân viên' :
          departments.find(d => d.id === recordData.department_id)?.name || 'Phòng ban',
        type: recordData.employee_id ? 'employee' as const : 'department' as const
      };
      
      console.log('Assignee info:', assigneeInfo);
      
      // Chỉ gửi thông báo nếu có assignee hợp lệ
      if (assigneeInfo.id && assigneeInfo.id !== '' && assigneeId) {
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
      // Convert string ID to number
      const numericId = parseInt(recordId, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid record ID: ${recordId}`);
      }

      const record = await kpiRecordService.getById(numericId);
      if (!record) {
        throw new Error(`KPI record với ID ${recordId} không tồn tại`);
      }
      
      // Calculate progress, allow > 100% if actual exceeds target
      const calculatedProgress = (actual / record.target) * 100;
      const progress = Math.max(0, Math.round(calculatedProgress * 100) / 100); // Round to 2 decimal places
      const newStatus = record.status === 'not_started' ? 'in_progress' : record.status;
      
      await kpiRecordService.update(numericId, {
        actual,
        progress,
        status: newStatus,
      });
      await loadKpiRecords();

      // Thông báo cho admin khi nhân viên cập nhật tiến độ
      try {
        // Lấy thông tin employee và KPI để tạo thông báo
        const employee = record.employee_id ? await employeeService.getById(record.employee_id) : null;
        const kpi = record.kpi_id ? await kpiService.getById(record.kpi_id) : null;
        
        if (employee && kpi) {
          const employeeInfo = {
            id: employee.id.toString(),
            name: employee.name
          };
          
          const kpiRecordForNotification = {
            id: record.id,
            kpi_id: kpi.id,
            kpi_name: kpi.name,
            unit: kpi.unit || '',
            period: record.period
          };
          
          await notificationManager.notifyKpiProgressUpdated(
            kpiRecordForNotification,
            employeeInfo,
            actual,
            progress
          );
        }
      } catch (notificationError) {
        // Log error nhưng không throw để không ảnh hưởng đến việc cập nhật tiến độ
        console.error('Error creating progress update notification:', notificationError);
      }
    } catch (error: any) {
      console.error('Error updating kpi record actual:', error);
      console.error('Error details:', {
        recordId,
        actual,
        numericId: parseInt(recordId, 10),
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : [],
        errorString: String(error),
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
      });
      
      // Provide better error message
      let errorMessage = 'Không thể cập nhật tiến độ KPI';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      throw new Error(errorMessage);
    }
  };
  
  const submitKpiRecord = async (recordId: string, submission: { actual: number; submissionDetails: string; attachment: string | null }) => {
    try {
      // Convert string ID to number
      const numericId = parseInt(recordId, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid record ID: ${recordId}`);
      }

      const record = await kpiRecordService.getById(numericId);
      if (!record) {
        throw new Error(`KPI record với ID ${recordId} không tồn tại`);
      }
      
      // Kiểm tra trạng thái: không cho phép submit nếu đã completed hoặc approved
      if (record.status === 'completed' || record.status === 'approved') {
        throw new Error(`KPI này đã ${record.status === 'completed' ? 'hoàn thành' : 'được duyệt'} và không thể nộp lại báo cáo.`);
      }
      
      // Calculate progress, allow > 100% if actual exceeds target
      const calculatedProgress = (submission.actual / record.target) * 100;
      const progress = Math.max(0, Math.round(calculatedProgress * 100) / 100); // Round to 2 decimal places
      
      await kpiRecordService.update(numericId, {
        actual: submission.actual,
        progress,
        submission_details: submission.submissionDetails,
        attachment: submission.attachment,
        submission_date: new Date().toISOString(),
        status: 'pending_approval',
      });
      await loadKpiRecords();
      
      // Tạo thông báo cho admin khi submit
      if (record.employee_id) {
        const submitterInfo = {
          id: String(record.employee_id),
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
      } else {
        console.warn('Cannot send notification: employee_id is missing');
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
      // Convert recordId to number if it's a string
      const id = typeof recordId === 'string' ? parseInt(recordId, 10) : recordId;
      if (isNaN(id)) throw new Error('Invalid record ID');
      
      const record = await kpiRecordService.getById(id);
      if (!record) throw new Error('Record not found');
      
      // Đảm bảo feedback luôn là array (xử lý trường hợp null, undefined, hoặc không phải array)
      const currentFeedback = Array.isArray((record as any).feedback) ? (record as any).feedback : [];
      const newFeedback = feedback ? [...currentFeedback, feedback] : currentFeedback;
      const approvalDate = (status === 'approved' || status === 'rejected') ? new Date().toISOString() : record.approval_date;
      
      // Chỉ update feedback nếu có cột feedback trong database
      const updateData: any = {
        status,
        approval_date: approvalDate,
      };
      
      // Chỉ thêm feedback nếu database hỗ trợ (có thể comment lại nếu database chưa có cột feedback)
      // updateData.feedback = newFeedback;
      
      await kpiRecordService.update(id, updateData);
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
      // Convert string ID to number
      const numericId = parseInt(recordId, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid record ID: ${recordId}`);
      }

      const record = await kpiRecordService.getById(numericId);
      if (!record) {
        throw new Error(`KPI record với ID ${recordId} không tồn tại`);
      }
      
      // Đảm bảo feedback luôn là array (xử lý trường hợp null, undefined, hoặc không phải array)
      const currentFeedback = Array.isArray((record as any).feedback) ? (record as any).feedback : [];
      
      const newFeedback: Feedback = {
        id: `fb-${Date.now()}`,
        ...feedback,
        createdAt: new Date().toISOString(),
      };
      
      const updateData: any = {};
      
      // Chỉ thêm feedback nếu database hỗ trợ (có thể comment lại nếu database chưa có cột feedback)
      // updateData.feedback = [...currentFeedback, newFeedback];
      
      await kpiRecordService.update(numericId, updateData);
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
      // Convert string ID to number
      const numericId = parseInt(recordId, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid record ID: ${recordId}`);
      }

      console.log('Editing KPI record:', numericId, 'with data:', updatedRecordData);
      
      await kpiRecordService.update(numericId, updatedRecordData);
      await loadKpiRecords();
    } catch (error) {
      console.error('Error editing kpi record:', error);
      console.error('Record data:', updatedRecordData);
      throw error;
    }
  };

  const deleteKpiRecord = async (recordId: string) => {
    try {
      await kpiRecordService.delete(Number(recordId));
      await loadKpiRecords();
    } catch (error) {
      console.error('Error deleting kpi record:', error);
      throw error;
    }
  };

  const submitMultiKpiSubmission = async (
    employeeId: number,
    items: Array<{ kpiRecordId: number; actual: number; notes?: string }>,
    submissionDetails: string,
    attachment: string | null
  ) => {
    try {
      if (!items || items.length === 0) {
        throw new Error('Vui lòng chọn ít nhất một KPI để báo cáo');
      }

      // Prepare submission items
      const submissionItems: Omit<KpiSubmissionItemInsert, 'submission_id'>[] = items.map(item => {
        // Get KPI record to calculate progress
        const record = kpiRecords.find(r => r.id === item.kpiRecordId);
        if (!record) {
          throw new Error(`KPI record với ID ${item.kpiRecordId} không tồn tại`);
        }

        // Calculate progress, allow > 100% if actual exceeds target
        const calculatedProgress = (item.actual / record.target) * 100;
        const progress = Math.max(0, Math.round(calculatedProgress * 100) / 100); // Round to 2 decimal places

        return {
          kpi_record_id: item.kpiRecordId,
          actual: item.actual,
          progress,
          notes: item.notes || null,
        };
      });

      // Create submission
      const submission = await kpiSubmissionService.create(
        {
          employee_id: employeeId,
          submission_details: submissionDetails,
          attachment: attachment || null,
          status: 'pending_approval',
        },
        submissionItems
      );

      await loadKpiRecords();
      await loadKpiSubmissions();

      // Create notification for admin
      const submitterInfo = {
        id: String(employeeId),
        name: users.find(u => u.id === employeeId)?.name || 'Nhân viên'
      };

      try {
        const kpiNames = items.map(item => {
          const record = kpiRecords.find(r => r.id === item.kpiRecordId);
          const kpi = kpis.find(k => k.id === record?.kpi_id);
          return kpi?.name || 'KPI';
        }).join(', ');

        await notificationManager.notifyKpiSubmitted(
          {
            id: submission.id,
            kpi_name: kpiNames,
            unit: '',
            period: '',
            employee_name: submitterInfo.name,
            actual: items.reduce((sum, item) => sum + item.actual, 0),
          },
          submitterInfo
        );
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }
    } catch (error) {
      console.error('Error submitting multi KPI submission:', error);
      throw error;
    }
  };

  const approveKpiSubmission = useCallback(async (submissionId: number, approvedBy: number) => {
    try {
      await kpiSubmissionService.approve(submissionId, approvedBy);
      await loadKpiSubmissions();
      await loadKpiRecords();
    } catch (error) {
      console.error('Error approving KPI submission:', error);
      throw error;
    }
  }, [loadKpiSubmissions, loadKpiRecords]);

  const rejectKpiSubmission = useCallback(async (submissionId: number, rejectedBy: number, reason: string) => {
    try {
      await kpiSubmissionService.reject(submissionId, rejectedBy, reason);
      await loadKpiSubmissions();
      await loadKpiRecords();
    } catch (error) {
      console.error('Error rejecting KPI submission:', error);
      throw error;
    }
  }, [loadKpiSubmissions, loadKpiRecords]);

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
      // Convert string ID to number if needed
      const numericId = typeof notificationId === 'string' ? parseInt(notificationId, 10) : notificationId;
      if (isNaN(numericId) || !isFinite(numericId)) {
        throw new Error(`Invalid notification ID: ${notificationId}`);
      }
      await notificationService.markAsRead(numericId);
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
  const getFrequencies = useCallback(() => {
    const existingFrequencies = [...new Set(kpis.map(k => k.frequency))].sort();
    const allSupportedFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    
    // Always return all supported frequencies
    return allSupportedFrequencies;
  }, [kpis]);
  const getKpiStatuses = useCallback(() => [...new Set(kpiRecords.map(r => r.status))].sort(), [kpiRecords]);
  const getNotificationTypes = useCallback(() => [...new Set(notifications.map(n => n.type))].sort(), [notifications]);
  const getNotificationPriorities = useCallback(() => [...new Set(notifications.map(n => n.priority))].sort(), [notifications]);
  const getNotificationCategories = useCallback(() => [...new Set(notifications.map(n => n.category))].sort(), [notifications]);

  // Provider value - use filtered data when branch is selected
  const value = {
    users: selectedBranch?.id ? filteredUsers : users,
    kpis: selectedBranch?.id ? filteredKpis : kpis,
    kpiRecords: selectedBranch?.id ? filteredKpiRecords : kpiRecords,
    dailyKpiProgress: selectedBranch?.id ? filteredDailyKpiProgress : dailyKpiProgress,
    notifications,
    departments: selectedBranch?.id ? filteredDepartments : departments,
    branches,
    roles,
    kpiSubmissions,
    // Raw data (unfiltered) - always return all data
    allUsers: users,
    allDepartments: departments,
    loading,
    addUser,
    updateUser,
    deleteUser,
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
    submitMultiKpiSubmission,
    approveKpiSubmission,
    rejectKpiSubmission,
    updateKpiRecordStatus,
    addKpiFeedback,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addBranch,
    updateBranch,
    deleteBranch,
    addRole,
    updateRole,
    deleteRole,
    getDepartments,
    getDepartmentNames,
    getFrequencies,
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
    refreshRoles: loadRoles,
    refreshKpiSubmissions: loadKpiSubmissions,
  };

  return (
    <SupabaseDataContext.Provider value={value}>
      {children}
    </SupabaseDataContext.Provider>
  );
};
