import { RoleCode, ROLE_CODES, BonusCalculation } from '@/types/kpi-config';

// Employee performance data interface
export interface EmployeePerformanceData {
  employeeId: string;
  roleCode: RoleCode;
  period: string;
  metrics: {
    // IT Staff metrics
    systemUptime?: number; // Percentage
    backupCompleted?: boolean;
    repairJobs?: number;
    reportsCompleted?: boolean;
    systemDowntime?: number; // Hours
    incompleteLogs?: boolean;
    operationalImprovement?: boolean;
    auditAnalysis?: boolean;
    
    // Marketing metrics
    leadGeneration?: number;
    campaignSuccess?: number; // Percentage
    socialMediaEngagement?: number;
    contentCreation?: number;
    
    // Customer Service metrics
    responseTime?: number; // Hours
    customerSatisfaction?: number; // Rating 1-5
    complaintResolution?: number; // Percentage
    callVolume?: number;
    
    // HR metrics
    recruitmentTarget?: number;
    trainingCompletion?: number; // Percentage
    employeeSatisfaction?: number; // Rating 1-5
    retentionRate?: number; // Percentage
    
    // Finance/Accounting metrics
    budgetAccuracy?: number; // Percentage
    reportTimeliness?: boolean;
    auditCompliance?: boolean;
    costReduction?: number; // Percentage
    
    // Generic metrics for all roles
    taskCompletion?: number; // Percentage
    qualityScore?: number; // Rating 1-5
    efficiencyRating?: number; // Rating 1-5
    innovationContribution?: boolean;
  };
  thirteenthMonthSalary?: number;
}

// Bonus calculation function
export function calculateEmployeeBonus(performanceData: EmployeePerformanceData): BonusCalculation {
  const { roleCode, period, metrics, thirteenthMonthSalary = 0 } = performanceData;
  
  // Initialize bonus calculation result
  const calculation: BonusCalculation = {
    roleCode,
    period,
    quarterlyBonus: {
      total: 0,
      breakdown: []
    },
    annualBonus: {
      total: 0,
      breakdown: []
    },
    penalties: {
      total: 0,
      breakdown: []
    },
    netBonus: 0,
    thirteenthMonthSalary
  };

  // Calculate bonuses based on role
  switch (roleCode) {
    case ROLE_CODES.IT_STAFF:
      calculateITStaffBonus(calculation, metrics);
      break;
    case ROLE_CODES.IT_HEAD:
      calculateITHeadBonus(calculation, metrics);
      break;
    case ROLE_CODES.MARKETING_HEAD:
      calculateMarketingHeadBonus(calculation, metrics);
      break;
    case ROLE_CODES.MARKETING_ASSISTANT:
      calculateMarketingAssistantBonus(calculation, metrics);
      break;
    case ROLE_CODES.CUSTOMER_SERVICE:
      calculateCustomerServiceBonus(calculation, metrics);
      break;
    case ROLE_CODES.CUSTOMER_SERVICE_HEAD:
      calculateCustomerServiceHeadBonus(calculation, metrics);
      break;
    case ROLE_CODES.CREDIT_APPRAISAL:
      calculateCreditAppraisalBonus(calculation, metrics);
      break;
    case ROLE_CODES.HR_ADMIN:
      calculateHRAdminBonus(calculation, metrics);
      break;
    case ROLE_CODES.HR_HEAD:
      calculateHRHeadBonus(calculation, metrics);
      break;
    case ROLE_CODES.ACCOUNTANT:
      calculateAccountantBonus(calculation, metrics);
      break;
    case ROLE_CODES.SYSTEM_ADMIN:
      calculateSystemAdminBonus(calculation, metrics);
      break;
    default:
      calculateDefaultBonus(calculation, metrics);
  }

  // Calculate net bonus
  calculation.netBonus = calculation.quarterlyBonus.total + calculation.annualBonus.total - calculation.penalties.total + thirteenthMonthSalary;

  return calculation;
}

