import { NextRequest, NextResponse } from 'next/server';
import { kpiSubmissionService } from '@/services/supabase-service';

// GET /api/kpi-submissions/[id] - Get KPI submission by ID
export async function GET(
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

    const submission = await kpiSubmissionService.getById(id);
    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'KPI submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Error fetching KPI submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch KPI submission' },
      { status: 500 }
    );
  }
}

// PUT /api/kpi-submissions/[id] - Update KPI submission
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
    const submission = await kpiSubmissionService.update(id, body);
    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Error updating KPI submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update KPI submission' },
      { status: 400 }
    );
  }
}

// DELETE /api/kpi-submissions/[id] - Delete KPI submission
export async function DELETE(
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

    await kpiSubmissionService.delete(id);
    return NextResponse.json({ success: true, message: 'KPI submission deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting KPI submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete KPI submission' },
      { status: 500 }
    );
  }
}





