// Types for KPI configuration and bonus system

export interface BonusConfig {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: 'VND' | 'USD';
  frequency: 'monthly' | 'quarterly' | 'annually';
  conditions: BonusCondition[];
  isActive: boolean;
}

export interface PenaltyConfig {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: 'VND' | 'USD';
  conditions: PenaltyCondition[];
  isActive: boolean;
}

export interface BonusCondition {
  id: string;
  type: 'threshold' | 'percentage' | 'count' | 'boolean';
  field: string;
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  value: number | string | boolean;
  description: string;
}

export interface PenaltyCondition {
  id: string;
  type: 'threshold' | 'percentage' | 'count' | 'boolean';
  field: string;
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  value: number | string | boolean;
  description: string;
}

// RoleKpiConfig interface removed as role-kpi-config page was deleted

// Specific role configurations based on your requirements
export const ROLE_CODES = {
  IT_STAFF: 'IT_STAFF',
  IT_HEAD: 'IT_HEAD',
  MARKETING_HEAD: 'MARKETING_HEAD',
  MARKETING_ASSISTANT: 'MARKETING_ASSISTANT',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
  CUSTOMER_SERVICE_HEAD: 'CUSTOMER_SERVICE_HEAD',
  CREDIT_APPRAISAL: 'CREDIT_APPRAISAL',
  HR_ADMIN: 'HR_ADMIN',
  HR_HEAD: 'HR_HEAD',
  ACCOUNTANT: 'ACCOUNTANT',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
} as const;

export type RoleCode = typeof ROLE_CODES[keyof typeof ROLE_CODES];

// KPI Metrics for different roles
export interface KpiMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
  target: number;
  actual?: number;
  weight: number; // Weight in percentage for overall score
  category: 'performance' | 'compliance' | 'quality' | 'efficiency' | 'growth';
}

export interface RoleKpiMetrics {
  roleCode: RoleCode;
  metrics: KpiMetric[];
}

// Bonus calculation result
export interface BonusCalculation {
  roleCode: RoleCode;
  period: string;
  quarterlyBonus: {
    total: number;
    breakdown: Array<{
      bonusId: string;
      name: string;
      amount: number;
      achieved: boolean;
      reason: string;
    }>;
  };
  annualBonus: {
    total: number;
    breakdown: Array<{
      bonusId: string;
      name: string;
      amount: number;
      achieved: boolean;
      reason: string;
    }>;
  };
  penalties: {
    total: number;
    breakdown: Array<{
      penaltyId: string;
      name: string;
      amount: number;
      applied: boolean;
      reason: string;
    }>;
  };
  netBonus: number;
  thirteenthMonthSalary?: number;
}

// Common types for the system
export interface BaseEntity {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  roleCode: string;
  department: string;
  departmentId: string;
  managerId?: string;
  salary: number;
  hireDate: string;
  avatar: string;
  position: string;
}

export interface Department extends BaseEntity {
  name: string;
  code: string;
  description: string;
  managerId?: string;
}

export interface KPI extends BaseEntity {
  name: string;
  description: string;
  department: string;
  departmentId: string;
  target: number;
  unit: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  status: 'active' | 'inactive' | 'paused' | 'archived';
  rewardPenaltyConfig: string;
  createdBy: string;
  assignedTo?: string[];
}

export interface KpiRecord extends BaseEntity {
  kpiId: string;
  employeeId?: string;
  departmentId?: string;
  period: string;
  target: number;
  actual: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'overdue';
  startDate: string;
  endDate: string;
  submissionDate?: string;
  approvalDate?: string;
  approvedBy?: string;
  submissionDetails: string;
  feedback: KpiFeedback[];
  attachment?: string | null;
  bonusAmount?: number;
  penaltyAmount?: number;
  score?: number;
  lastUpdated: string;
}

export interface KpiFeedback {
  id: string;
  author: string;
  authorName: string;
  comment: string;
  type: 'approval' | 'rejection' | 'suggestion' | 'praise';
  timestamp: string;
}

export interface Notification extends BaseEntity {
  recipientId: string;
  type: 'assigned' | 'reminder' | 'approved' | 'rejected' | 'reward' | 'deadline' | 'system';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'kpi' | 'bonus' | 'system' | 'deadline' | 'approval';
  time: string;
  read: boolean;
  actor: {
    id: string;
    name: string;
    avatar: string;
  };
  target: string;
  action: string;
  actionUrl?: string;
  metadata?: {
    kpiId?: string;
    recordId?: string;
    bonusAmount?: number;
    deadline?: string;
  };
}
