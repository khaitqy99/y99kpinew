import { NextRequest, NextResponse } from 'next/server';
import { roleService } from '@/services/supabase-service';

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const roles = await roleService.getAll();
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = await roleService.create(body);
    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create role' },
      { status: 400 }
    );
  }
}








