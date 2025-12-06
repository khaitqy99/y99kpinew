import { NextRequest, NextResponse } from 'next/server';
import { kpiRecordService } from '@/services/supabase-service';

// PUT /api/kpi-records/[id]/status - Update KPI record status (approve/reject)
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
    const { status, approvedBy, feedback } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Valid statuses
    const validStatuses = ['not_started', 'in_progress', 'completed', 'pending_approval', 'approved', 'rejected', 'overdue'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const record = await kpiRecordService.getById(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'KPI record not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
    };

    // Set approval date if approving/rejecting
    if (status === 'approved' || status === 'rejected') {
      updateData.approval_date = new Date().toISOString();
      if (approvedBy) {
        const approverId = typeof approvedBy === 'string' ? parseInt(approvedBy, 10) : approvedBy;
        if (!isNaN(approverId)) {
          updateData.approved_by = approverId;
        }
      }
    }

    // Note: feedback field might not exist in database schema
    // Uncomment if database has feedback column
    // if (feedback) {
    //   const currentFeedback = Array.isArray((record as any).feedback) ? (record as any).feedback : [];
    //   updateData.feedback = [...currentFeedback, feedback];
    // }

    const updatedRecord = await kpiRecordService.update(id, updateData);

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error: any) {
    console.error('Error updating KPI record status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update KPI record status' },
      { status: 400 }
    );
  }
}




