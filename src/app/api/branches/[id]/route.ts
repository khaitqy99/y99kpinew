import { NextRequest, NextResponse } from 'next/server';
import { branchService } from '@/services/supabase-service';

// GET /api/branches/[id] - Get branch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch ID' },
        { status: 400 }
      );
    }

    const branch = await branchService.getById(id);
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

// PUT /api/branches/[id] - Update branch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const branch = await branchService.update(id, body);
    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update branch' },
      { status: 400 }
    );
  }
}

// DELETE /api/branches/[id] - Delete branch (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch ID' },
        { status: 400 }
      );
    }

    await branchService.delete(id);
    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete branch' },
      { status: 500 }
    );
  }
}




