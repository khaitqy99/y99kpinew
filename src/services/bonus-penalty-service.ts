import { supabase } from '@/lib/supabase';
import { notificationManager } from './notification-service';
import {
  validateBonusPenaltyRecord,
  sanitizeString,
  type BonusPenaltyRecordValidationData
} from '@/lib/validation';
import { employeeService } from './supabase-service';
import { periodLabelToDateRange, getPeriodDateRange } from '@/lib/period-utils';

export interface BonusPenaltyRecord {
  id: string;
  employee_id: string;
  kpi_id?: string;
  type: 'bonus' | 'penalty';
  amount: number;
  reason: string;
  period: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
    role_id?: string;
    roles?: {
      id: string;
      name: string;
    };
  };
  kpis?: {
    id: string;
    name: string;
    description?: string;
    unit?: string;
  };
}

export interface CreateBonusPenaltyRecord {
  employee_id: string;
  kpi_id?: string;
  type: 'bonus' | 'penalty';
  amount: number;
  reason: string;
  period: string;
  created_by?: string;
}

export interface BonusPenaltySummary {
  totalEmployees: number;
  totalBonus: number;
  totalPenalty: number;
  netAmount: number;
  totalRecords: number;
}

class BonusPenaltyService {
  // Get all bonus/penalty records
  async getRecords(period?: string): Promise<BonusPenaltyRecord[]> {
    let query = supabase
      .from('bonus_penalty_records')
      .select(`
        *,
        employees!bonus_penalty_records_employee_id_fkey (
          id,
          name,
          role_id,
          roles (
            id,
            name
          )
        ),
        kpis!bonus_penalty_records_kpi_id_fkey (
          id,
          name,
          description,
          unit
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (period) {
      query = query.eq('period', period);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bonus/penalty records:', error);
      throw new Error('Failed to fetch bonus/penalty records');
    }

    return data || [];
  }

  // Get records for a specific employee
  async getRecordsByEmployee(employeeId: string, period?: string): Promise<BonusPenaltyRecord[]> {
    let query = supabase
      .from('bonus_penalty_records')
      .select(`
        *,
        employees!bonus_penalty_records_employee_id_fkey (
          id,
          name,
          role_id,
          roles (
            id,
            name
          )
        ),
        kpis!bonus_penalty_records_kpi_id_fkey (
          id,
          name,
          description,
          unit
        )
      `)
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching employee bonus/penalty records:', error);
      throw new Error('Failed to fetch employee bonus/penalty records');
    }

    let records = data || [];

    // If period is provided, filter records that overlap with the period
    if (period && records.length > 0) {
      // Convert period label to date range if needed
      let periodDateRange: string;
      try {
        // Check if it's already a date range format
        if (period.includes(' to ')) {
          periodDateRange = period;
        } else {
          // Convert label to date range
          periodDateRange = periodLabelToDateRange(period);
        }
      } catch (error) {
        console.warn('Could not parse period, returning all records:', error);
        return records;
      }

      // Get the date range for the selected period
      const selectedRange = getPeriodDateRange(periodDateRange);

      // Filter records whose period overlaps with the selected period
      records = records.filter(record => {
        if (!record.period) return false;

        try {
          // Parse the record's period (should be in date range format)
          const recordRange = getPeriodDateRange(record.period);

          // Check if periods overlap: two periods overlap if one starts before the other ends
          const overlaps = 
            recordRange.startDate <= selectedRange.endDate &&
            recordRange.endDate >= selectedRange.startDate;

          return overlaps;
        } catch (error) {
          console.warn('Could not parse record period:', record.period, error);
          // If we can't parse the period, include it for safety
          return true;
        }
      });
    }

    return records;
  }

  // Create a new bonus/penalty record (simplified version)
  async createRecord(record: CreateBonusPenaltyRecord): Promise<BonusPenaltyRecord> {
    // Convert string IDs to numbers
    const employeeId = typeof record.employee_id === 'string' ? Number(record.employee_id) : record.employee_id;
    const kpiId = record.kpi_id && record.kpi_id !== '' ? (typeof record.kpi_id === 'string' ? Number(record.kpi_id) : record.kpi_id) : null;
    const createdBy = record.created_by ? (typeof record.created_by === 'string' ? Number(record.created_by) : record.created_by) : null;

    // Validate record data
    const validation = validateBonusPenaltyRecord({
      employee_id: employeeId,
      type: record.type,
      amount: record.amount,
      reason: record.reason,
      period: record.period
    } as BonusPenaltyRecordValidationData);

    if (!validation.valid) {
      throw new Error(validation.error || 'Dữ liệu bonus/penalty record không hợp lệ');
    }

    // Validate foreign keys
    const employee = await employeeService.getById(employeeId);
    if (!employee) {
      throw new Error(`Employee với ID ${employeeId} không tồn tại`);
    }

    if (kpiId) {
      // Validate KPI exists
      const { data: kpi, error: kpiError } = await supabase
        .from('kpis')
        .select('id')
        .eq('id', kpiId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (kpiError || !kpi) {
        throw new Error(`KPI với ID ${kpiId} không tồn tại hoặc không active`);
      }
    }

    if (createdBy) {
      const creator = await employeeService.getById(createdBy);
      if (!creator) {
        throw new Error(`Employee với ID ${createdBy} không tồn tại`);
      }
    }

    // Prepare the record data, handling kpi_id properly
    const recordData = {
      employee_id: employeeId,
      type: record.type,
      amount: record.amount,
      reason: sanitizeString(record.reason),
      period: sanitizeString(record.period),
      created_by: createdBy,
      kpi_id: kpiId,
    };

    console.log('Creating record with data:', recordData);

    const { data, error } = await supabase
      .from('bonus_penalty_records')
      .insert([recordData])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating bonus/penalty record:', error);
      console.error('Record data:', recordData);
      throw new Error(`Failed to create bonus/penalty record: ${error.message}`);
    }

    // Fetch the complete record with relations
    const { data: completeRecord, error: fetchError } = await supabase
      .from('bonus_penalty_records')
      .select(`
        *,
        employees!bonus_penalty_records_employee_id_fkey (
          id,
          name,
          role_id,
          roles (
            id,
            name
          )
        ),
        kpis!bonus_penalty_records_kpi_id_fkey (
          id,
          name,
          description,
          unit
        )
      `)
      .eq('id', data.id)
      .single();

    if (fetchError) {
      console.warn('Could not fetch complete record, returning basic data:', fetchError);
      return data as BonusPenaltyRecord;
    }

    // Gửi thông báo cho nhân viên
    try {
      if (completeRecord.employees) {
        const notificationResult = await notificationManager.notifyBonusPenaltyAdded(
          completeRecord,
          {
            id: completeRecord.employees.id,
            name: completeRecord.employees.name
          },
          record.type === 'bonus' ? record.amount : undefined,
          record.type === 'penalty' ? record.amount : undefined
        );
        
        if (notificationResult) {
          console.log('Notification sent successfully');
        } else {
          console.log('Notification skipped (special user_id)');
        }
      }
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError);
      // Không throw error để không làm gián đoạn việc tạo record
    }

    return completeRecord;
  }

  // Update a bonus/penalty record
  async updateRecord(id: string, updates: Partial<CreateBonusPenaltyRecord>): Promise<BonusPenaltyRecord> {
    const { data, error } = await supabase
      .from('bonus_penalty_records')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        employees!bonus_penalty_records_employee_id_fkey (
          id,
          name,
          role_id,
          roles (
            id,
            name
          )
        ),
        kpis!bonus_penalty_records_kpi_id_fkey (
          id,
          name,
          description,
          unit
        )
      `)
      .single();

    if (error) {
      console.error('Error updating bonus/penalty record:', error);
      throw new Error('Failed to update bonus/penalty record');
    }

    return data;
  }

