import { NextRequest, NextResponse } from 'next/server';
import { kpiSubmissionService } from '@/services/supabase-service';

// PUT /api/kpi-submissions/[id]/approve - Approve KPI submission
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
    const { approvedBy } = body;

    if (!approvedBy) {
      return NextResponse.json(
        { success: false, error: 'Approved by user ID is required' },
        { status: 400 }
      );
    }

    const approverId = typeof approvedBy === 'string' ? parseInt(approvedBy, 10) : approvedBy;
    if (isNaN(approverId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid approver ID' },
        { status: 400 }
      );
    }

    const submission = await kpiSubmissionService.approve(id, approverId);
    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Error approving KPI submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve KPI submission' },
      { status: 400 }
    );
  }
}




