import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfvtyrfkrahrtotillfw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdnR5cmZrcmFocnRvdGlsbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzkyODMsImV4cCI6MjA3NjUxNTI4M30.KxJVEMPxQdo-uChZ5cvv3ne7GDfReQ1sCaY-wXxG9Kk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types cho schema đăng nhập mới
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
          salary: number
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
    }
  }
}
