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
 * Generate period options for the current year and next year
 * Includes quarters and months for better granularity
 * Starts from current year quarters to next year quarters
 */
export function generatePeriodOptions(): PeriodOption[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  const periods: PeriodOption[] = [];
  
  // Generate quarters for current year
  for (let quarter = 1; quarter <= 4; quarter++) {
    periods.push({
      value: `Q${quarter}-${currentYear}`,
      label: `Quý ${quarter} ${currentYear}`,
      type: 'quarter',
      year: currentYear,
      quarter: quarter
    });
  }
  
  // Generate quarters for next year
  for (let quarter = 1; quarter <= 4; quarter++) {
    periods.push({
      value: `Q${quarter}-${currentYear + 1}`,
      label: `Quý ${quarter} ${currentYear + 1}`,
      type: 'quarter',
      year: currentYear + 1,
      quarter: quarter
    });
  }
  
  // Generate months for current year (last 6 months)
  for (let month = Math.max(1, currentMonth - 5); month <= currentMonth; month++) {
    periods.push({
      value: `M${month}-${currentYear}`,
      label: `Tháng ${month} ${currentYear}`,
      type: 'month',
      year: currentYear,
      month: month
    });
  }
  
  // Generate months for next year (first 6 months)
  for (let month = 1; month <= 6; month++) {
    periods.push({
      value: `M${month}-${currentYear + 1}`,
      label: `Tháng ${month} ${currentYear + 1}`,
      type: 'month',
      year: currentYear + 1,
      month: month
    });
  }
  
  // Sort periods to prioritize current and next year quarters first
  return periods.sort((a, b) => {
    // First priority: quarters of current and next year
    if (a.type === 'quarter' && b.type === 'quarter') {
      if (a.year !== b.year) {
        return a.year - b.year; // Current year first, then next year
      }
      return a.quarter! - b.quarter!; // Q1, Q2, Q3, Q4 order
    }
    
    // Quarters come before months
    if (a.type === 'quarter' && b.type === 'month') {
      return -1;
    }
    
    if (a.type === 'month' && b.type === 'quarter') {
      return 1;
    }
    
    // For months, sort by year and month
    if (a.type === 'month' && b.type === 'month') {
      if (a.year !== b.year) {
        return a.year - b.year; // Current year first, then next year
      }
      return b.month! - a.month!; // Newer months first within same year
    }
    
    return 0;
  });
}

/**
 * Get the default period (current quarter)
 */
export function getDefaultPeriod(): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  return `Q${currentQuarter}-${currentYear}`;
}

/**
 * Get period label from value
 */
export function getPeriodLabel(value: string): string {
  const periods = generatePeriodOptions();
  const period = periods.find(p => p.value === value);
  return period ? period.label : value;
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
 * Get start and end dates for a period
 */
export function getPeriodDateRange(periodValue: string): { startDate: Date; endDate: Date } {
  const periods = generatePeriodOptions();
  const period = periods.find(p => p.value === periodValue);
  
  if (!period) {
    // Default to current quarter if period not found
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    return getQuarterDateRange(currentYear, currentQuarter);
  }
  
  if (period.type === 'quarter') {
    return getQuarterDateRange(period.year, period.quarter!);
  } else if (period.type === 'month') {
    return getMonthDateRange(period.year, period.month!);
  }
  
  // Fallback
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