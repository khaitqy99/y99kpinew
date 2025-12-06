/**
 * Utility functions for generating period options based on current time
 */

export interface PeriodOption {
  value: string;
  label: string;
  type: 'quarter' | 'month';
  year: number;
  quarter?: number;
  month?: number;
}

/**
 * Generate period options for multiple years (2 years back, current year, and 2 years forward)
 * Includes quarters and months for better granularity
 * Starts from past years to future years
 * If earliestDate is provided, only generates periods from that date onwards
 */
export function generatePeriodOptions(earliestDate?: Date): PeriodOption[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  const periods: PeriodOption[] = [];
  
  // Determine start year based on earliestDate if provided
  let startYear = currentYear - 2;
  let earliestMonth = 1;
  let earliestQuarter = 1;
  
  if (earliestDate) {
    const earliestYear = earliestDate.getFullYear();
    earliestMonth = earliestDate.getMonth() + 1;
    earliestQuarter = Math.ceil(earliestMonth / 3);
    // Start from the year of earliest date
    startYear = earliestYear;
  }
  
  // Generate periods only up to current year (no future periods)
  const endYear = currentYear;

  for (let year = startYear; year <= endYear; year++) {
    // Determine which quarters to generate for this year
    const quarterStart = (year === startYear && earliestDate) ? earliestQuarter : 1;
    
    // Generate quarters for each year
    let quarterEnd = 4;
    if (year === currentYear) {
      // For current year, only show quarters up to current quarter
      quarterEnd = currentQuarter;
    }
    
    for (let quarter = quarterStart; quarter <= quarterEnd; quarter++) {
      // For the start year, check if quarter is valid
      if (year === startYear && earliestDate) {
        const quarterStartMonth = (quarter - 1) * 3 + 1;
        const quarterEndMonth = quarter * 3;
        if (quarterEndMonth < earliestMonth) {
          continue; // Skip quarters before earliest month
        }
      }
      
      periods.push({
        value: `Q${quarter}-${year}`,
        label: `Quý ${quarter} ${year}`,
        type: 'quarter',
        year: year,
        quarter: quarter
      });
    }
    
    // Determine which months to generate for this year
    let monthStart = 1;
    let monthEnd = 12;
    
    if (year === startYear && earliestDate) {
      monthStart = earliestMonth;
    }
    
    if (year < currentYear) {
      // Past years: all months from monthStart
      monthEnd = 12;
    } else if (year === currentYear) {
      // Current year: all months up to current month only
      monthEnd = currentMonth;
    }
    // No future years - only show up to current date
    
    // Generate months based on year
    for (let month = monthStart; month <= monthEnd; month++) {
      periods.push({
        value: `M${month}-${year}`,
        label: `Tháng ${month} ${year}`,
        type: 'month',
        year: year,
        month: month
      });
    }
  }
  
  // Sort periods: newer periods first, quarters before months within same year
  return periods.sort((a, b) => {
    // First sort by year (newer years first)
    if (a.year !== b.year) {
      return b.year - a.year; // Newer years first
    }
    
    // Within same year, quarters come before months
    if (a.type === 'quarter' && b.type === 'month') {
      return -1;
    }
    
    if (a.type === 'month' && b.type === 'quarter') {
      return 1;
    }
    
    // For quarters, sort by quarter number (Q1, Q2, Q3, Q4)
    if (a.type === 'quarter' && b.type === 'quarter') {
      return a.quarter! - b.quarter!;
    }
    
    // For months, sort by month number (newer months first)
    if (a.type === 'month' && b.type === 'month') {
      return b.month! - a.month!; // Newer months first
    }
    
    return 0;
  });
}

/**
 * Get the default period (current month as date range)
 */
export function getDefaultPeriod(): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Get first day of current month
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  // Get last day of current month
  const endDate = new Date(currentYear, currentMonth, 0);
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

/**
 * Get period label from value (date range format: yyyy-MM-dd to yyyy-MM-dd)
 */
export function getPeriodLabel(value: string, earliestDate?: Date): string {
  // Parse date range format: "yyyy-MM-dd to yyyy-MM-dd"
  const dateRangeMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/);
  
  if (dateRangeMatch) {
    const startDate = new Date(dateRangeMatch[1]);
    const endDate = new Date(dateRangeMatch[2]);
    
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      // Format dates in Vietnamese format: dd/MM/yyyy
      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  }
  
  // Fallback: try to parse old format (Q1-2025, M1-2025) for backward compatibility
  const oldFormatMatch = value.match(/^(Q|M)(\d+)-(\d+)$/);
  if (oldFormatMatch) {
    const type = oldFormatMatch[1];
    const num = parseInt(oldFormatMatch[2], 10);
    const year = parseInt(oldFormatMatch[3], 10);
    
    if (type === 'Q') {
      return `Quý ${num} ${year}`;
    } else if (type === 'M') {
      return `Tháng ${num} ${year}`;
    }
  }
  
  // If no match, return as is
  return value;
}

