import { NextRequest, NextResponse } from 'next/server';
import { kpiSubmissionService } from '@/services/supabase-service';

// PUT /api/kpi-submissions/[id]/reject - Reject KPI submission
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid KPI submission ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rejectedBy, reason } = body;

    if (!rejectedBy) {
      return NextResponse.json(
        { success: false, error: 'Rejected by user ID is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const rejectorId = typeof rejectedBy === 'string' ? parseInt(rejectedBy, 10) : rejectedBy;
    if (isNaN(rejectorId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid rejector ID' },
        { status: 400 }
      );
    }

    const submission = await kpiSubmissionService.reject(id, rejectorId, reason);
    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Error rejecting KPI submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject KPI submission' },
      { status: 400 }
    );
  }
}