  // Delete a bonus/penalty record (soft delete)
  async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('bonus_penalty_records')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting bonus/penalty record:', error);
      throw new Error('Failed to delete bonus/penalty record');
    }
  }

  // Get summary statistics for a period
  async getSummary(period?: string): Promise<BonusPenaltySummary> {
    let query = supabase
      .from('bonus_penalty_records')
      .select('employee_id, type, amount')
      .eq('is_active', true);

    if (period) {
      query = query.eq('period', period);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bonus/penalty summary:', error);
      throw new Error('Failed to fetch bonus/penalty summary');
    }

    const records = data || [];
    
    const totalBonus = records
      .filter(record => record.type === 'bonus')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const totalPenalty = records
      .filter(record => record.type === 'penalty')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const netAmount = totalBonus - totalPenalty;
    const uniqueEmployees = new Set(records.map(record => record.employee_id)).size;
    
    return {
      totalEmployees: uniqueEmployees,
      totalBonus,
      totalPenalty,
      netAmount,
      totalRecords: records.length
    };
  }

  // Get summary statistics for a specific branch
  async getSummaryByBranch(branchId: number, period?: string): Promise<BonusPenaltySummary> {
    // Get all departments in this branch
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('branch_id', branchId)
      .eq('is_active', true);

    if (deptError) {
      console.error('Error fetching departments for branch:', deptError);
      throw new Error('Failed to fetch departments for branch');
    }

    const departmentIds = (departments || []).map(d => d.id);
    
    if (departmentIds.length === 0) {
      return {
        totalEmployees: 0,
        totalBonus: 0,
        totalPenalty: 0,
        netAmount: 0,
        totalRecords: 0
      };
    }

    // Get all employees in departments of this branch using junction table
    const { data: employeeDeptRelations, error: empDeptError } = await supabase
      .from('employee_departments')
      .select('employee_id')
      .in('department_id', departmentIds);

    if (empDeptError) {
      console.warn('Error fetching employee-department relations:', empDeptError);
    }

    // Get unique employee IDs from junction table
    const employeeIdsFromJunction = new Set(
      (employeeDeptRelations || []).map((ed: any) => ed.employee_id)
    );

    // Also get employees with old format (department_id directly)
    const { data: employeesOldFormat, error: empError } = await supabase
      .from('employees')
      .select('id')
      .in('department_id', departmentIds)
      .eq('is_active', true);

    if (empError) {
      console.warn('Error fetching employees with old format:', empError);
    }

    // Combine employee IDs
    const allEmployeeIds = new Set(employeeIdsFromJunction);
    (employeesOldFormat || []).forEach((emp: any) => {
      allEmployeeIds.add(emp.id);
    });

    if (allEmployeeIds.size === 0) {
      return {
        totalEmployees: 0,
        totalBonus: 0,
        totalPenalty: 0,
        netAmount: 0,
        totalRecords: 0
      };
    }

    // Get bonus/penalty records for these employees
    let query = supabase
      .from('bonus_penalty_records')
      .select('employee_id, type, amount')
      .in('employee_id', Array.from(allEmployeeIds))
      .eq('is_active', true);

    if (period) {
      query = query.eq('period', period);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bonus/penalty summary by branch:', error);
      throw new Error('Failed to fetch bonus/penalty summary by branch');
    }

    const records = data || [];
    
    const totalBonus = records
      .filter(record => record.type === 'bonus')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const totalPenalty = records
      .filter(record => record.type === 'penalty')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const netAmount = totalBonus - totalPenalty;
    const uniqueEmployees = new Set(records.map(record => record.employee_id)).size;
    
    return {
      totalEmployees: uniqueEmployees,
      totalBonus,
      totalPenalty,
      netAmount,
      totalRecords: records.length
    };
  }

  // Get available periods
  async getAvailablePeriods(): Promise<string[]> {
    const { data, error } = await supabase
      .from('bonus_penalty_records')
      .select('period')
      .eq('is_active', true)
      .order('period', { ascending: false });

    if (error) {
      console.error('Error fetching available periods:', error);
      throw new Error('Failed to fetch available periods');
    }

    const periods = [...new Set(data?.map(record => record.period) || [])];
    return periods;
  }
}

export const bonusPenaltyService = new BonusPenaltyService();
