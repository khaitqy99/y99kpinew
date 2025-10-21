import { supabase } from '@/lib/supabase'
import { employees as initialEmployees } from '@/data/employees'
import { departments as initialDepartments } from '@/data/departments'
import { kpis as initialKpis } from '@/data/kpis'
import { kpiRecords as initialKpiRecords } from '@/data/kpiRecords'
import { notifications as initialNotifications } from '@/data/notifications'

// Helper function to convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// Helper function to convert object keys to snake_case
function convertKeysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase)
  } else if (obj !== null && typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[toSnakeCase(key)] = convertKeysToSnakeCase(value)
    }
    return converted
  }
  return obj
}

export async function migrateToSupabase() {
  try {
    console.log('Starting migration to Supabase...')

    // 1. Migrate Departments
    console.log('Migrating departments...')
    const departmentsData = convertKeysToSnakeCase(initialDepartments)
    const { error: deptError } = await supabase
      .from('departments')
      .upsert(departmentsData, { onConflict: 'code' })
    
    if (deptError) {
      console.error('Error migrating departments:', deptError)
      return
    }

    // 2. Migrate Employees
    console.log('Migrating employees...')
    const employeesData = convertKeysToSnakeCase(initialEmployees)
    const { error: empError } = await supabase
      .from('employees')
      .upsert(employeesData, { onConflict: 'email' })
    
    if (empError) {
      console.error('Error migrating employees:', empError)
      return
    }

    // 3. Migrate KPIs
    console.log('Migrating KPIs...')
    const kpisData = convertKeysToSnakeCase(initialKpis)
    const { error: kpiError } = await supabase
      .from('kpis')
      .upsert(kpisData, { onConflict: 'id' })
    
    if (kpiError) {
      console.error('Error migrating KPIs:', kpiError)
      return
    }

    // 4. Migrate KPI Records
    console.log('Migrating KPI records...')
    const kpiRecordsData = convertKeysToSnakeCase(initialKpiRecords)
    const { error: kpiRecordError } = await supabase
      .from('kpi_records')
      .upsert(kpiRecordsData, { onConflict: 'id' })
    
    if (kpiRecordError) {
      console.error('Error migrating KPI records:', kpiRecordError)
      return
    }

    // 5. Migrate Notifications
    console.log('Migrating notifications...')
    const notificationsData = convertKeysToSnakeCase(initialNotifications)
    const { error: notifError } = await supabase
      .from('notifications')
      .upsert(notificationsData, { onConflict: 'id' })
    
    if (notifError) {
      console.error('Error migrating notifications:', notifError)
      return
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Function to clear all data (for testing)
export async function clearSupabaseData() {
  try {
    console.log('Clearing Supabase data...')
    
    const tables = ['notifications', 'kpi_records', 'kpis', 'employees', 'departments']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      
      if (error) {
        console.error(`Error clearing ${table}:`, error)
      }
    }
    
    console.log('Data cleared successfully!')
  } catch (error) {
    console.error('Error clearing data:', error)
  }
}
