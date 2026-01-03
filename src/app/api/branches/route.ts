import { NextRequest, NextResponse } from 'next/server';
import { branchService } from '@/services/supabase-service';

// GET /api/branches - Get all branches
export async function GET(request: NextRequest) {
  try {
    const branches = await branchService.getAll();
    return NextResponse.json({ success: true, data: branches });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST /api/branches - Create a new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const branch = await branchService.create(body);
    return NextResponse.json({ success: true, data: branch }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create branch' },
      { status: 400 }
    );
  }
}


















