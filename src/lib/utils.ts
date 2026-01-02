import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * This prevents timezone issues when converting dates
 */
export function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a number as currency string with comma separator (Vietnamese format)
 * Example: 1000000 => "1,000,000"
 */
export function formatCurrency(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(numValue)) return '';
  
  // Format with comma separator manually
  return Math.floor(numValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse a formatted currency string to number
 * Example: "1,000,000" => 1000000
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number with comma separator (supports decimals)
 * Example: 1000000.5 => "1,000,000.5"
 */
export function formatNumber(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(numValue)) return '';
  
  // Split into integer and decimal parts
  const parts = numValue.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Combine with decimal part if exists
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * Parse a formatted number string to number (supports decimals)
 * Example: "1,000,000.5" => 1000000.5
 */
export function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Translate frequency value to Vietnamese display text
 */
export function getFrequencyLabel(frequency: string): string {
  const frequencyMap: Record<string, string> = {
    'daily': 'Hàng ngày',
    'weekly': 'Hàng tuần',
    'monthly': 'Hàng tháng',
    'quarterly': 'Hàng quý',
    'yearly': 'Hàng năm',
    'annually': 'Hàng năm',
  };
  return frequencyMap[frequency?.toLowerCase()] || frequency;
}

/**
 * Translate role name to Vietnamese display text
 */
export function getRoleLabel(roleName: string | null | undefined): string {
  if (!roleName) return 'N/A';
  
  const roleMap: Record<string, string> = {
    'employee': 'Nhân viên',
    'Employee': 'Nhân viên',
    'EMPLOYEE': 'Nhân viên',
    'manager': 'Quản lý',
    'Manager': 'Quản lý',
    'MANAGER': 'Quản lý',
    'director': 'Giám đốc',
    'Director': 'Giám đốc',
    'DIRECTOR': 'Giám đốc',
    'admin': 'Quản trị viên',
    'Admin': 'Quản trị viên',
    'Administrator': 'Quản trị viên',
    'ADMIN': 'Quản trị viên',
  };
  
  // Kiểm tra exact match trước
  if (roleMap[roleName]) {
    return roleMap[roleName];
  }
  
  // Kiểm tra case-insensitive match
  const lowerRoleName = roleName.toLowerCase();
  for (const [key, value] of Object.entries(roleMap)) {
    if (key.toLowerCase() === lowerRoleName) {
      return value;
    }
  }
  
  // Nếu không tìm thấy, trả về role name gốc
  return roleName;
}