import { supabase } from '@/lib/supabase';
import { notificationManager } from './notification-service';

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

    if (period) {
      query = query.eq('period', period);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching employee bonus/penalty records:', error);
      throw new Error('Failed to fetch employee bonus/penalty records');
    }

    return data || [];
  }

  // Create a new bonus/penalty record (simplified version)
  async createRecord(record: CreateBonusPenaltyRecord): Promise<BonusPenaltyRecord> {
    // Prepare the record data, handling kpi_id properly
    const recordData = {
      employee_id: record.employee_id,
      type: record.type,
      amount: record.amount,
      reason: record.reason,
      period: record.period,
      created_by: record.created_by,
      kpi_id: record.kpi_id && record.kpi_id !== '' ? record.kpi_id : null,
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
