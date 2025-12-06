/**
 * Validation utilities for data integrity
 * Centralized validation functions for the application
 */

// =====================================================
// CONSTANTS
// =====================================================

export const VALID_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
  'pending_approval',
  'approved',
  'rejected',
  'overdue'
] as const;

export const VALID_KPI_STATUSES = [
  'active',
  'inactive',
  'paused',
  'archived'
] as const;

export const VALID_FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
] as const;

export const VALID_CATEGORIES = [
  'performance',
  'quality',
  'efficiency',
  'compliance',
  'growth'
] as const;

export const VALID_EMPLOYEE_STATUSES = [
  'active',
  'inactive',
  'suspended',
  'terminated'
] as const;

export const VALID_BONUS_PENALTY_TYPES = [
  'bonus',
  'penalty'
] as const;

export const VALID_NOTIFICATION_TYPES = [
  'assigned',
  'submitted',
  'approved',
  'rejected',
  'reminder',
  'reward',
  'penalty',
  'deadline',
  'system'
] as const;

export const VALID_NOTIFICATION_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent'
] as const;

export const VALID_NOTIFICATION_CATEGORIES = [
  'kpi',
  'bonus',
  'system',
  'reminder',
  'approval'
] as const;

export const VALID_USER_TYPES = [
  'employee',
  'admin',
  'all'
] as const;

export type ValidStatus = typeof VALID_STATUSES[number];
export type ValidKpiStatus = typeof VALID_KPI_STATUSES[number];
export type ValidFrequency = typeof VALID_FREQUENCIES[number];
export type ValidCategory = typeof VALID_CATEGORIES[number];
export type ValidEmployeeStatus = typeof VALID_EMPLOYEE_STATUSES[number];
export type ValidBonusPenaltyType = typeof VALID_BONUS_PENALTY_TYPES[number];
export type ValidNotificationType = typeof VALID_NOTIFICATION_TYPES[number];
export type ValidNotificationPriority = typeof VALID_NOTIFICATION_PRIORITIES[number];
export type ValidNotificationCategory = typeof VALID_NOTIFICATION_CATEGORIES[number];
export type ValidUserType = typeof VALID_USER_TYPES[number];

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate period format (date range: yyyy-MM-dd to yyyy-MM-dd)
 */
export function validatePeriod(period: string): ValidationResult {
  if (!period || typeof period !== 'string') {
    return { valid: false, error: 'Period phải là chuỗi không rỗng' };
  }

  // Validate date range format: "yyyy-MM-dd to yyyy-MM-dd"
  const dateRangeRegex = /^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/;
  const match = period.match(dateRangeRegex);
  
  if (!match) {
    return {
      valid: false,
      error: 'Period format không hợp lệ. Phải là định dạng từ ngày đến ngày: yyyy-MM-dd to yyyy-MM-dd'
    };
  }

  // Validate that dates are valid
  const startDate = new Date(match[1]);
  const endDate = new Date(match[2]);

  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Ngày bắt đầu không hợp lệ' };
  }

  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Ngày kết thúc không hợp lệ' };
  }

  // Validate that start date is before or equal to end date
  if (startDate > endDate) {
    return { valid: false, error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' };
  }

  return { valid: true };
}

/**
 * Validate date range (start_date <= end_date)
 */
export function validateDateRange(startDate: string | Date, endDate: string | Date): ValidationResult {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Start date không hợp lệ' };
  }

  if (isNaN(end.getTime())) {
    return { valid: false, error: 'End date không hợp lệ' };
  }

  if (start > end) {
    return { valid: false, error: 'Start date phải nhỏ hơn hoặc bằng End date' };
  }

  return { valid: true };
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number, fieldName: string): ValidationResult {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return { valid: false, error: `${fieldName} phải là số hợp lệ` };
  }

  if (value <= 0) {
    return { valid: false, error: `${fieldName} phải lớn hơn 0` };
  }

  return { valid: true };
}

/**
 * Validate non-negative number
 */
export function validateNonNegativeNumber(value: number, fieldName: string): ValidationResult {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return { valid: false, error: `${fieldName} phải là số hợp lệ` };
  }

  if (value < 0) {
    return { valid: false, error: `${fieldName} không được âm` };
  }

  return { valid: true };
}

