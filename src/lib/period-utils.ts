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
 * Generate period options for the current year and previous year
 * Includes quarters and months for better granularity
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
  
  // Generate quarters for previous year
  for (let quarter = 1; quarter <= 4; quarter++) {
    periods.push({
      value: `Q${quarter}-${currentYear - 1}`,
      label: `Quý ${quarter} ${currentYear - 1}`,
      type: 'quarter',
      year: currentYear - 1,
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
  
  // Sort periods by year and quarter/month
  return periods.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year; // Newer years first
    }
    
    if (a.type === 'quarter' && b.type === 'quarter') {
      return (b.quarter || 0) - (a.quarter || 0);
    }
    
    if (a.type === 'month' && b.type === 'month') {
      return (b.month || 0) - (a.month || 0);
    }
    
    // Quarters come before months
    if (a.type === 'quarter' && b.type === 'month') {
      return -1;
    }
    
    return 1;
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
