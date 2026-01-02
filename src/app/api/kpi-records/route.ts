import { NextRequest, NextResponse } from 'next/server';
import { kpiRecordService } from '@/services/supabase-service';

// GET /api/kpi-records - Get all KPI records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');

    let records;
    if (employeeId) {
      const id = parseInt(employeeId, 10);
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid employee ID' },
          { status: 400 }
        );
      }
      records = await kpiRecordService.getByEmployeeId(id);
    } else {
      records = await kpiRecordService.getAll();
    }

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching KPI records:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch KPI records' },
      { status: 500 }
    );
  }
}

// POST /api/kpi-records - Create a new KPI record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await kpiRecordService.create(body);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating KPI record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create KPI record' },
      { status: 400 }
    );
  }
}