/**
 * Validate range (min <= value <= max)
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): ValidationResult {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return { valid: false, error: `${fieldName} phải là số hợp lệ` };
  }

  if (value < min || value > max) {
    return { valid: false, error: `${fieldName} phải trong khoảng [${min}, ${max}]` };
  }

  return { valid: true };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  validValues: readonly T[],
  fieldName: string
): ValidationResult {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} không được rỗng` };
  }

  if (!validValues.includes(value as T)) {
    return {
      valid: false,
      error: `${fieldName} không hợp lệ. Giá trị hợp lệ: ${validValues.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email không được rỗng' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email format không hợp lệ' };
  }

  return { valid: true };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} phải là chuỗi` };
  }

  const length = value.trim().length;
  if (length < min) {
    return { valid: false, error: `${fieldName} phải có ít nhất ${min} ký tự` };
  }

  if (length > max) {
    return { valid: false, error: `${fieldName} không được quá ${max} ký tự` };
  }

  return { valid: true };
}

/**
 * Sanitize string (trim whitespace)
 */
export function sanitizeString(value: string | undefined | null): string {
  if (!value) return '';
  return String(value).trim();
}

/**
 * Sanitize number (ensure it's a valid number)
 */
export function sanitizeNumber(value: number | string | undefined | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
}

/**
 * Validate KPI record data
 */
export interface KpiRecordValidationData {
  kpi_id?: number;
  employee_id?: number | null;
  department_id?: number | null;
  period?: string;
  target?: number;
  actual?: number;
  progress?: number;
  status?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  bonus_amount?: number | null;
  penalty_amount?: number | null;
  score?: number | null;
}

export function validateKpiRecord(data: KpiRecordValidationData): ValidationResult {
  // Validate required fields
  if (data.kpi_id === undefined || data.kpi_id === null) {
    return { valid: false, error: 'KPI ID không được rỗng' };
  }

  // Validate assignment constraint
  if (
    (data.employee_id === null || data.employee_id === undefined) &&
    (data.department_id === null || data.department_id === undefined)
  ) {
    return { valid: false, error: 'Phải có employee_id hoặc department_id (không thể cả hai NULL)' };
  }

  if (
    data.employee_id !== null && data.employee_id !== undefined &&
    data.department_id !== null && data.department_id !== undefined
  ) {
    return { valid: false, error: 'Chỉ có thể có employee_id hoặc department_id (không thể cả hai)' };
  }

  // Validate period
  if (data.period) {
    const periodResult = validatePeriod(data.period);
    if (!periodResult.valid) return periodResult;
  }

  // Validate target
  if (data.target !== undefined && data.target !== null) {
    const targetResult = validatePositiveNumber(data.target, 'Target');
    if (!targetResult.valid) return targetResult;
  }

  // Validate actual
  if (data.actual !== undefined && data.actual !== null) {
    const actualResult = validateNonNegativeNumber(data.actual, 'Actual');
    if (!actualResult.valid) return actualResult;
  }

  // Validate progress - allow > 100% if actual exceeds target
  if (data.progress !== undefined && data.progress !== null) {
    // Only check minimum, allow progress > 100%
    if (data.progress < 0) {
      return { valid: false, error: 'Progress không được nhỏ hơn 0' };
    }
    // Allow progress > 100% (for over-achievement)
  }

  // Validate status
  if (data.status) {
    const statusResult = validateEnum(data.status, VALID_STATUSES, 'Status');
    if (!statusResult.valid) return statusResult;
  }

  // Validate date range
  if (data.start_date && data.end_date) {
    const dateRangeResult = validateDateRange(data.start_date, data.end_date);
    if (!dateRangeResult.valid) return dateRangeResult;
  }

  // Validate bonus amount
  if (data.bonus_amount !== undefined && data.bonus_amount !== null) {
    const bonusResult = validateNonNegativeNumber(data.bonus_amount, 'Bonus amount');
    if (!bonusResult.valid) return bonusResult;
  }

  // Validate penalty amount
  if (data.penalty_amount !== undefined && data.penalty_amount !== null) {
    const penaltyResult = validateNonNegativeNumber(data.penalty_amount, 'Penalty amount');
    if (!penaltyResult.valid) return penaltyResult;
  }

  // Validate score
  if (data.score !== undefined && data.score !== null) {
    const scoreResult = validateRange(data.score, 0, 100, 'Score');
    if (!scoreResult.valid) return scoreResult;
  }

  return { valid: true };
}

