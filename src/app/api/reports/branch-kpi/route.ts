import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Enhanced Branch KPI Report API
 * 
 * Supports:
 * - Historical data viewing with full audit trail
 * - Period timeline and comparison
 * - Detailed bonus/penalty breakdown
 * - Metadata for KPI records (creation, updates, approvals)
 * 
 * Query params:
 * - branchId: Required - Branch ID
 * - period: Optional - Specific period (Q1-2025, M1-2025, etc.)
 * - getAvailablePeriods: Optional - Get list of all periods with data
 * - includeMetadata: Optional - Include timestamps and audit info
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const type = searchParams.get('type'); // 'department' or 'employee'
    const period = searchParams.get('period'); // 'Q1-2025', 'M1-2025', etc.
    const getAvailablePeriods = searchParams.get('getAvailablePeriods') === 'true';
    const includeMetadata = searchParams.get('includeMetadata') !== 'false'; // Default true

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    const branchIdNum = parseInt(branchId, 10);
    if (isNaN(branchIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch ID' },
        { status: 400 }
      );
    }

    // Get all departments in this branch
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, code')
      .eq('branch_id', branchIdNum)
      .eq('is_active', true);

    if (deptError) throw deptError;

    const departmentIds = (departments || []).map(d => d.id);

    if (departmentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          departmentReports: [],
          employeeReports: [],
          availablePeriods: [],
          branchId: branchIdNum,
          earliestDate: null,
        },
      });
    }

    // Get all employees in departments of this branch
    // Use employee_departments junction table to get employees with multiple departments
    const { data: employeeDeptRelations, error: empDeptError } = await supabase
      .from('employee_departments')
      .select('employee_id, department_id, is_primary')
      .in('department_id', departmentIds);

    if (empDeptError) throw empDeptError;

    // Get unique employee IDs from junction table
    const employeeIdsFromJunction = new Set(
      (employeeDeptRelations || []).map((ed: any) => ed.employee_id)
    );

    // Query employees separately
    let employeesFromJunction: any[] = [];
    if (employeeIdsFromJunction.size > 0) {
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, name, employee_code, is_active')
        .in('id', Array.from(employeeIdsFromJunction))
        .eq('is_active', true);
      
      if (empError) throw empError;
      
      // Get departments for junction table
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name, code')
        .in('id', departmentIds);
      
      if (deptError) throw deptError;
      
      const deptMap = new Map((deptData || []).map((d: any) => [d.id, d]));
      
      // Combine employee-department relationships
      const empMap = new Map((empData || []).map((e: any) => [e.id, e]));
      
      employeesFromJunction = (employeeDeptRelations || [])
        .filter((ed: any) => empMap.has(ed.employee_id))
        .map((ed: any) => {
          const emp = empMap.get(ed.employee_id);
          const dept = deptMap.get(ed.department_id);
          return {
            employee_id: ed.employee_id,
            is_primary: ed.is_primary,
            employee: emp,
            department: dept
          };
        });
    }

    // Also get employees with old format (department_id directly) that are not in junction table
    // We'll fetch all and filter client-side to avoid Supabase .not() syntax issues
    let employeesOldFormatQuery = supabase
      .from('employees')
      .select(`
        id,
        name,
        employee_code,
        department_id,
        departments:department_id(
          name,
          code
        )
      `)
      .in('department_id', departmentIds)
      .eq('is_active', true);

    const { data: allEmployeesOldFormat, error: empError } = await employeesOldFormatQuery;

    if (empError) throw empError;
    
    // Filter out employees that are already in the junction table (client-side)
    const employeesOldFormat = (allEmployeesOldFormat || []).filter((emp: any) => 
      !employeeIdsFromJunction.has(emp.id)
    );

    // Combine and deduplicate employees
    const employeeMap = new Map();
    
    // Add employees from junction table (use primary department for display)
    employeesFromJunction.forEach((ed: any) => {
      if (ed.employee && !employeeMap.has(ed.employee_id)) {
        // Find primary department for this employee
        const primaryEd = employeesFromJunction
          .find((e: any) => e.employee_id === ed.employee_id && e.is_primary) ||
          employeesFromJunction.find((e: any) => e.employee_id === ed.employee_id);
        
        employeeMap.set(ed.employee_id, {
          id: ed.employee.id,
          name: ed.employee.name,
          employee_code: ed.employee.employee_code,
          department_id: primaryEd?.department?.id,
          departments: primaryEd?.department
        });
      }
    });

    // Add employees from old format
    (employeesOldFormat || []).forEach((emp: any) => {
      if (!employeeMap.has(emp.id)) {
        employeeMap.set(emp.id, emp);
      }
    });

    const employees = Array.from(employeeMap.values());

    if (empError) throw empError;

    const employeeIds = (employees || []).map(e => e.id);

    // Get earliest date and all available periods
    let earliestDate: string | null = null;
    let availablePeriods: string[] = [];

    if (departmentIds.length > 0 || employeeIds.length > 0) {
      let periodsQuery = supabase
        .from('kpi_records')
        .select('period, start_date, created_at')
        .eq('is_active', true);
      
      // Filter by department or employee
      if (departmentIds.length > 0 && employeeIds.length > 0) {
        periodsQuery = periodsQuery.or(`department_id.in.(${departmentIds.join(',')}),employee_id.in.(${employeeIds.join(',')})`);
      } else if (departmentIds.length > 0) {
        periodsQuery = periodsQuery.in('department_id', departmentIds);
      } else if (employeeIds.length > 0) {
        periodsQuery = periodsQuery.in('employee_id', employeeIds);
      }
      
      const { data: periodRecords, error: periodError } = await periodsQuery
        .order('start_date', { ascending: true });

      if (!periodError && periodRecords && periodRecords.length > 0) {
        // Get earliest date
        earliestDate = periodRecords[0].start_date || periodRecords[0].created_at;
        
        // Get unique periods
        const uniquePeriods = new Set<string>();
        periodRecords.forEach((record: any) => {
          if (record.period) {
            uniquePeriods.add(record.period);
          }
        });
        availablePeriods = Array.from(uniquePeriods).sort((a, b) => {
          // Sort periods: newer first
          const matchA = a.match(/(Q|M)(\d+)-(\d+)/);
          const matchB = b.match(/(Q|M)(\d+)-(\d+)/);
          if (!matchA || !matchB) return 0;
          
          const yearA = parseInt(matchA[3], 10);
          const yearB = parseInt(matchB[3], 10);
          if (yearA !== yearB) return yearB - yearA; // Newer year first
          
          const numA = parseInt(matchA[2], 10);
          const numB = parseInt(matchB[2], 10);
          return numB - numA; // Newer period first
        });
      }
    }

    // If only requesting available periods, return early
    if (getAvailablePeriods) {
      return NextResponse.json({
        success: true,
        data: {
          availablePeriods,
          earliestDate,
          branchId: branchIdNum,
        },
      });
    }

    // Get KPI records for departments with full metadata
    // IMPORTANT: Department KPI records must have department_id NOT NULL and employee_id IS NULL
    let departmentKpiRecords: any[] = [];
    if (!type || type === 'department') {
      let deptQuery = supabase
        .from('kpi_records')
        .select(`
          *,
          kpis:kpi_id(
            id,
            name,
            description,
            unit,
            target,
            reward_penalty_config
          ),
          departments:department_id(
            id,
            name,
            code
          ),
          approved_by_user:approved_by(
            id,
            name,
            employee_code
          )
        `)
        .in('department_id', departmentIds)
        .is('employee_id', null) // CRITICAL: Only get records assigned to departments, not employees
        .eq('is_active', true);

      // Filter by period if provided
      if (period) {
        deptQuery = deptQuery.eq('period', period);
      }

      const { data: deptRecords, error: deptRecordsError } = await deptQuery
        .order('created_at', { ascending: false });

      if (deptRecordsError) {
        console.error('Error fetching department KPI records:', deptRecordsError);
        throw deptRecordsError;
      }
      
      // Additional client-side filter to ensure data integrity
      departmentKpiRecords = (deptRecords || []).filter((record: any) => 
        record.department_id && 
        (record.employee_id === null || record.employee_id === undefined)
      );
    }

    // Get KPI records for employees with full metadata
    // IMPORTANT: Employee KPI records must have employee_id NOT NULL and department_id IS NULL
    let employeeKpiRecords: any[] = [];
    if (!type || type === 'employee') {
      let empQuery = supabase
        .from('kpi_records')
        .select(`
          *,
          kpis:kpi_id(
            id,
            name,
            description,
            unit,
            target,
            reward_penalty_config
          ),
          employees:employee_id(
            id,
            name,
            employee_code,
            department_id,
            departments:department_id(
              name,
              code
            )
          ),
          approved_by_user:approved_by(
            id,
            name,
            employee_code
          )
        `)
        .in('employee_id', employeeIds)
        .is('department_id', null) // CRITICAL: Only get records assigned to employees, not departments
        .eq('is_active', true);

      // Filter by period if provided
      if (period) {
        empQuery = empQuery.eq('period', period);
      }

      const { data: empRecords, error: empRecordsError } = await empQuery
        .order('created_at', { ascending: false });

      if (empRecordsError) {
        console.error('Error fetching employee KPI records:', empRecordsError);
        throw empRecordsError;
      }
      
      // Additional client-side filter to ensure data integrity
      employeeKpiRecords = (empRecords || []).filter((record: any) => 
        record.employee_id && 
        (record.department_id === null || record.department_id === undefined)
      );
    }

    // Get all bonus/penalty records for employees in this branch (with creator info)
    let bpQuery = supabase
      .from('bonus_penalty_records')
      .select(`
        *,
        kpis:kpi_id(
          id,
          name
        ),
        created_by_user:created_by(
          id,
          name,
          employee_code
        )
      `)
      .in('employee_id', employeeIds)
      .eq('is_active', true);

    // Filter by period if provided
    if (period) {
      bpQuery = bpQuery.eq('period', period);
    }

    const { data: bonusPenaltyRecords, error: bpError } = await bpQuery
      .order('created_at', { ascending: false });

    if (bpError) {
      console.warn('Error fetching bonus/penalty records:', bpError);
    }

    // Helper function to enrich KPI record with bonus/penalty and metadata
    const enrichKpiRecord = (record: any, empId?: number) => {
      if (!record) return null;

      const kpiId = record.kpi_id;
      const recordEmpId = empId || record.employee_id;
      
      // Find all bonus/penalty records for this KPI record
      const kpiBonusPenalties = (bonusPenaltyRecords || []).filter((bp: any) => {
        if (bp.employee_id !== recordEmpId) return false;
        if (kpiId && bp.kpi_id === kpiId) return true;
        return false;
      });

      // Calculate totals from bonus_penalty_records
      const bonusFromRecords = kpiBonusPenalties
        .filter((bp: any) => bp.type === 'bonus')
        .reduce((sum: number, bp: any) => sum + (parseFloat(bp.amount) || 0), 0);
      
      const penaltyFromRecords = kpiBonusPenalties
        .filter((bp: any) => bp.type === 'penalty')
        .reduce((sum: number, bp: any) => sum + (parseFloat(bp.amount) || 0), 0);

      // Use bonus_amount/penalty_amount from kpi_records if available, otherwise sum from bonus_penalty_records
      const bonusAmount = parseFloat(record.bonus_amount) || bonusFromRecords || 0;
      const penaltyAmount = parseFloat(record.penalty_amount) || penaltyFromRecords || 0;

      // Build metadata object
      const metadata = includeMetadata ? {
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        lastUpdated: record.last_updated,
        submissionDate: record.submission_date,
        approvalDate: record.approval_date,
        approvedBy: record.approved_by_user ? {
          id: record.approved_by_user.id,
          name: record.approved_by_user.name,
          code: record.approved_by_user.employee_code,
        } : null,
      } : {};

      return {
        ...record,
        bonusAmount,
        penaltyAmount,
        bonusPenaltyRecords: kpiBonusPenalties.map((bp: any) => ({
          id: bp.id,
          type: bp.type,
          amount: parseFloat(bp.amount) || 0,
          reason: bp.reason,
          period: bp.period,
          createdAt: bp.created_at,
          createdBy: bp.created_by_user ? {
            id: bp.created_by_user.id,
            name: bp.created_by_user.name,
            code: bp.created_by_user.employee_code,
          } : null,
          kpi: bp.kpis ? {
            id: bp.kpis.id,
            name: bp.kpis.name,
          } : null,
        })),
        metadata,
      };
    };

    // Initialize department reports for ALL departments in the branch
    // This ensures departments with only employee KPIs will still appear in the report
    const departmentReports: any = {};
    departments.forEach((dept: any) => {
      departmentReports[dept.id] = {
        departmentId: dept.id,
        departmentName: dept.name || 'N/A',
        departmentCode: dept.code || '',
        kpiRecords: [],
        totalKpis: 0,
        completedKpis: 0,
        averageProgress: 0,
        totalBonus: 0,
        totalPenalty: 0,
      };
    });

    // Add direct department KPI records (department_id NOT NULL, employee_id IS NULL)
    departmentKpiRecords.forEach((record: any) => {
      const deptId = record.department_id;
      if (!deptId || !departmentReports[deptId]) return;

      const enriched = enrichKpiRecord(record);
      if (enriched) {
        departmentReports[deptId].kpiRecords.push(enriched);
        departmentReports[deptId].totalKpis += 1;
        if (record.status === 'completed' || record.status === 'approved') {
          departmentReports[deptId].completedKpis += 1;
        }
      }
    });

    // Calculate average progress and totals for each department
    Object.values(departmentReports).forEach((dept: any) => {
      if (dept.kpiRecords.length > 0) {
        const totalProgress = dept.kpiRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.progress) || 0), 0);
        dept.averageProgress = Math.round((totalProgress / dept.kpiRecords.length) * 100) / 100;
        
        // Sum bonus/penalty from all KPI records
        dept.totalBonus = dept.kpiRecords.reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);
        dept.totalPenalty = dept.kpiRecords.reduce((sum: number, r: any) => sum + (r.penaltyAmount || 0), 0);
      }
    });

    // Group employee KPI records by employee
    const employeeReports = employeeKpiRecords.reduce((acc: any, record: any) => {
      const empId = record.employee_id;
      if (!empId) return acc;

      if (!acc[empId]) {
        acc[empId] = {
          employeeId: empId,
          employeeName: record.employees?.name || 'N/A',
          employeeCode: record.employees?.employee_code || '',
          departmentId: record.employees?.department_id || null,
          departmentName: record.employees?.departments?.name || 'N/A',
          kpiRecords: [],
          totalKpis: 0,
          completedKpis: 0,
          averageProgress: 0,
          totalBonus: 0,
          totalPenalty: 0,
        };
      }

      const enriched = enrichKpiRecord(record, empId);
      if (enriched) {
        acc[empId].kpiRecords.push(enriched);
        acc[empId].totalKpis += 1;
        if (record.status === 'completed' || record.status === 'approved') {
          acc[empId].completedKpis += 1;
        }
      }

      return acc;
    }, {});

    // Calculate average progress and totals for each employee
    Object.values(employeeReports).forEach((emp: any) => {
      if (emp.kpiRecords.length > 0) {
        const totalProgress = emp.kpiRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.progress) || 0), 0);
        emp.averageProgress = Math.round((totalProgress / emp.kpiRecords.length) * 100) / 100;
        
        // Sum bonus/penalty from all KPI records
        emp.totalBonus = emp.kpiRecords.reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);
        emp.totalPenalty = emp.kpiRecords.reduce((sum: number, r: any) => sum + (r.penaltyAmount || 0), 0);
      }
    });

    // Add general bonus/penalty (not tied to specific KPI) to employee totals
    (bonusPenaltyRecords || []).forEach((bpRecord: any) => {
      if (!bpRecord.kpi_id && bpRecord.employee_id) {
        const empReport = Object.values(employeeReports).find((e: any) => e.employeeId === bpRecord.employee_id);
        if (empReport) {
          if (bpRecord.type === 'bonus') {
            empReport.totalBonus += parseFloat(bpRecord.amount) || 0;
          } else if (bpRecord.type === 'penalty') {
            empReport.totalPenalty += parseFloat(bpRecord.amount) || 0;
          }
        }
      }
    });

    // Add employee KPI records to their departments
    // This allows department reports to show both direct department KPIs and aggregated employee KPIs
    Object.values(employeeReports).forEach((empReport: any) => {
      const empDeptId = empReport.departmentId;
      if (!empDeptId) {
        console.warn(`Employee ${empReport.employeeId} (${empReport.employeeName}) has no department_id, skipping`);
        return;
      }
      
      // Find the department report for this employee's department
      // Use departmentReports object directly for O(1) lookup instead of Array.find
      const deptReport = departmentReports[empDeptId];
      if (!deptReport) {
        console.warn(`Department ${empDeptId} not found in departmentReports for employee ${empReport.employeeId}`);
        return;
      }
      
      // Add each employee KPI record to the department, marked as employee KPI
      empReport.kpiRecords.forEach((empKpiRecord: any) => {
        const enrichedEmpRecord = {
          ...empKpiRecord,
          isEmployeeKpi: true,
          employeeInfo: {
            id: empReport.employeeId,
            name: empReport.employeeName,
            code: empReport.employeeCode,
          },
        };
        deptReport.kpiRecords.push(enrichedEmpRecord);
        deptReport.totalKpis += 1;
        if (empKpiRecord.status === 'completed' || empKpiRecord.status === 'approved') {
          deptReport.completedKpis += 1;
        }
      });
    });

    // Recalculate department totals after adding employee KPIs
    Object.values(departmentReports).forEach((dept: any) => {
      if (dept.kpiRecords.length > 0) {
        const totalProgress = dept.kpiRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.progress) || 0), 0);
        dept.averageProgress = Math.round((totalProgress / dept.kpiRecords.length) * 100) / 100;
        
        // Sum bonus/penalty from all KPI records (both department and employee KPIs)
        dept.totalBonus = dept.kpiRecords.reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);
        dept.totalPenalty = dept.kpiRecords.reduce((sum: number, r: any) => sum + (r.penaltyAmount || 0), 0);
      }
    });

    // Filter out departments with no KPI records (neither direct nor from employees)
    const filteredDepartmentReports = Object.values(departmentReports).filter((dept: any) => 
      dept.kpiRecords.length > 0
    );

    return NextResponse.json({
      success: true,
      data: {
        departmentReports: filteredDepartmentReports,
        employeeReports: Object.values(employeeReports),
        availablePeriods,
        branchId: branchIdNum,
        earliestDate: earliestDate,
        period: period || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching branch KPI reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch branch KPI reports' },
      { status: 500 }
    );
  }
}