// IT Staff bonus calculation
function calculateITStaffBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // System uptime bonus
  if (metrics.systemUptime && metrics.systemUptime >= 99.5) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'system_uptime',
      name: 'Thưởng thời gian hoạt động hệ thống',
      amount: 2000000,
      achieved: true,
      reason: `Hệ thống hoạt động ${metrics.systemUptime}% trong quý`
    });
    calculation.quarterlyBonus.total += 2000000;
  }

  // Backup completion bonus
  if (metrics.backupCompleted) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'backup_completion',
      name: 'Thưởng hoàn thành backup',
      amount: 1000000,
      achieved: true,
      reason: 'Đã hoàn thành backup định kỳ'
    });
    calculation.quarterlyBonus.total += 1000000;
  }

  // Repair jobs bonus
  if (metrics.repairJobs && metrics.repairJobs <= 5) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'low_repair_jobs',
      name: 'Thưởng ít sự cố',
      amount: 1500000,
      achieved: true,
      reason: `Chỉ có ${metrics.repairJobs} sự cố cần sửa chữa`
    });
    calculation.quarterlyBonus.total += 1500000;
  }

  // Annual bonus for overall performance
  if (metrics.qualityScore && metrics.qualityScore >= 4) {
    calculation.annualBonus.breakdown.push({
      bonusId: 'annual_performance',
      name: 'Thưởng hiệu suất năm',
      amount: 5000000,
      achieved: true,
      reason: `Điểm chất lượng: ${metrics.qualityScore}/5`
    });
    calculation.annualBonus.total += 5000000;
  }

  // Penalties
  if (metrics.systemDowntime && metrics.systemDowntime > 2) {
    calculation.penalties.breakdown.push({
      penaltyId: 'excessive_downtime',
      name: 'Phạt thời gian ngừng hoạt động',
      amount: 1000000,
      applied: true,
      reason: `Hệ thống ngừng hoạt động ${metrics.systemDowntime} giờ`
    });
    calculation.penalties.total += 1000000;
  }
}

// IT Head bonus calculation
function calculateITHeadBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Team performance bonus
  if (metrics.operationalImprovement) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'team_improvement',
      name: 'Thưởng cải thiện hoạt động',
      amount: 3000000,
      achieved: true,
      reason: 'Cải thiện hiệu suất hoạt động của team'
    });
    calculation.quarterlyBonus.total += 3000000;
  }

  // Audit compliance bonus
  if (metrics.auditAnalysis) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'audit_compliance',
      name: 'Thưởng tuân thủ kiểm toán',
      amount: 2000000,
      achieved: true,
      reason: 'Hoàn thành phân tích kiểm toán'
    });
    calculation.quarterlyBonus.total += 2000000;
  }
}

// Marketing Head bonus calculation
function calculateMarketingHeadBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Campaign success bonus
  if (metrics.campaignSuccess && metrics.campaignSuccess >= 80) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'campaign_success',
      name: 'Thưởng chiến dịch thành công',
      amount: 4000000,
      achieved: true,
      reason: `Tỷ lệ thành công chiến dịch: ${metrics.campaignSuccess}%`
    });
    calculation.quarterlyBonus.total += 4000000;
  }

  // Lead generation bonus
  if (metrics.leadGeneration && metrics.leadGeneration >= 100) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'lead_generation',
      name: 'Thưởng tạo lead',
      amount: 2500000,
      achieved: true,
      reason: `Tạo được ${metrics.leadGeneration} lead`
    });
    calculation.quarterlyBonus.total += 2500000;
  }
}

// Marketing Assistant bonus calculation
function calculateMarketingAssistantBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Content creation bonus
  if (metrics.contentCreation && metrics.contentCreation >= 20) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'content_creation',
      name: 'Thưởng tạo nội dung',
      amount: 1500000,
      achieved: true,
      reason: `Tạo được ${metrics.contentCreation} nội dung`
    });
    calculation.quarterlyBonus.total += 1500000;
  }

  // Social media engagement bonus
  if (metrics.socialMediaEngagement && metrics.socialMediaEngagement >= 70) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'social_engagement',
      name: 'Thưởng tương tác mạng xã hội',
      amount: 1200000,
      achieved: true,
      reason: `Tỷ lệ tương tác: ${metrics.socialMediaEngagement}%`
    });
    calculation.quarterlyBonus.total += 1200000;
  }
}

// Customer Service bonus calculation
function calculateCustomerServiceBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Response time bonus
  if (metrics.responseTime && metrics.responseTime <= 2) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'fast_response',
      name: 'Thưởng phản hồi nhanh',
      amount: 1000000,
      achieved: true,
      reason: `Thời gian phản hồi: ${metrics.responseTime} giờ`
    });
    calculation.quarterlyBonus.total += 1000000;
  }

  // Customer satisfaction bonus
  if (metrics.customerSatisfaction && metrics.customerSatisfaction >= 4.5) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'customer_satisfaction',
      name: 'Thưởng hài lòng khách hàng',
      amount: 2000000,
      achieved: true,
      reason: `Điểm hài lòng: ${metrics.customerSatisfaction}/5`
    });
    calculation.quarterlyBonus.total += 2000000;
  }
}