/**
 * Get current quarter label
 */
export function getCurrentQuarterLabel(): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  return `Quý ${currentQuarter} ${currentYear}`;
}

/**
 * Get start and end dates for a period (date range format: yyyy-MM-dd to yyyy-MM-dd)
 */
export function getPeriodDateRange(periodValue: string): { startDate: Date; endDate: Date } {
  // Parse date range format: "yyyy-MM-dd to yyyy-MM-dd"
  const dateRangeMatch = periodValue.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/);
  
  if (dateRangeMatch) {
    const startDate = new Date(dateRangeMatch[1]);
    const endDate = new Date(dateRangeMatch[2]);
    
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return { startDate, endDate };
    }
  }
  
  // Fallback: try to parse old format (Q1-2025, M1-2025) for backward compatibility
  const oldFormatMatch = periodValue.match(/^(Q|M)(\d+)-(\d+)$/);
  if (oldFormatMatch) {
    const type = oldFormatMatch[1];
    const num = parseInt(oldFormatMatch[2], 10);
    const year = parseInt(oldFormatMatch[3], 10);
    
    if (type === 'Q') {
      return getQuarterDateRange(year, num);
    } else if (type === 'M') {
      return getMonthDateRange(year, num);
    }
  }
  
  // Default fallback: current month
  const currentDate = new Date();
  return {
    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  };
}

/**
 * Get quarter date range
 */
function getQuarterDateRange(year: number, quarter: number): { startDate: Date; endDate: Date } {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  
  return {
    startDate: new Date(year, startMonth, 1),
    endDate: new Date(year, endMonth + 1, 0) // Last day of the month
  };
}

/**
 * Get month date range
 */
function getMonthDateRange(year: number, month: number): { startDate: Date; endDate: Date } {
  return {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0) // Last day of the month
  };
}

/**
 * Get available years starting from 2025 to current year
 */
export function getAvailableYears(earliestDate?: Date): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = earliestDate ? Math.max(2025, earliestDate.getFullYear()) : 2025;
  const years: number[] = [];
  
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  
  return years.sort((a, b) => b - a); // Newer years first
}

/**
 * Get period options (quarters and months) for a specific year
 */
export function getPeriodsForYear(year: number, earliestDate?: Date): PeriodOption[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  const periods: PeriodOption[] = [];
  
  // Determine if this is the earliest year
  const isEarliestYear = earliestDate && earliestDate.getFullYear() === year;
  const earliestMonth = isEarliestYear ? earliestDate!.getMonth() + 1 : 1;
  const earliestQuarter = isEarliestYear ? Math.ceil(earliestMonth / 3) : 1;
  
  // Generate quarters
  let quarterEnd = 4;
  if (year === currentYear) {
    quarterEnd = currentQuarter;
  }
  
  for (let quarter = (isEarliestYear ? earliestQuarter : 1); quarter <= quarterEnd; quarter++) {
    // For the earliest year, check if quarter is valid
    if (isEarliestYear) {
      const quarterStartMonth = (quarter - 1) * 3 + 1;
      const quarterEndMonth = quarter * 3;
      if (quarterEndMonth < earliestMonth) {
        continue; // Skip quarters before earliest month
      }
    }
    
    periods.push({
      value: `Q${quarter}-${year}`,
      label: `Quý ${quarter}`,
      type: 'quarter',
      year: year,
      quarter: quarter
    });
  }
  
  // Generate months
  let monthStart = 1;
  let monthEnd = 12;
  
  if (isEarliestYear) {
    monthStart = earliestMonth;
  }
  
  if (year === currentYear) {
    monthEnd = currentMonth;
  }
  
  for (let month = monthStart; month <= monthEnd; month++) {
    periods.push({
      value: `M${month}-${year}`,
      label: `Tháng ${month}`,
      type: 'month',
      year: year,
      month: month
    });
  }
  
  // Sort: quarters first, then months (both in descending order)
  return periods.sort((a, b) => {
    if (a.type === 'quarter' && b.type === 'month') {
      return -1;
    }
    if (a.type === 'month' && b.type === 'quarter') {
      return 1;
    }
    if (a.type === 'quarter' && b.type === 'quarter') {
      return b.quarter! - a.quarter!; // Descending order (Q4, Q3, Q2, Q1)
    }
    if (a.type === 'month' && b.type === 'month') {
      return b.month! - a.month!; // Descending order (12, 11, ..., 1)
    }
    return 0;
  });
}