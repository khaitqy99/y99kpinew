import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfvtyrfkrahrtotillfw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdnR5cmZrcmFocnRvdGlsbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzkyODMsImV4cCI6MjA3NjUxNTI4M30.KxJVEMPxQdo-uChZ5cvv3ne7GDfReQ1sCaY-wXxG9Kk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types cho schema đầy đủ và nhất quán
// Tất cả ID dùng BIGINT (number) thay vì UUID (string) để dễ đọc và quản lý
export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: number  // BIGSERIAL → number
          name: string
          code: string
          description?: string
          manager_id?: number  // BIGINT → number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          code: string
          description?: string
          manager_id?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          code?: string
          description?: string
          manager_id?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: number  // BIGSERIAL → number
          name: string
          code: string
          description?: string
          level: number
          permissions: any[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          code: string
          description?: string
          level?: number
          permissions?: any[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          code?: string
          description?: string
          level?: number
          permissions?: any[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: number  // BIGSERIAL → number
          employee_code: string
          name: string
          email: string
          avatar_url?: string
          role_id: number  // BIGINT → number
          department_id: number  // BIGINT → number
          position: string
          level: number
          currency: string
          hire_date: string
          contract_type: string
          status: 'active' | 'inactive' | 'suspended' | 'terminated'
          is_active: boolean
          password_hash: string
          last_login?: string
          login_attempts: number
          locked_until?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          employee_code: string
          name: string
          email: string
          avatar_url?: string
          role_id: number
          department_id: number
          manager_id?: number
          position: string
          level?: number
          salary?: number
          currency?: string
          hire_date?: string
          contract_type?: string
          status?: 'active' | 'inactive' | 'suspended' | 'terminated'
          is_active?: boolean
          password_hash: string
          last_login?: string
          login_attempts?: number
          locked_until?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          employee_code?: string
          name?: string
          email?: string
          avatar_url?: string
          role_id?: number
          department_id?: number
          manager_id?: number
          position?: string
          level?: number
          salary?: number
          currency?: string
          hire_date?: string
          contract_type?: string
          status?: 'active' | 'inactive' | 'suspended' | 'terminated'
          is_active?: boolean
          password_hash?: string
          last_login?: string
          login_attempts?: number
          locked_until?: string
          created_at?: string
          updated_at?: string
        }
      }
      kpis: {
        Row: {
          id: number  // BIGSERIAL → number
          name: string
          description: string
          department_id: number  // BIGINT → number
          target: number
          unit: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          status: 'active' | 'inactive' | 'paused' | 'archived'
          reward_penalty_config: string | any  // JSONB → string hoặc parsed object
          created_by?: number  // BIGINT → number (optional)
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          department_id: number
          target: number
          unit: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          status?: 'active' | 'inactive' | 'paused' | 'archived'
          reward_penalty_config: string | any  // JSONB → string hoặc object
          created_by?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          department_id?: number
          target?: number
          unit?: string
          frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          status?: 'active' | 'inactive' | 'paused' | 'archived'
          reward_penalty_config?: string | any
          created_by?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      kpi_records: {
        Row: {
          id: number  // BIGSERIAL → number
          kpi_id: number  // BIGINT → number
          employee_id?: number  // BIGINT → number
          department_id?: number  // BIGINT → number
          period: string
          target: number
          actual: number
          progress: number
          status: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'overdue'
          start_date: string
          end_date: string
          submission_date?: string
          approval_date?: string
          approved_by?: number  // BIGINT → number
          submission_details: string
          attachment?: string
          bonus_amount?: number
          penalty_amount?: number
          score?: number
          is_active: boolean
          created_at: string
          updated_at: string
          last_updated: string
        }
        Insert: {
          id?: number
          kpi_id: number
          employee_id?: number
          department_id?: number
          period: string
          target: number
          actual: number
          progress: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'overdue'
          start_date: string
          end_date: string
          submission_date?: string
          approval_date?: string
          approved_by?: number
          submission_details: string
          attachment?: string
          bonus_amount?: number
          penalty_amount?: number
          score?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_updated?: string
        }
        Update: {
          id?: number
          kpi_id?: number
          employee_id?: number
          department_id?: number
          period?: string
          target?: number
          actual?: number
          progress?: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'overdue'
          start_date?: string
          end_date?: string
          submission_date?: string
          approval_date?: string
          approved_by?: number
          submission_details?: string
          attachment?: string
          bonus_amount?: number
          penalty_amount?: number
          score?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_updated?: string
        }
      }
      daily_kpi_progress: {
        Row: {
          id: number  // BIGSERIAL → number
          date: string
          department_id?: number  // BIGINT → number
          department_name: string
          employee_id?: number  // BIGINT → number
          responsible_person: string
          kpi_id?: number  // BIGINT → number
          kpi_name: string
          actual_result: number
          notes?: string
          created_by?: number  // BIGINT → number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          department_id?: number
          department_name: string
          employee_id?: number
          responsible_person: string
          kpi_id?: number
          kpi_name: string
          actual_result: number
          notes?: string
          created_by?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          department_id?: number
          department_name?: string
          employee_id?: number
          responsible_person?: string
          kpi_id?: number
          kpi_name?: string
          actual_result?: number
          notes?: string
          created_by?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bonus_penalty_records: {
        Row: {
          id: number  // BIGSERIAL → number
          employee_id: number  // BIGINT → number
          kpi_id?: number  // BIGINT → number
          type: 'bonus' | 'penalty'
          amount: number
          reason: string
          period: string
          created_by?: number  // BIGINT → number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          employee_id: number
          kpi_id?: number
          type: 'bonus' | 'penalty'
          amount: number
          reason: string
          period: string
          created_by?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          employee_id?: number
          kpi_id?: number
          type?: 'bonus' | 'penalty'
          amount?: number
          reason?: string
          period?: string
          created_by?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      kpi_submissions: {
        Row: {
          id: number  // BIGSERIAL → number
          employee_id: number  // BIGINT → number
          submission_date: string
          submission_details: string
          attachment?: string
          status: 'pending_approval' | 'approved' | 'rejected'
          approval_date?: string
          approved_by?: number  // BIGINT → number
          rejection_reason?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          employee_id: number
          submission_date?: string
          submission_details?: string
          attachment?: string
          status?: 'pending_approval' | 'approved' | 'rejected'
          approval_date?: string
          approved_by?: number
          rejection_reason?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          employee_id?: number
          submission_date?: string
          submission_details?: string
          attachment?: string
          status?: 'pending_approval' | 'approved' | 'rejected'
          approval_date?: string
          approved_by?: number
          rejection_reason?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      kpi_submission_items: {
        Row: {
          id: number  // BIGSERIAL → number
          submission_id: number  // BIGINT → number
          kpi_record_id: number  // BIGINT → number
          actual: number
          progress: number
          notes?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          submission_id: number
          kpi_record_id: number
          actual: number
          progress: number
          notes?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          submission_id?: number
          kpi_record_id?: number
          actual?: number
          progress?: number
          notes?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: number  // BIGSERIAL → number
          user_id?: number  // BIGINT → number (NULL nếu gửi cho 'all')
          user_type: 'employee' | 'admin' | 'all'
          type: 'assigned' | 'submitted' | 'approved' | 'rejected' | 'reminder' | 'reward' | 'penalty' | 'deadline' | 'system'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          category: 'kpi' | 'bonus' | 'system' | 'reminder' | 'approval'
          title: string
          message: string
          read: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id?: number  // NULL nếu user_type = 'all'
          user_type?: 'employee' | 'admin' | 'all'
          type: 'assigned' | 'submitted' | 'approved' | 'rejected' | 'reminder' | 'reward' | 'penalty' | 'deadline' | 'system'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'kpi' | 'bonus' | 'system' | 'reminder' | 'approval'
          title: string
          message: string
          read?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          user_type?: 'employee' | 'admin' | 'all'
          type?: 'assigned' | 'submitted' | 'approved' | 'rejected' | 'reminder' | 'reward' | 'penalty' | 'deadline' | 'system'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'kpi' | 'bonus' | 'system' | 'reminder' | 'approval'
          title?: string
          message?: string
          read?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}