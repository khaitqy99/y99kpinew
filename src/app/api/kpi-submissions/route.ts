import { NextRequest, NextResponse } from 'next/server';
import { kpiSubmissionService } from '@/services/supabase-service';

// GET /api/kpi-submissions - Get all KPI submissions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');

    let submissions;
    if (employeeId) {
      const id = parseInt(employeeId, 10);
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid employee ID' },
          { status: 400 }
        );
      }
      submissions = await kpiSubmissionService.getByEmployeeId(id);
    } else {
      submissions = await kpiSubmissionService.getAll();
    }

    return NextResponse.json({ success: true, data: submissions });
  } catch (error: any) {
    console.error('Error fetching KPI submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch KPI submissions' },
      { status: 500 }
    );
  }
}

// POST /api/kpi-submissions - Create a new KPI submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...submissionData } = body;
    
    const submission = await kpiSubmissionService.create(
      submissionData,
      items || []
    );
    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating KPI submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create KPI submission' },
      { status: 400 }
    );
  }
}


















