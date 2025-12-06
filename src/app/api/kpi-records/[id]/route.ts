import { NextRequest, NextResponse } from 'next/server';
import { kpiRecordService } from '@/services/supabase-service';

// GET /api/kpi-records/[id] - Get KPI record by ID
export async function GET(
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

    const record = await kpiRecordService.getById(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'KPI record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error fetching KPI record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch KPI record' },
      { status: 500 }
    );
  }
}

// PUT /api/kpi-records/[id] - Update KPI record
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
    const record = await kpiRecordService.update(id, body);
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error updating KPI record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update KPI record' },
      { status: 400 }
    );
  }
}

// DELETE /api/kpi-records/[id] - Delete KPI record (soft delete)
export async function DELETE(
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

    await kpiRecordService.delete(id);
    return NextResponse.json({ success: true, message: 'KPI record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting KPI record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete KPI record' },
      { status: 500 }
    );
  }
}





