import { NextRequest, NextResponse } from 'next/server';
import { departmentService } from '@/services/supabase-service';

// GET /api/departments/[id] - Get department by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const department = await departmentService.getById(id);
    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error: any) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// PUT /api/departments/[id] - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const department = await departmentService.update(id, body);
    return NextResponse.json({ success: true, data: department });
  } catch (error: any) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update department' },
      { status: 400 }
    );
  }
}

// DELETE /api/departments/[id] - Delete department (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    await departmentService.delete(id);
    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete department' },
      { status: 500 }
    );
  }
}








