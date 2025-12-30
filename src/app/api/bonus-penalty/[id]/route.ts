import { NextRequest, NextResponse } from 'next/server';
import { bonusPenaltyService } from '@/services/bonus-penalty-service';

// PUT /api/bonus-penalty/[id] - Update bonus/penalty record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const record = await bonusPenaltyService.updateRecord(id, body);
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error updating bonus/penalty record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bonus/penalty record' },
      { status: 400 }
    );
  }
}

// DELETE /api/bonus-penalty/[id] - Delete bonus/penalty record (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await bonusPenaltyService.deleteRecord(id);
    return NextResponse.json({ success: true, message: 'Bonus/penalty record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bonus/penalty record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete bonus/penalty record' },
      { status: 500 }
    );
  }
}








