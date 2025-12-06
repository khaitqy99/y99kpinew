import { supabase, Database } from '@/lib/supabase'
import {
  validateKpiRecord,
  validateBonusPenaltyRecord,
  validateKpi,
  validateEmployee,
  validatePeriod,
  validateDateRange,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateRange,
  validateEnum,
  sanitizeString,
  sanitizeNumber,
  VALID_STATUSES,
  VALID_KPI_STATUSES,
  VALID_FREQUENCIES,
  VALID_EMPLOYEE_STATUSES,
  type KpiRecordValidationData,
  type BonusPenaltyRecordValidationData,
  type KpiValidationData,
  type EmployeeValidationData
} from '@/lib/validation'

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

type DailyKpiProgress = Database['public']['Tables']['daily_kpi_progress']['Row']
type DailyKpiProgressInsert = Database['public']['Tables']['daily_kpi_progress']['Insert']
type DailyKpiProgressUpdate = Database['public']['Tables']['daily_kpi_progress']['Update']

type KpiSubmission = Database['public']['Tables']['kpi_submissions']['Row']
type KpiSubmissionInsert = Database['public']['Tables']['kpi_submissions']['Insert']
type KpiSubmissionUpdate = Database['public']['Tables']['kpi_submissions']['Update']

type KpiSubmissionItem = Database['public']['Tables']['kpi_submission_items']['Row']
type KpiSubmissionItemInsert = Database['public']['Tables']['kpi_submission_items']['Insert']
type KpiSubmissionItemUpdate = Database['public']['Tables']['kpi_submission_items']['Update']

export type { Employee, EmployeeInsert, EmployeeUpdate }
export type { Department, DepartmentInsert, DepartmentUpdate }
export type { Kpi, KpiInsert, KpiUpdate }
export type { KpiRecord, KpiRecordInsert, KpiRecordUpdate }
export type { Notification, NotificationInsert, NotificationUpdate }
export type { DailyKpiProgress, DailyKpiProgressInsert, DailyKpiProgressUpdate }
export type { KpiSubmission, KpiSubmissionInsert, KpiSubmissionUpdate }
export type { KpiSubmissionItem, KpiSubmissionItemInsert, KpiSubmissionItemUpdate }

// Helper function to filter out admins (level >= 4)
const filterNonAdmins = (employees: any[]): any[] => {
  return employees.filter(emp => {
    const level = emp.level || emp.roles?.level || 0;
    return level < 4; // Chỉ lấy nhân viên có level < 4 (không phải admin)
  });
};

