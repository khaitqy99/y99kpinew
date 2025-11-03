/**
 * Transaction helper for batch operations
 * Note: Supabase doesn't support transactions directly in the client,
 * but we can use RPC functions for transaction support
 */

import { supabase } from '@/lib/supabase'

/**
 * Execute multiple operations in a batch
 * If any operation fails, all operations are considered failed
 * Note: This is a client-side implementation. For true transactions,
 * use Supabase RPC functions with server-side transactions.
 */
export async function batchOperation<T>(
  operations: Array<() => Promise<T>>,
  onError?: (error: Error, index: number) => void
): Promise<T[]> {
  const results: T[] = []
  const errors: Array<{ index: number; error: Error }> = []

  // Execute all operations
  for (let i = 0; i < operations.length; i++) {
    try {
      const result = await operations[i]()
      results.push(result)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push({ index: i, error: err })
      
      if (onError) {
        onError(err, i)
      }
    }
  }

  // If any operation failed, throw an error with details
  if (errors.length > 0) {
    const errorMessages = errors.map(e => `Operation ${e.index}: ${e.error.message}`).join('; ')
    throw new Error(`Batch operation failed: ${errorMessages}`)
  }

  return results
}

/**
 * Assign KPI to multiple employees in a department
 * This function handles transaction-like behavior by checking all validations first,
 * then attempting all inserts, and reporting partial failures
 */
export interface BatchAssignResult {
  success: number
  failed: number
  errors: Array<{ employeeId: number; error: string }>
}

export async function batchAssignKpi(
  records: Array<{ kpi_id: number; employee_id: number; department_id: number | null; period: string; target: number; start_date: string; end_date: string; status: string }>
): Promise<BatchAssignResult> {
  const result: BatchAssignResult = {
    success: 0,
    failed: 0,
    errors: []
  }

  // Validate all records first
  for (const record of records) {
    try {
      // Basic validation
      if (!record.kpi_id || !record.employee_id || !record.period || !record.target) {
        result.failed++
        result.errors.push({
          employeeId: record.employee_id,
          error: 'Thiếu thông tin bắt buộc'
        })
        continue
      }

      // Check for duplicates
      const { data: existing } = await supabase
        .from('kpi_records')
        .select('id')
        .eq('kpi_id', record.kpi_id)
        .eq('employee_id', record.employee_id)
        .eq('period', record.period)
        .eq('is_active', true)
        .maybeSingle()

      if (existing) {
        result.failed++
        result.errors.push({
          employeeId: record.employee_id,
          error: `KPI đã được giao cho nhân viên này trong kỳ ${record.period}`
        })
        continue
      }

      // All validations passed, this record is ready
    } catch (error) {
      result.failed++
      result.errors.push({
        employeeId: record.employee_id,
        error: error instanceof Error ? error.message : 'Lỗi validation'
      })
    }
  }

  // If all validations failed, return early
  if (result.failed === records.length) {
    return result
  }

  // Now attempt to insert all valid records
  const validRecords = records.filter((_, index) => {
    const error = result.errors.find(e => records[index].employee_id === e.employeeId)
    return !error
  })

  if (validRecords.length === 0) {
    return result
  }

  // Insert all valid records
  const { data, error } = await supabase
    .from('kpi_records')
    .insert(validRecords)
    .select()

  if (error) {
    // If batch insert fails, mark all as failed
    result.failed += validRecords.length
    validRecords.forEach(record => {
      result.errors.push({
        employeeId: record.employee_id,
        error: error.message
      })
    })
  } else {
    // Success count is the number of records inserted
    result.success = data?.length || 0
  }

  return result
}

/**
 * Create a wrapper that simulates transaction behavior
 * Validates all operations before executing any
 */
export async function transactionLike<T>(
  validations: Array<() => Promise<void>>,
  operations: Array<() => Promise<T>>
): Promise<T[]> {
  // First, run all validations
  for (const validation of validations) {
    await validation()
  }

  // If all validations pass, execute all operations
  const results: T[] = []
  const errors: Array<{ index: number; error: Error }> = []

  for (let i = 0; i < operations.length; i++) {
    try {
      const result = await operations[i]()
      results.push(result)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push({ index: i, error: err })
      throw err // Fail fast
    }
  }

  return results
}

