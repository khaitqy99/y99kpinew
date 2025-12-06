import { NextRequest, NextResponse } from 'next/server';
import { kpiRecordService } from '@/services/supabase-service';

// PUT /api/kpi-records/[id]/submit - Submit KPI record for approval
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid KPI record ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { actual, submissionDetails, attachment } = body;

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

    const updatedRecord = await kpiRecordService.update(id, {
      actual,
      progress,
      submission_details: submissionDetails || '',
      attachment: attachment || null,
      submission_date: new Date().toISOString(),
      status: 'pending_approval',
    });

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error: any) {
    console.error('Error submitting KPI record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit KPI record' },
      { status: 400 }
    );
  }
}




