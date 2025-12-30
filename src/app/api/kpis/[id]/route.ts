import { NextRequest, NextResponse } from 'next/server';
import { kpiService } from '@/services/supabase-service';

// GET /api/kpis/[id] - Get KPI by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid KPI ID' },
        { status: 400 }
      );
    }

    const kpi = await kpiService.getById(id);
    if (!kpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: kpi });
  } catch (error: any) {
    console.error('Error fetching KPI:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch KPI' },
      { status: 500 }
    );
  }
}

// PUT /api/kpis/[id] - Update KPI
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid KPI ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const kpi = await kpiService.update(id, body);
    return NextResponse.json({ success: true, data: kpi });
  } catch (error: any) {
    console.error('Error updating KPI:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update KPI' },
      { status: 400 }
    );
  }
}

// DELETE /api/kpis/[id] - Delete KPI (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid KPI ID' },
        { status: 400 }
      );
    }

    await kpiService.delete(id);
    return NextResponse.json({ success: true, message: 'KPI deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting KPI:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete KPI' },
      { status: 500 }
    );
  }
}





