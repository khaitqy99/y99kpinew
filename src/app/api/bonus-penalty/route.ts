import { NextRequest, NextResponse } from 'next/server';
import { bonusPenaltyService } from '@/services/bonus-penalty-service';

// GET /api/bonus-penalty - Get all bonus/penalty records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');
    const employeeId = searchParams.get('employeeId');

    let records;
    if (employeeId) {
      records = await bonusPenaltyService.getRecordsByEmployee(employeeId, period || undefined);
    } else {
      records = await bonusPenaltyService.getRecords(period || undefined);
    }

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching bonus/penalty records:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bonus/penalty records' },
      { status: 500 }
    );
  }
}

// POST /api/bonus-penalty - Create a new bonus/penalty record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await bonusPenaltyService.createRecord(body);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bonus/penalty record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bonus/penalty record' },
      { status: 400 }
    );
  }
}













