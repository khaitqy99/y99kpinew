import { NextRequest, NextResponse } from 'next/server';
import { employeeService } from '@/services/supabase-service';

// GET /api/employees - Get all employees
export async function GET(request: NextRequest) {
  try {
    const employees = await employeeService.getAll();
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employee = await employeeService.create(body);
    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create employee' },
      { status: 400 }
    );
  }
}




