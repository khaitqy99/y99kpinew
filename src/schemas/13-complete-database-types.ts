-- =====================================================
-- COMPLETE DATABASE SCHEMA
-- Schema hoàn chỉnh cho hệ thống quản lý KPI
-- =====================================================

-- Database types cho schema đầy đủ và nhất quán
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          code: string
          description?: string
          email?: string
          phone?: string
          address?: string
          logo_url?: string
          website?: string
          tax_code?: string
          business_license?: string
          founded_date?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string
          email?: string
          phone?: string
          address?: string
          logo_url?: string
          website?: string
          tax_code?: string
          business_license?: string
          founded_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          email?: string
          phone?: string
          address?: string
          logo_url?: string
          website?: string
          tax_code?: string
          business_license?: string
          founded_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          company_id: string
          name: string
          code: string
          description?: string
          manager_id?: string
          parent_department_id?: string
          level: number
          budget?: number
          cost_center?: string
          location?: string
          phone?: string
          email?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          code: string
          description?: string
          manager_id?: string
          parent_department_id?: string
          level?: number
          budget?: number
          cost_center?: string
          location?: string
          phone?: string
          email?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          code?: string
          description?: string
          manager_id?: string
          parent_department_id?: string
          level?: number
          budget?: number
          cost_center?: string
          location?: string
          phone?: string
          email?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          company_id: string
          name: string
          code: string
          description?: string
          level: number
          permissions: any[]
          is_system_role: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          code: string
          description?: string
          level?: number
          permissions?: any[]
          is_system_role?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          code?: string
          description?: string
          level?: number
          permissions?: any[]
          is_system_role?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          company_id: string
          employee_code: string
          name: string
          email: string
          phone?: string
          avatar_url?: string
          role_id: string
          department_id: string
          manager_id?: string
          position: string
          level: number
          salary?: number
          currency: string
          hire_date: string
          contract_type: string
          contract_start_date?: string
          contract_end_date?: string
          status: 'active' | 'inactive' | 'suspended' | 'terminated' | 'on_leave'
          is_active: boolean
          password_hash: string
          last_login?: string
          login_attempts: number
          locked_until?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_code: string
          name: string
          email: string
          phone?: string
          avatar_url?: string
          role_id: string
          department_id: string
          manager_id?: string
          position: string
          level?: number
          salary?: number
          currency?: string
          hire_date?: string
          contract_type?: string
          contract_start_date?: string
          contract_end_date?: string
          status?: 'active' | 'inactive' | 'suspended' | 'terminated' | 'on_leave'
          is_active?: boolean
          password_hash: string
          last_login?: string
          login_attempts?: number
          locked_until?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_code?: string
          name?: string
          email?: string
          phone?: string
          avatar_url?: string
          role_id?: string
          department_id?: string
          manager_id?: string
          position?: string
          level?: number
          salary?: number
          currency?: string
          hire_date?: string
          contract_type?: string
          contract_start_date?: string
          contract_end_date?: string
          status?: 'active' | 'inactive' | 'suspended' | 'terminated' | 'on_leave'
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
          id: string
          company_id: string
          name: string
          description?: string
          department_id: string
          target: number
          unit: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          category: 'performance' | 'quality' | 'efficiency' | 'compliance' | 'growth' | 'financial' | 'customer' | 'innovation'
          weight: number
          status: 'active' | 'inactive' | 'paused' | 'archived'
          reward_penalty_config: any
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string
          department_id: string
          target: number
          unit: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          category: 'performance' | 'quality' | 'efficiency' | 'compliance' | 'growth' | 'financial' | 'customer' | 'innovation'
          weight: number
          status?: 'active' | 'inactive' | 'paused' | 'archived'
          reward_penalty_config: any
          created_by: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string
          department_id?: string
          target?: number
          unit?: string
          frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          category?: 'performance' | 'quality' | 'efficiency' | 'compliance' | 'growth' | 'financial' | 'customer' | 'innovation'
          weight?: number
          status?: 'active' | 'inactive' | 'paused' | 'archived'
          reward_penalty_config?: any
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      kpi_records: {
        Row: {
          id: string
          kpi_id: string
          employee_id?: string
          department_id?: string
          period: string
          target: number
          actual: number
          progress: number
          status: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'overdue'
          start_date: string
          end_date: string
          submission_date?: string
          approval_date?: string
          approved_by?: string
          submission_details: string
          attachment?: string
          bonus_amount: number
          penalty_amount: number
          score?: number
          is_active: boolean
          created_at: string
          updated_at: string
          last_updated: string
        }
        Insert: {
          id?: string
          kpi_id: string
          employee_id?: string
          department_id?: string
          period: string
          target: number
          actual: number
          progress: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'overdue'
          start_date: string
          end_date: string
          submission_date?: string
          approval_date?: string
          approved_by?: string
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
          id?: string
          kpi_id?: string
          employee_id?: string
          department_id?: string
          period?: string
          target?: number
          actual?: number
          progress?: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'overdue'
          start_date?: string
          end_date?: string
          submission_date?: string
          approval_date?: string
          approved_by?: string
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
          id: string
          date: string
          department_id?: string
          department_name: string
          employee_id?: string
          responsible_person: string
          kpi_id?: string
          kpi_name: string
          actual_result: number
          target_result?: number
          progress_percentage?: number
          notes?: string
          created_by?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          department_id?: string
          department_name: string
          employee_id?: string
          responsible_person: string
          kpi_id?: string
          kpi_name: string
          actual_result: number
          target_result?: number
          progress_percentage?: number
          notes?: string
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          department_id?: string
          department_name?: string
          employee_id?: string
          responsible_person?: string
          kpi_id?: string
          kpi_name?: string
          actual_result?: number
          target_result?: number
          progress_percentage?: number
          notes?: string
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          priority: string
          category: string
          title: string
          message: string
          read: boolean
          read_at?: string
          action_url?: string
          metadata: any
          sender_id?: string
          expires_at?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          priority: string
          category: string
          title: string
          message: string
          read?: boolean
          read_at?: string
          action_url?: string
          metadata?: any
          sender_id?: string
          expires_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          priority?: string
          category?: string
          title?: string
          message?: string
          read?: boolean
          read_at?: string
          action_url?: string
          metadata?: any
          sender_id?: string
          expires_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bonus_configs: {
        Row: {
          id: string
          company_id: string
          name: string
          description?: string
          amount: number
          currency: string
          frequency: string
          conditions: any[]
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string
          amount: number
          currency?: string
          frequency: string
          conditions: any[]
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string
          amount?: number
          currency?: string
          frequency?: string
          conditions?: any[]
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      penalty_configs: {
        Row: {
          id: string
          company_id: string
          name: string
          description?: string
          amount: number
          currency: string
          conditions: any[]
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string
          amount: number
          currency?: string
          conditions: any[]
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string
          amount?: number
          currency?: string
          conditions?: any[]
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          kpi_record_id: string
          author_id: string
          author_name: string
          comment: string
          type: string
          rating?: number
          is_visible_to_employee: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kpi_record_id: string
          author_id: string
          author_name: string
          comment: string
          type: string
          rating?: number
          is_visible_to_employee?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kpi_record_id?: string
          author_id?: string
          author_name?: string
          comment?: string
          type?: string
          rating?: number
          is_visible_to_employee?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bonus_penalty_records: {
        Row: {
          id: string
          employee_id: string
          kpi_record_id?: string
          bonus_config_id?: string
          penalty_config_id?: string
          amount: number
          currency: string
          type: string
          reason: string
          period: string
          status: string
          approved_by?: string
          approved_at?: string
          paid_at?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          kpi_record_id?: string
          bonus_config_id?: string
          penalty_config_id?: string
          amount: number
          currency?: string
          type: string
          reason: string
          period: string
          status?: string
          approved_by?: string
          approved_at?: string
          paid_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          kpi_record_id?: string
          bonus_config_id?: string
          penalty_config_id?: string
          amount?: number
          currency?: string
          type?: string
          reason?: string
          period?: string
          status?: string
          approved_by?: string
          approved_at?: string
          paid_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
