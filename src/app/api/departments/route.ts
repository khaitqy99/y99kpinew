import { NextRequest, NextResponse } from 'next/server';
import { departmentService } from '@/services/supabase-service';

// GET /api/departments - Get all departments
export async function GET(request: NextRequest) {
  try {
    const departments = await departmentService.getAll();
    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const department = await departmentService.create(body);
    return NextResponse.json({ success: true, data: department }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create department' },
      { status: 400 }
    );
  }
}