// Customer Service Head bonus calculation
function calculateCustomerServiceHeadBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Team performance bonus
  if (metrics.complaintResolution && metrics.complaintResolution >= 95) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'complaint_resolution',
      name: 'Thưởng giải quyết khiếu nại',
      amount: 3000000,
      achieved: true,
      reason: `Tỷ lệ giải quyết: ${metrics.complaintResolution}%`
    });
    calculation.quarterlyBonus.total += 3000000;
  }
}

// Credit Appraisal bonus calculation
function calculateCreditAppraisalBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Accuracy bonus
  if (metrics.budgetAccuracy && metrics.budgetAccuracy >= 95) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'accuracy_bonus',
      name: 'Thưởng độ chính xác',
      amount: 2500000,
      achieved: true,
      reason: `Độ chính xác: ${metrics.budgetAccuracy}%`
    });
    calculation.quarterlyBonus.total += 2500000;
  }
}

// HR Admin bonus calculation
function calculateHRAdminBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Recruitment bonus
  if (metrics.recruitmentTarget && metrics.recruitmentTarget >= 90) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'recruitment_bonus',
      name: 'Thưởng tuyển dụng',
      amount: 2000000,
      achieved: true,
      reason: `Đạt ${metrics.recruitmentTarget}% mục tiêu tuyển dụng`
    });
    calculation.quarterlyBonus.total += 2000000;
  }
}

// HR Head bonus calculation
function calculateHRHeadBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Employee satisfaction bonus
  if (metrics.employeeSatisfaction && metrics.employeeSatisfaction >= 4) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'employee_satisfaction',
      name: 'Thưởng hài lòng nhân viên',
      amount: 3000000,
      achieved: true,
      reason: `Điểm hài lòng: ${metrics.employeeSatisfaction}/5`
    });
    calculation.quarterlyBonus.total += 3000000;
  }

  // Retention rate bonus
  if (metrics.retentionRate && metrics.retentionRate >= 90) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'retention_rate',
      name: 'Thưởng tỷ lệ giữ chân',
      amount: 2500000,
      achieved: true,
      reason: `Tỷ lệ giữ chân: ${metrics.retentionRate}%`
    });
    calculation.quarterlyBonus.total += 2500000;
  }
}

// Accountant bonus calculation
function calculateAccountantBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Report timeliness bonus
  if (metrics.reportTimeliness) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'timely_reports',
      name: 'Thưởng báo cáo đúng hạn',
      amount: 1500000,
      achieved: true,
      reason: 'Báo cáo được nộp đúng hạn'
    });
    calculation.quarterlyBonus.total += 1500000;
  }

  // Audit compliance bonus
  if (metrics.auditCompliance) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'audit_compliance',
      name: 'Thưởng tuân thủ kiểm toán',
      amount: 2000000,
      achieved: true,
      reason: 'Tuân thủ các quy định kiểm toán'
    });
    calculation.quarterlyBonus.total += 2000000;
  }
}

// System Admin bonus calculation
function calculateSystemAdminBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // System stability bonus
  if (metrics.systemUptime && metrics.systemUptime >= 99.9) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'system_stability',
      name: 'Thưởng ổn định hệ thống',
      amount: 3000000,
      achieved: true,
      reason: `Hệ thống ổn định ${metrics.systemUptime}%`
    });
    calculation.quarterlyBonus.total += 3000000;
  }

  // Innovation bonus
  if (metrics.innovationContribution) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'innovation',
      name: 'Thưởng đóng góp sáng tạo',
      amount: 2000000,
      achieved: true,
      reason: 'Đóng góp cải tiến hệ thống'
    });
    calculation.quarterlyBonus.total += 2000000;
  }
}

// Default bonus calculation for unspecified roles
function calculateDefaultBonus(calculation: BonusCalculation, metrics: EmployeePerformanceData['metrics']) {
  // Task completion bonus
  if (metrics.taskCompletion && metrics.taskCompletion >= 90) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'task_completion',
      name: 'Thưởng hoàn thành công việc',
      amount: 1500000,
      achieved: true,
      reason: `Hoàn thành ${metrics.taskCompletion}% công việc`
    });
    calculation.quarterlyBonus.total += 1500000;
  }

  // Quality bonus
  if (metrics.qualityScore && metrics.qualityScore >= 4) {
    calculation.quarterlyBonus.breakdown.push({
      bonusId: 'quality_bonus',
      name: 'Thưởng chất lượng',
      amount: 1000000,
      achieved: true,
      reason: `Điểm chất lượng: ${metrics.qualityScore}/5`
    });
    calculation.quarterlyBonus.total += 1000000;
  }
}
