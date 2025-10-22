import { supabase, Database } from '@/lib/supabase'

// Type aliases for easier use
type Employee = Database['public']['Tables']['employees']['Row']
type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

type Department = Database['public']['Tables']['departments']['Row']
type DepartmentInsert = Database['public']['Tables']['departments']['Insert']
type DepartmentUpdate = Database['public']['Tables']['departments']['Update']

type Kpi = Database['public']['Tables']['kpis']['Row']
type KpiInsert = Database['public']['Tables']['kpis']['Insert']
type KpiUpdate = Database['public']['Tables']['kpis']['Update']

type KpiRecord = Database['public']['Tables']['kpi_records']['Row']
type KpiRecordInsert = Database['public']['Tables']['kpi_records']['Insert']
type KpiRecordUpdate = Database['public']['Tables']['kpi_records']['Update']

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type { Employee, EmployeeInsert, EmployeeUpdate }
export type { Department, DepartmentInsert, DepartmentUpdate }
export type { Kpi, KpiInsert, KpiUpdate }
export type { KpiRecord, KpiRecordInsert, KpiRecordUpdate }
export type { Notification, NotificationInsert, NotificationUpdate }

// Employee operations
export const employeeService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        departments:department_id(name, code),
        roles:role_id(name, code, level)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        departments:department_id(name, code),
        roles:role_id(name, code, level)
      `)
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(employee: EmployeeInsert): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
    
    if (error) throw error
    return Array.isArray(data) ? (data[0] as any) : (data as any)
  },

  async update(id: string, updates: EmployeeUpdate): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Role operations
export const roleService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByLevel(level: number): Promise<any | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('level', level)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async getByCode(code: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  },

  async create(role: any): Promise<any> {
    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async ensureRoleForLevel(level: number, companyId: string): Promise<any> {
    // Try to get existing role
    const existing = await this.getByLevel(level)
    if (existing) return existing

    // Create a minimal role for this level
    const roleNames: Record<number, { name: string; code: string }> = {
      1: { name: 'Employee', code: 'EMPLOYEE' },
      2: { name: 'Manager', code: 'MANAGER' },
      3: { name: 'Director', code: 'DIRECTOR' },
      4: { name: 'Administrator', code: 'ADMIN' },
    }
    const meta = roleNames[level] || { name: `Role${level}`, code: `ROLE_${level}` }
    return await this.create({
      company_id: companyId,
      name: meta.name,
      code: meta.code,
      level,
      permissions: [],
      is_active: true,
    })
  },

  async update(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('roles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Company operations
export const companyService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(company: any): Promise<any> {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getDefault(): Promise<{ id: string } | null> {
    try {
      // Thử lấy company hiện có
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (data) {
        return data;
      }

      // Nếu không có, tạo company mặc định
      if (error && (error as any).code === 'PGRST116') { // No rows found
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Y99 Company',
            code: 'Y99',
            description: 'Công ty Y99',
            email: 'contact@y99.vn',
            is_active: true
          })
          .select('id')
          .single();

        if (createError) throw createError;
        return newCompany;
      }

      throw error;
    } catch (error) {
      console.error('Error getting default company:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('companies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Department operations
export const departmentService = {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(department: DepartmentInsert): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert(department)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: DepartmentUpdate): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// KPI operations
export const kpiService = {
  async getAll(): Promise<Kpi[]> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      // Surface a clearer error to the caller for easier debugging in the UI
      const enriched = new Error(
        `Supabase kpis.getAll failed: ${(error as any)?.message || 'Unknown error'}${(error as any)?.code ? ` (code ${(error as any).code})` : ''}`
      ) as Error & { code?: string; details?: string; hint?: string }
      enriched.code = (error as any)?.code
      enriched.details = (error as any)?.details
      enriched.hint = (error as any)?.hint
      throw enriched
    }
    return data || []
  },

  async getById(id: string): Promise<Kpi | null> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(kpi: KpiInsert): Promise<Kpi> {
    const { data, error } = await supabase
      .from('kpis')
      .insert(kpi)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: KpiUpdate): Promise<Kpi> {
    const { data, error } = await supabase
      .from('kpis')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kpis')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// KPI Record operations
export const kpiRecordService = {
  async getAll(): Promise<KpiRecord[]> {
    const { data, error } = await supabase
      .from('kpi_records')
      .select(`
        *,
        kpis: kpi_id (
          id,
          name,
          description,
          unit,
          target
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      const enriched = new Error(
        `Supabase kpi_records.getAll failed: ${(error as any)?.message || 'Unknown error'}${(error as any)?.code ? ` (code ${(error as any).code})` : ''}`
      ) as Error & { code?: string; details?: string; hint?: string }
      enriched.code = (error as any)?.code
      enriched.details = (error as any)?.details
      enriched.hint = (error as any)?.hint
      throw enriched
    }
    return data || []
  },

  async getByEmployeeId(employeeId: string): Promise<KpiRecord[]> {
    const { data, error } = await supabase
      .from('kpi_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<KpiRecord | null> {
    const { data, error } = await supabase
      .from('kpi_records')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(kpiRecord: KpiRecordInsert): Promise<KpiRecord> {
    // Đảm bảo có đầy đủ các field required
    const recordData = {
      ...kpiRecord,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    console.log('Creating KPI record with data:', recordData);

    const { data, error } = await supabase
      .from('kpi_records')
      .insert(recordData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating KPI record:', error);
      console.error('Record data:', recordData);
      throw error;
    }
    return data
  },

  async update(id: string, updates: KpiRecordUpdate): Promise<KpiRecord> {
    const { data, error } = await supabase
      .from('kpi_records')
      .update({ ...updates, updated_at: new Date().toISOString(), last_updated: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kpi_records')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Notification operations
export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      const enriched = new Error(
        `Supabase notifications.getAll failed: ${(error as any)?.message || 'Unknown error'}${(error as any)?.code ? ` (code ${(error as any).code})` : ''}`
      ) as Error & { code?: string; details?: string; hint?: string }
      enriched.code = (error as any)?.code
      enriched.details = (error as any)?.details
      enriched.hint = (error as any)?.hint
      throw enriched
    }
    return data || []
  },

  async getByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(notification: NotificationInsert): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)
    
    if (error) throw error
  },

  async getById(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: NotificationUpdate): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}