// Employee operations
export const employeeService = {
  async getAll(): Promise<any[]> {
    try {
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
      
      // Get all employee-department relationships separately
      const employeeIds = (data || []).map((emp: any) => emp.id);
      let employeeDeptMap = new Map<number, any[]>();
      
      if (employeeIds.length > 0) {
        try {
          // Query employee_departments without relationship syntax
          const { data: employeeDepts, error: deptError } = await supabase
            .from('employee_departments')
            .select('employee_id, department_id, is_primary')
            .in('employee_id', employeeIds);
          
          if (!deptError && employeeDepts && employeeDepts.length > 0) {
            // Get unique department IDs
            const deptIds = [...new Set(employeeDepts.map((ed: any) => ed.department_id))];
            
            // Query departments separately
            const { data: deptData, error: deptDataError } = await supabase
              .from('departments')
              .select('id, name, code, branch_id')
              .in('id', deptIds);
            
            if (!deptDataError && deptData) {
              const deptMap = new Map(deptData.map((d: any) => [d.id, d]));
              
              employeeDepts.forEach((ed: any) => {
                if (!employeeDeptMap.has(ed.employee_id)) {
                  employeeDeptMap.set(ed.employee_id, []);
                }
                const dept = deptMap.get(ed.department_id);
                if (dept) {
                  employeeDeptMap.get(ed.employee_id)!.push({
                    ...ed,
                    departments: dept
                  });
                }
              });
            }
          }
        } catch (err) {
          // If junction table doesn't exist or has issues, continue with old format
          console.warn('Could not load employee_departments, using old format:', err);
        }
      }
      
      // Transform data to include all departments
      const employees = (data || []).map((emp: any) => {
        const employeeDepts = employeeDeptMap.get(emp.id) || [];
        const allDepartments = employeeDepts
          .map((ed: any) => ed.departments)
          .filter(Boolean) || [];
        
        // If no departments from junction table, use old format
        if (allDepartments.length === 0 && emp.departments) {
          allDepartments.push({
            id: emp.department_id,
            name: emp.departments.name,
            code: emp.departments.code
          });
        }
        
        const primaryDept = allDepartments.find((d: any) => 
          employeeDepts.find((ed: any) => ed.department_id === d.id && ed.is_primary)
        ) || allDepartments[0] || emp.departments;
        
        return {
          ...emp,
          departments: primaryDept, // Keep primary department for backward compatibility
          all_departments: allDepartments, // All departments
          department_ids: allDepartments.map((d: any) => d.id) // Array of department IDs
        };
      });
      
      // Filter out admins (level >= 4)
      return filterNonAdmins(employees)
    } catch (error: any) {
      console.error('Error in employeeService.getAll:', error);
      throw error;
    }
  },

  async generateUniqueEmployeeCode(): Promise<string> {
    try {
      // Get all existing employee codes
      const { data, error } = await supabase
        .from('employees')
        .select('employee_code')
        .like('employee_code', 'EMP%')
        .order('employee_code', { ascending: false })
        .limit(1000); // Limit to prevent performance issues
      
      if (error) throw error;
      
      // Find the highest number in existing codes
      let maxNumber = 0;
      if (data && data.length > 0) {
        for (const emp of data) {
          const match = emp.employee_code?.match(/^EMP(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      
      // Generate new code
      const nextNumber = maxNumber + 1;
      return `EMP${String(nextNumber).padStart(4, '0')}`;
    } catch (error: any) {
      console.error('Error generating employee code:', error);
      // Fallback: use timestamp-based code if query fails
      const timestamp = Date.now();
      return `EMP${String(timestamp).slice(-4)}`;
    }
  },

  async getById(id: number): Promise<any | null> {
    try {
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
      if (!data) return null;
      
      // Get employee-department relationships separately
      let employeeDepts: any[] = [];
      try {
        // Query employee_departments without relationship syntax
        const { data: edData, error: edError } = await supabase
          .from('employee_departments')
          .select('employee_id, department_id, is_primary')
          .eq('employee_id', id);
        
        if (!edError && edData && edData.length > 0) {
          // Get department IDs
          const deptIds = edData.map((ed: any) => ed.department_id);
          
          // Query departments separately
          const { data: deptData, error: deptDataError } = await supabase
            .from('departments')
            .select('id, name, code, branch_id')
            .in('id', deptIds);
          
          if (!deptDataError && deptData) {
            const deptMap = new Map(deptData.map((d: any) => [d.id, d]));
            employeeDepts = edData.map((ed: any) => ({
              ...ed,
              departments: deptMap.get(ed.department_id)
            })).filter((ed: any) => ed.departments);
          }
        }
      } catch (err) {
        // If junction table doesn't exist or has issues, continue with old format
        console.warn('Could not load employee_departments, using old format:', err);
      }
      
      // Transform data to include all departments
      const allDepartments = employeeDepts
        .map((ed: any) => ed.departments)
        .filter(Boolean) || [];
      
      // If no departments from junction table, use old format
      if (allDepartments.length === 0 && data.departments) {
        allDepartments.push({
          id: data.department_id,
          name: data.departments.name,
          code: data.departments.code
        });
      }
      
      const primaryDept = allDepartments.find((d: any) => 
        employeeDepts.find((ed: any) => ed.department_id === d.id && ed.is_primary)
      ) || allDepartments[0] || data.departments;
      
      return {
        ...data,
        departments: primaryDept, // Keep primary department for backward compatibility
        all_departments: allDepartments, // All departments
        department_ids: allDepartments.map((d: any) => d.id) // Array of department IDs
      };
    } catch (error: any) {
      console.error('Error in employeeService.getById:', error);
      throw error;
    }
  },

  async create(employee: EmployeeInsert): Promise<Employee> {
    // Validate employee data
    const validation = validateEmployee(employee as EmployeeValidationData)
    if (!validation.valid) {
      throw new Error(validation.error || 'Dữ liệu nhân viên không hợp lệ')
    }

    // Validate foreign keys
    if (employee.role_id) {
      const role = await roleService.getById(employee.role_id)
      if (!role) {
        throw new Error(`Role với ID ${employee.role_id} không tồn tại`)
      }
    }

    if (employee.department_id) {
      const department = await departmentService.getById(employee.department_id)
      if (!department) {
        throw new Error(`Department với ID ${employee.department_id} không tồn tại`)
      }
    }

    // Sanitize string fields
    const sanitizedEmployee = {
      ...employee,
      employee_code: sanitizeString(employee.employee_code),
      name: sanitizeString(employee.name),
      email: sanitizeString(employee.email).toLowerCase(),
      position: sanitizeString(employee.position)
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(sanitizedEmployee)
      .select()
    
    if (error) throw error
    return Array.isArray(data) ? (data[0] as any) : (data as any)
  },

  async update(id: number, updates: EmployeeUpdate): Promise<Employee> {
    // Get existing employee to merge updates
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error(`Employee với ID ${id} không tồn tại`)
    }

    // Validate updated data
    const updatedData = { ...existing, ...updates }
    const validation = validateEmployee(updatedData as EmployeeValidationData)
    if (!validation.valid) {
      throw new Error(validation.error || 'Dữ liệu nhân viên không hợp lệ')
    }

    // Validate foreign keys if updated
    if (updates.role_id !== undefined) {
      const role = await roleService.getById(updates.role_id)
      if (!role) {
        throw new Error(`Role với ID ${updates.role_id} không tồn tại`)
      }
    }

    if (updates.department_id !== undefined) {
      const department = await departmentService.getById(updates.department_id)
      if (!department) {
        throw new Error(`Department với ID ${updates.department_id} không tồn tại`)
      }
    }

    // Sanitize string fields
    const sanitizedUpdates = {
      ...updates,
      employee_code: updates.employee_code ? sanitizeString(updates.employee_code) : undefined,
      name: updates.name ? sanitizeString(updates.name) : undefined,
      email: updates.email ? sanitizeString(updates.email).toLowerCase() : undefined,
      position: updates.position ? sanitizeString(updates.position) : undefined
    }

    const { data, error } = await supabase
      .from('employees')
      .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  },

  // Employee-Department relationship management
  async setEmployeeDepartments(employeeId: number, departmentIds: number[], primaryDepartmentId?: number): Promise<void> {
    // Validate all departments exist
    for (const deptId of departmentIds) {
      const dept = await departmentService.getById(deptId);
      if (!dept) {
        throw new Error(`Department với ID ${deptId} không tồn tại`);
      }
    }

    // Delete existing relationships
    const { error: deleteError } = await supabase
      .from('employee_departments')
      .delete()
      .eq('employee_id', employeeId);
    
    if (deleteError) throw deleteError;

    // Insert new relationships
    if (departmentIds.length > 0) {
      const primaryId = primaryDepartmentId || departmentIds[0];
      const insertData = departmentIds.map(deptId => ({
        employee_id: employeeId,
        department_id: deptId,
        is_primary: deptId === primaryId
      }));

      const { error: insertError } = await supabase
        .from('employee_departments')
        .insert(insertData);
      
      if (insertError) throw insertError;

      // Update employees.department_id to primary department for backward compatibility
      const { error: updateError } = await supabase
        .from('employees')
        .update({ department_id: primaryId, updated_at: new Date().toISOString() })
        .eq('id', employeeId);
      
      if (updateError) throw updateError;
    }
  },

  async addEmployeeDepartment(employeeId: number, departmentId: number, isPrimary: boolean = false): Promise<void> {
    const dept = await departmentService.getById(departmentId);
    if (!dept) {
      throw new Error(`Department với ID ${departmentId} không tồn tại`);
    }

    // If setting as primary, unset other primary departments
    if (isPrimary) {
      const { error: unsetError } = await supabase
        .from('employee_departments')
        .update({ is_primary: false })
        .eq('employee_id', employeeId)
        .eq('is_primary', true);
      
      if (unsetError) throw unsetError;
    }

    const { error } = await supabase
      .from('employee_departments')
      .insert({
        employee_id: employeeId,
        department_id: departmentId,
        is_primary: isPrimary
      });
    
    if (error) {
      // If duplicate, update instead
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('employee_departments')
          .update({ is_primary: isPrimary })
          .eq('employee_id', employeeId)
          .eq('department_id', departmentId);
        
        if (updateError) throw updateError;
      } else {
        throw error;
      }
    }

    // Update employees.department_id if this is primary
    if (isPrimary) {
      const { error: updateError } = await supabase
        .from('employees')
        .update({ department_id: departmentId, updated_at: new Date().toISOString() })
        .eq('id', employeeId);
      
      if (updateError) throw updateError;
    }
  },

  async removeEmployeeDepartment(employeeId: number, departmentId: number): Promise<void> {
    const { error } = await supabase
      .from('employee_departments')
      .delete()
      .eq('employee_id', employeeId)
      .eq('department_id', departmentId);
    
    if (error) throw error;

    // If removed department was primary, set first remaining as primary
    const { data: remaining } = await supabase
      .from('employee_departments')
      .select('department_id')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: true })
      .limit(1);
    
    if (remaining && remaining.length > 0) {
      const { error: updateError } = await supabase
        .from('employee_departments')
        .update({ is_primary: true })
        .eq('employee_id', employeeId)
        .eq('department_id', remaining[0].department_id);
      
      if (updateError) throw updateError;

      const { error: empUpdateError } = await supabase
        .from('employees')
        .update({ department_id: remaining[0].department_id, updated_at: new Date().toISOString() })
        .eq('id', employeeId);
      
      if (empUpdateError) throw empUpdateError;
    }
  },

  async getEmployeeDepartments(employeeId: number): Promise<any[]> {
    // Query employee_departments without relationship syntax
    const { data: edData, error: edError } = await supabase
      .from('employee_departments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (edError) throw edError;
    if (!edData || edData.length === 0) return [];
    
    // Get department IDs
    const deptIds = edData.map((ed: any) => ed.department_id);
    
    // Query departments separately
    const { data: deptData, error: deptDataError } = await supabase
      .from('departments')
      .select('id, name, code, branch_id')
      .in('id', deptIds);
    
    if (deptDataError) throw deptDataError;
    
    // Combine data
    const deptMap = new Map((deptData || []).map((d: any) => [d.id, d]));
    return edData.map((ed: any) => ({
      ...ed,
      departments: deptMap.get(ed.department_id)
    })).filter((ed: any) => ed.departments);
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

  async getById(id: number): Promise<any | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
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

  async ensureRoleForLevel(level: number): Promise<any> {
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
      name: meta.name,
      code: meta.code,
      level,
      permissions: [],
      is_active: true,
    })
  },

  async update(id: number, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('roles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Helper function to filter out management department
const filterManagementDepartment = (departments: Department[]): Department[] => {
  return departments.filter(dept => {
    const name = dept.name?.toLowerCase() || '';
    const code = dept.code?.toLowerCase() || '';
    // Filter out "Phòng Quản Lý" or similar management departments
    return !name.includes('quản lý') && !code.includes('ql') && !code.includes('management');
  });
};

// Department operations
export const departmentService = {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    // Filter out management department
    return filterManagementDepartment(data || [])
  },

  async getById(id: number): Promise<Department | null> {
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

  async update(id: number, updates: DepartmentUpdate): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Branch operations
export type Branch = Database['public']['Tables']['branches']['Row']
export type BranchInsert = Database['public']['Tables']['branches']['Insert']
export type BranchUpdate = Database['public']['Tables']['branches']['Update']

export const branchService = {
  async getAll(): Promise<Branch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<Branch | null> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(branch: BranchInsert): Promise<Branch> {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, updates: BranchUpdate): Promise<Branch> {
    const { data, error } = await supabase
      .from('branches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('branches')
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
      .select(`
        *,
        departments!kpis_department_id_fkey (
          id,
          name
        )
      `)
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
    
    // Transform the data to include department name
    const transformedData = (data || []).map(kpi => ({
      ...kpi,
      department: (kpi as any).departments?.name || 'Unknown Department'
    }))
    
    return transformedData
  },

  async getById(id: number): Promise<Kpi | null> {
    const { data, error } = await supabase
      .from('kpis')
      .select(`
        *,
        departments!kpis_department_id_fkey (
          id,
          name
        )
      `)
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    if (!data) return null
    
    // Transform the data to include department name
    return {
      ...data,
      department: (data as any).departments?.name || 'Unknown Department'
    }
  },

  async create(kpi: KpiInsert): Promise<Kpi> {
    // Validate KPI data
    const validation = validateKpi(kpi as KpiValidationData)
    if (!validation.valid) {
      throw new Error(validation.error || 'Dữ liệu KPI không hợp lệ')
    }

    // Validate foreign key
    if (kpi.department_id) {
      const department = await departmentService.getById(kpi.department_id)
      if (!department) {
        throw new Error(`Department với ID ${kpi.department_id} không tồn tại`)
      }
    }

    // Validate created_by if provided
    if (kpi.created_by) {
      const creator = await employeeService.getById(kpi.created_by)
      if (!creator) {
        throw new Error(`Employee với ID ${kpi.created_by} không tồn tại`)
      }
    }

    // Sanitize string fields
    const sanitizedKpi = {
      ...kpi,
      name: sanitizeString(kpi.name),
      description: sanitizeString(kpi.description)
    }

    const { data, error } = await supabase
      .from('kpis')
      .insert(sanitizedKpi)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, updates: KpiUpdate): Promise<Kpi> {
    // Get existing KPI to merge updates
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error(`KPI với ID ${id} không tồn tại`)
    }

    // Validate updated data
    const updatedData = { ...existing, ...updates }
    const validation = validateKpi(updatedData as KpiValidationData)
    if (!validation.valid) {
      throw new Error(validation.error || 'Dữ liệu KPI không hợp lệ')
    }

    // Validate foreign key if updated
    if (updates.department_id !== undefined) {
      const department = await departmentService.getById(updates.department_id)
      if (!department) {
        throw new Error(`Department với ID ${updates.department_id} không tồn tại`)
      }
    }

    // Sanitize string fields
    const sanitizedUpdates = {
      ...updates,
      name: updates.name ? sanitizeString(updates.name) : undefined,
      description: updates.description ? sanitizeString(updates.description) : undefined
    }

    const { data, error } = await supabase
      .from('kpis')
      .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
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

  async getByEmployeeId(employeeId: number): Promise<KpiRecord[]> {
    const { data, error } = await supabase
      .from('kpi_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<KpiRecord | null> {
    const { data, error } = await supabase
      .from('kpi_records')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(kpiRecord: KpiRecordInsert): Promise<KpiRecord> {
    // Validate KPI record data
    const validation = validateKpiRecord(kpiRecord as KpiRecordValidationData)
    if (!validation.valid) {
      throw new Error(validation.error || 'Dữ liệu KPI record không hợp lệ')
    }

    // Validate foreign keys
    if (kpiRecord.kpi_id) {
      const kpi = await kpiService.getById(kpiRecord.kpi_id)
      if (!kpi) {
        throw new Error(`KPI với ID ${kpiRecord.kpi_id} không tồn tại`)
      }
    }

    if (kpiRecord.employee_id) {
      const employee = await employeeService.getById(kpiRecord.employee_id)
      if (!employee) {
        throw new Error(`Employee với ID ${kpiRecord.employee_id} không tồn tại`)
      }
    }

    if (kpiRecord.department_id) {
      const department = await departmentService.getById(kpiRecord.department_id)
      if (!department) {
        throw new Error(`Department với ID ${kpiRecord.department_id} không tồn tại`)
      }
    }

    if (kpiRecord.approved_by) {
      const approver = await employeeService.getById(kpiRecord.approved_by)
      if (!approver) {
        throw new Error(`Employee với ID ${kpiRecord.approved_by} không tồn tại`)
      }
    }

    // Check for duplicate assignment
    if (kpiRecord.employee_id && kpiRecord.period && kpiRecord.kpi_id) {
      const existing = await supabase
        .from('kpi_records')
        .select('id')
        .eq('kpi_id', kpiRecord.kpi_id)
        .eq('employee_id', kpiRecord.employee_id)
        .eq('period', kpiRecord.period)
        .eq('is_active', true)
        .maybeSingle()
      
      if (existing.data) {
        throw new Error(`KPI này đã được giao cho employee này trong kỳ ${kpiRecord.period}`)
      }
    }

    if (kpiRecord.department_id && kpiRecord.period && kpiRecord.kpi_id) {
      const existing = await supabase
        .from('kpi_records')
        .select('id')
        .eq('kpi_id', kpiRecord.kpi_id)
        .eq('department_id', kpiRecord.department_id)
        .eq('period', kpiRecord.period)
        .eq('is_active', true)
        .maybeSingle()
      
      if (existing.data) {
        throw new Error(`KPI này đã được giao cho department này trong kỳ ${kpiRecord.period}`)
      }
    }

    // Đảm bảo có đầy đủ các field required
    // Loại bỏ các field không hợp lệ như feedback, và các field có DEFAULT trong database
    const { feedback, created_at, updated_at, last_updated, ...cleanRecord } = kpiRecord as any;
    
    // Chỉ set is_active nếu được truyền vào, không thì để database tự set DEFAULT
    const recordData: any = { ...cleanRecord };
    if ('is_active' in kpiRecord) {
      recordData.is_active = (kpiRecord as any).is_active;
    }

    // Sanitize string fields
    if (recordData.period) {
      recordData.period = sanitizeString(recordData.period)
    }
    if (recordData.submission_details !== undefined) {
      recordData.submission_details = sanitizeString(recordData.submission_details)
    }

    console.log('Creating KPI record with data:', JSON.stringify(recordData, null, 2));

    const { data, error } = await supabase
      .from('kpi_records')
      .insert(recordData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating KPI record:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Record data:', JSON.stringify(recordData, null, 2));
      
      // Tạo error message rõ ràng hơn
      const errorMessage = (error as any)?.message || (error as any)?.details || (error as any)?.hint || 'Không thể tạo bản ghi KPI';
      const enrichedError = new Error(
        `Tạo bản ghi KPI thất bại: ${errorMessage}${(error as any)?.code ? ` (code: ${(error as any).code})` : ''}`
      ) as Error & { code?: string; details?: string; hint?: string };
      
      enrichedError.code = (error as any)?.code;
      enrichedError.details = (error as any)?.details;
      enrichedError.hint = (error as any)?.hint;
      
      throw enrichedError;
    }
    return data
  },

  async update(id: number, updates: KpiRecordUpdate): Promise<KpiRecord> {
    // Get existing record to merge updates
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error(`KPI record với ID ${id} không tồn tại`)
    }

    // Only validate if updating critical fields, skip validation for simple updates like actual/progress
    const needsFullValidation = updates.kpi_id !== undefined || updates.employee_id !== undefined || 
                                 updates.department_id !== undefined || updates.period !== undefined;
    
    if (needsFullValidation) {
      // Merge updates and validate
      const updatedData = { ...existing, ...updates }
      const validation = validateKpiRecord(updatedData as KpiRecordValidationData)
      if (!validation.valid) {
        throw new Error(validation.error || 'Dữ liệu KPI record không hợp lệ')
      }
    }

    // Validate foreign keys if updated
    if (updates.kpi_id !== undefined) {
      const kpi = await kpiService.getById(updates.kpi_id)
      if (!kpi) {
        throw new Error(`KPI với ID ${updates.kpi_id} không tồn tại`)
      }
    }

    if (updates.employee_id !== undefined && updates.employee_id !== null) {
      const employee = await employeeService.getById(updates.employee_id)
      if (!employee) {
        throw new Error(`Employee với ID ${updates.employee_id} không tồn tại`)
      }
    }

    if (updates.department_id !== undefined && updates.department_id !== null) {
      const department = await departmentService.getById(updates.department_id)
      if (!department) {
        throw new Error(`Department với ID ${updates.department_id} không tồn tại`)
      }
    }

    if (updates.approved_by !== undefined && updates.approved_by !== null) {
      const approver = await employeeService.getById(updates.approved_by)
      if (!approver) {
        throw new Error(`Employee với ID ${updates.approved_by} không tồn tại`)
      }
    }

    // Sanitize string fields
    const sanitizedUpdates = {
      ...updates,
      period: updates.period ? sanitizeString(updates.period) : undefined,
      submission_details: updates.submission_details !== undefined ? sanitizeString(updates.submission_details) : undefined
    }

    const { data, error } = await supabase
      .from('kpi_records')
      .update({ ...sanitizedUpdates, updated_at: new Date().toISOString(), last_updated: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      // Create a better error message
      const errorMessage = error.message || error.details || error.hint || 'Unknown error';
      const enrichedError = new Error(
        `Supabase kpi_records.update failed: ${errorMessage}${error.code ? ` (code: ${error.code})` : ''}`
      ) as Error & { code?: string; details?: string; hint?: string };
      enrichedError.code = error.code;
      enrichedError.details = error.details;
      enrichedError.hint = error.hint;
      throw enrichedError;
    }
    return data
  },

  async delete(id: number): Promise<void> {
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

  async getByUserId(userId: number | string): Promise<Notification[]> {
    // Convert string to number if needed
    const numericUserId = typeof userId === 'string' ? Number(userId) : userId;
    
    if (isNaN(numericUserId) || !isFinite(numericUserId)) {
      throw new Error(`Invalid user_id: ${userId}. Must be a number.`);
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', numericUserId)
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

  async markAsRead(id: number): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAllAsRead(userId: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)
    
    if (error) throw error
  },

  async getById(id: number): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async update(id: number, updates: NotificationUpdate): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Daily KPI Progress operations
export const dailyKpiProgressService = {
  async getAll(): Promise<DailyKpiProgress[]> {
    const { data, error } = await supabase
      .from('daily_kpi_progress')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: false })
    
    if (error) {
      const enriched = new Error(
        `Supabase daily_kpi_progress.getAll failed: ${(error as any)?.message || 'Unknown error'}${(error as any)?.code ? ` (code ${(error as any).code})` : ''}`
      ) as Error & { code?: string; details?: string; hint?: string }
      enriched.code = (error as any)?.code
      enriched.details = (error as any)?.details
      enriched.hint = (error as any)?.hint
      throw enriched
    }
    return data || []
  },

  async getByDateRange(startDate: string, endDate: string): Promise<DailyKpiProgress[]> {
    const { data, error } = await supabase
      .from('daily_kpi_progress')
      .select('*')
      .eq('is_active', true)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByDepartment(departmentId: number): Promise<DailyKpiProgress[]> {
    const { data, error } = await supabase
      .from('daily_kpi_progress')
      .select('*')
      .eq('department_id', departmentId)
      .eq('is_active', true)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByEmployee(employeeId: number): Promise<DailyKpiProgress[]> {
    const { data, error } = await supabase
      .from('daily_kpi_progress')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<DailyKpiProgress | null> {
    const { data, error } = await supabase
      .from('daily_kpi_progress')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(dailyProgress: DailyKpiProgressInsert): Promise<DailyKpiProgress> {
    const { data, error } = await supabase
      .from('daily_kpi_progress')
      .insert(dailyProgress)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating daily KPI progress:', error);
      throw error;
    }
    return data
  },

  async update(id: number, updates: DailyKpiProgressUpdate): Promise<DailyKpiProgress> {
    const { data, error } = await supabase
      .from('daily_kpi_progress')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('daily_kpi_progress')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  },

  async getSummary(): Promise<any[]> {
    const { data, error } = await supabase
      .from('daily_kpi_summary')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getDetails(): Promise<any[]> {
    const { data, error } = await supabase
      .from('daily_kpi_details')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// KPI Submission operations
export const kpiSubmissionService = {
  async getAll(): Promise<any[]> {
    try {
      // First, try to get submissions with basic info
      const { data, error } = await supabase
        .from('kpi_submissions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table kpi_submissions does not exist yet. Please run the migration.');
          return [];
        }
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }

      // Then get items for each submission
      const submissionsWithItems = await Promise.all(
        data.map(async (submission) => {
          try {
            // Get items
            const { data: items, error: itemsError } = await supabase
              .from('kpi_submission_items')
              .select('*')
              .eq('submission_id', submission.id)
              .eq('is_active', true);

            if (itemsError) {
              console.warn(`Error loading items for submission ${submission.id}:`, itemsError);
              return { ...submission, items: [] };
            }

            // Get employee info
            let employee = null;
            if (submission.employee_id) {
              try {
                const emp = await employeeService.getById(submission.employee_id);
                employee = emp ? { id: emp.id, name: emp.name, email: emp.email } : null;
              } catch (e) {
                console.warn(`Error loading employee ${submission.employee_id}:`, e);
              }
            }

            // Get approved_by info
            let approvedByEmployee = null;
            if (submission.approved_by) {
              try {
                const emp = await employeeService.getById(submission.approved_by);
                approvedByEmployee = emp ? { id: emp.id, name: emp.name, email: emp.email } : null;
              } catch (e) {
                console.warn(`Error loading approved_by employee ${submission.approved_by}:`, e);
              }
            }

            // Get KPI record details for each item
            const itemsWithDetails = await Promise.all(
              (items || []).map(async (item) => {
                try {
                  const record = await kpiRecordService.getById(item.kpi_record_id);
                  if (record) {
                    const kpi = await kpiService.getById(record.kpi_id);
                    const emp = record.employee_id ? await employeeService.getById(record.employee_id) : null;
                    return {
                      ...item,
                      kpi_records: {
                        ...record,
                        kpis: kpi ? { id: kpi.id, name: kpi.name, unit: kpi.unit } : null,
                        employees: emp ? { id: emp.id, name: emp.name } : null,
                      },
                    };
                  }
                  return item;
                } catch (e) {
                  console.warn(`Error loading KPI record ${item.kpi_record_id}:`, e);
                  return item;
                }
              })
            );

            return {
              ...submission,
              employees: employee,
              approved_by_employee: approvedByEmployee,
              items: itemsWithDetails,
            };
          } catch (e) {
            console.warn(`Error processing submission ${submission.id}:`, e);
            return { ...submission, items: [] };
          }
        })
      );

      return submissionsWithItems;
    } catch (error) {
      // Extract error details for better logging
      const errorDetails = error instanceof Error 
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
            ...(error as any)
          }
        : error;
      
      console.error('Error in kpiSubmissionService.getAll:', {
        error: errorDetails,
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      
      // Return empty array instead of throwing if table doesn't exist
      if (error && typeof error === 'object') {
        const errorCode = (error as any)?.code;
        const errorMessage = (error as any)?.message || (error instanceof Error ? error.message : String(error));
        
        if (errorCode === '42P01' || errorMessage?.includes('does not exist')) {
          console.warn('Table kpi_submissions does not exist yet. Please run the migration.');
          return [];
        }
      }
      
      // Re-throw with better error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'message' in error)
          ? String((error as any).message)
          : 'Unknown error occurred';
      
      throw new Error(`Failed to load KPI submissions: ${errorMessage}`);
    }
  },

  async getById(id: number): Promise<any | null> {
    const { data, error } = await supabase
      .from('kpi_submissions')
      .select(`
        *,
        employees:employee_id(id, name, email),
        approved_by_employee:approved_by(id, name, email),
        items:kpi_submission_items(
          *,
          kpi_records:kpi_record_id(
            *,
            kpis:kpi_id(id, name, unit),
            employees:employee_id(id, name)
          )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async getByEmployeeId(employeeId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('kpi_submissions')
      .select(`
        *,
        items:kpi_submission_items(
          *,
          kpi_records:kpi_record_id(
            *,
            kpis:kpi_id(id, name, unit)
          )
        )
      `)
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(submission: KpiSubmissionInsert, items: Omit<KpiSubmissionItemInsert, 'submission_id'>[]): Promise<KpiSubmission> {
    // Create submission first
    const { data: submissionData, error: submissionError } = await supabase
      .from('kpi_submissions')
      .insert({
        ...submission,
        submission_date: submission.submission_date || new Date().toISOString(),
        submission_details: submission.submission_details || '',
        status: submission.status || 'pending_approval',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (submissionError) throw submissionError
    if (!submissionData) throw new Error('Failed to create submission')

    // Create submission items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        submission_id: submissionData.id,
        is_active: true,
        updated_at: new Date().toISOString()
      }))

      const { error: itemsError } = await supabase
        .from('kpi_submission_items')
        .insert(itemsToInsert)
      
      if (itemsError) {
        // Rollback: delete submission if items creation fails
        await supabase.from('kpi_submissions').delete().eq('id', submissionData.id)
        throw itemsError
      }

      // Update KPI records with actual values
      for (const item of items) {
        const kpiRecordId = item.kpi_record_id
        const actual = item.actual
        
        // Get KPI record to calculate progress
        const { data: kpiRecord } = await supabase
          .from('kpi_records')
          .select('target')
          .eq('id', kpiRecordId)
          .single()
        
        if (kpiRecord) {
          // Calculate progress, allow > 100% if actual exceeds target
          const calculatedProgress = (actual / kpiRecord.target) * 100;
          const progress = Math.max(0, Math.round(calculatedProgress * 100) / 100); // Round to 2 decimal places
          
          await supabase
            .from('kpi_records')
            .update({
              actual,
              progress,
              status: 'pending_approval',
              submission_date: submissionData.submission_date,
              updated_at: new Date().toISOString()
            })
            .eq('id', kpiRecordId)
        }
      }
    }

    return submissionData
  },

  async update(id: number, submission: KpiSubmissionUpdate): Promise<KpiSubmission> {
    const { data, error } = await supabase
      .from('kpi_submissions')
      .update({
        ...submission,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error(`Submission với ID ${id} không tồn tại`)
    return data
  },

  async approve(id: number, approvedBy: number): Promise<KpiSubmission> {
    // Get submission with items
    const submission = await this.getById(id)
    if (!submission) throw new Error(`Submission với ID ${id} không tồn tại`)

    // Update submission status
    const { data, error } = await supabase
      .from('kpi_submissions')
      .update({
        status: 'approved',
        approval_date: new Date().toISOString(),
        approved_by: approvedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error(`Submission với ID ${id} không tồn tại`)

    // Update KPI records status to approved
    if (submission.items && Array.isArray(submission.items)) {
      for (const item of submission.items) {
        if (item.kpi_records) {
          await supabase
            .from('kpi_records')
            .update({
              status: 'approved',
              approval_date: new Date().toISOString(),
              approved_by: approvedBy,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.kpi_records.id)
        }
      }
    }

    return data
  },

  async reject(id: number, rejectedBy: number, reason: string): Promise<KpiSubmission> {
    const { data, error } = await supabase
      .from('kpi_submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error(`Submission với ID ${id} không tồn tại`)

    // Update KPI records status to rejected
    const submission = await this.getById(id)
    if (submission && submission.items && Array.isArray(submission.items)) {
      for (const item of submission.items) {
        if (item.kpi_records) {
          await supabase
            .from('kpi_records')
            .update({
              status: 'rejected',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.kpi_records.id)
        }
      }
    }

    return data
  },

  async delete(id: number): Promise<void> {
    // Delete items first (due to foreign key constraint)
    await supabase
      .from('kpi_submission_items')
      .delete()
      .eq('submission_id', id)
    
    // Delete submission
    const { error } = await supabase
      .from('kpi_submissions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