/**
 * Validate bonus/penalty record data
 */
export interface BonusPenaltyRecordValidationData {
  employee_id?: number;
  type?: string;
  amount?: number;
  reason?: string;
  period?: string;
}

export function validateBonusPenaltyRecord(data: BonusPenaltyRecordValidationData): ValidationResult {
  // Validate required fields
  if (data.employee_id === undefined || data.employee_id === null) {
    return { valid: false, error: 'Employee ID không được rỗng' };
  }

  // Validate type
  if (data.type) {
    const typeResult = validateEnum(data.type, VALID_BONUS_PENALTY_TYPES, 'Type');
    if (!typeResult.valid) return typeResult;
  }

  // Validate amount (allow 0)
  if (data.amount !== undefined && data.amount !== null) {
    const amountResult = validateNonNegativeNumber(data.amount, 'Amount');
    if (!amountResult.valid) return amountResult;
  }

  // Validate reason
  if (data.reason !== undefined) {
    const reasonResult = validateStringLength(data.reason, 1, 1000, 'Reason');
    if (!reasonResult.valid) return reasonResult;
  }

  // Validate period
  if (data.period) {
    const periodResult = validatePeriod(data.period);
    if (!periodResult.valid) return periodResult;
  }

  return { valid: true };
}

/**
 * Validate KPI data
 */
export interface KpiValidationData {
  name?: string;
  description?: string;
  department_id?: number;
  target?: number;
  frequency?: string;
  status?: string;
}

export function validateKpi(data: KpiValidationData): ValidationResult {
  // Validate name
  if (data.name !== undefined) {
    const nameResult = validateStringLength(data.name, 1, 255, 'Name');
    if (!nameResult.valid) return nameResult;
  }

  // Validate description
  if (data.description !== undefined) {
    const descResult = validateStringLength(data.description, 1, 5000, 'Description');
    if (!descResult.valid) return descResult;
  }

  // Validate department_id
  if (data.department_id !== undefined && data.department_id === null) {
    return { valid: false, error: 'Department ID không được rỗng' };
  }

  // Validate target
  if (data.target !== undefined && data.target !== null) {
    const targetResult = validatePositiveNumber(data.target, 'Target');
    if (!targetResult.valid) return targetResult;
  }

  // Validate frequency
  if (data.frequency) {
    const freqResult = validateEnum(data.frequency, VALID_FREQUENCIES, 'Frequency');
    if (!freqResult.valid) return freqResult;
  }

  // Validate status
  if (data.status) {
    const statusResult = validateEnum(data.status, VALID_KPI_STATUSES, 'Status');
    if (!statusResult.valid) return statusResult;
  }

  return { valid: true };
}

/**
 * Validate employee data
 */
export interface EmployeeValidationData {
  employee_code?: string;
  name?: string;
  email?: string;
  role_id?: number;
  department_id?: number;
  position?: string;
  level?: number;
  status?: string;
}

export function validateEmployee(data: EmployeeValidationData): ValidationResult {
  // Validate employee_code
  if (data.employee_code !== undefined) {
    const codeResult = validateStringLength(data.employee_code, 1, 50, 'Employee code');
    if (!codeResult.valid) return codeResult;
  }

  // Validate name
  if (data.name !== undefined) {
    const nameResult = validateStringLength(data.name, 1, 255, 'Name');
    if (!nameResult.valid) return nameResult;
  }

  // Validate email
  if (data.email !== undefined) {
    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) return emailResult;
  }

  // Validate role_id
  if (data.role_id !== undefined && data.role_id === null) {
    return { valid: false, error: 'Role ID không được rỗng' };
  }

  // Validate department_id
  if (data.department_id !== undefined && data.department_id === null) {
    return { valid: false, error: 'Department ID không được rỗng' };
  }

  // Validate position
  if (data.position !== undefined) {
    const posResult = validateStringLength(data.position, 1, 255, 'Position');
    if (!posResult.valid) return posResult;
  }

  // Validate level
  if (data.level !== undefined && data.level !== null) {
    const levelResult = validateRange(data.level, 1, 4, 'Level');
    if (!levelResult.valid) return levelResult;
  }

  // Validate status
  if (data.status) {
    const statusResult = validateEnum(data.status, VALID_EMPLOYEE_STATUSES, 'Status');
    if (!statusResult.valid) return statusResult;
  }

  return { valid: true };
}

