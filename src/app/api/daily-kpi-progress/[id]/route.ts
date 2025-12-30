import { NextRequest, NextResponse } from 'next/server';
import { dailyKpiProgressService } from '@/services/supabase-service';

// GET /api/daily-kpi-progress/[id] - Get daily KPI progress by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid daily KPI progress ID' },
        { status: 400 }
      );
    }

    const progress = await dailyKpiProgressService.getById(id);
    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Daily KPI progress not found' },
        { status: 404 }
      );
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

// PUT /api/daily-kpi-progress/[id] - Update daily KPI progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid daily KPI progress ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const progress = await dailyKpiProgressService.update(id, body);
    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('Error updating daily KPI progress:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update daily KPI progress' },
      { status: 400 }
    );
  }
}

// DELETE /api/daily-kpi-progress/[id] - Delete daily KPI progress (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid daily KPI progress ID' },
        { status: 400 }
      );
    }

    await dailyKpiProgressService.delete(id);
    return NextResponse.json({ success: true, message: 'Daily KPI progress deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting daily KPI progress:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete daily KPI progress' },
      { status: 500 }
    );
  }
}








