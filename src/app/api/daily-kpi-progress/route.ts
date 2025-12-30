import { NextRequest, NextResponse } from 'next/server';
import { dailyKpiProgressService } from '@/services/supabase-service';

// GET /api/daily-kpi-progress - Get all daily KPI progress
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const departmentId = searchParams.get('departmentId');
    const employeeId = searchParams.get('employeeId');

    let progress;
    if (startDate && endDate) {
      progress = await dailyKpiProgressService.getByDateRange(startDate, endDate);
    } else if (departmentId) {
      const id = parseInt(departmentId, 10);
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid department ID' },
          { status: 400 }
        );
      }
      progress = await dailyKpiProgressService.getByDepartment(id);
    } else if (employeeId) {
      const id = parseInt(employeeId, 10);
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid employee ID' },
          { status: 400 }
        );
      }
      progress = await dailyKpiProgressService.getByEmployee(id);
    } else {
      progress = await dailyKpiProgressService.getAll();
    }

    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('Error fetching daily KPI progress:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch daily KPI progress' },
      { status: 500 }
    );
  }
}

// POST /api/daily-kpi-progress - Create a new daily KPI progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const progress = await dailyKpiProgressService.create(body);
    return NextResponse.json({ success: true, data: progress }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating daily KPI progress:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create daily KPI progress' },
      { status: 400 }
    );
  }
}













