import { NextRequest, NextResponse } from 'next/server';
import { kpiRecordService } from '@/services/supabase-service';

// PUT /api/kpi-records/[id]/update-actual - Update actual value of KPI record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid KPI record ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { actual } = body;

    if (actual === undefined || actual === null) {
      return NextResponse.json(
        { success: false, error: 'Actual value is required' },
        { status: 400 }
      );
    }

    // Get existing record to calculate progress
    const record = await kpiRecordService.getById(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'KPI record not found' },
        { status: 404 }
      );
    }

    // Calculate progress, allow > 100% if actual exceeds target
    const calculatedProgress = (actual / record.target) * 100;
    const progress = Math.max(0, Math.round(calculatedProgress * 100) / 100);
    const newStatus = record.status === 'not_started' ? 'in_progress' : record.status;

    const updatedRecord = await kpiRecordService.update(id, {
      actual,
      progress,
      status: newStatus,
    });

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error: any) {
    console.error('Error updating KPI record actual:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update KPI record actual' },
      { status: 400 }
    );
  }
}








