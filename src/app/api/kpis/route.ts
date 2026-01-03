import { NextRequest, NextResponse } from 'next/server';
import { kpiService } from '@/services/supabase-service';

// GET /api/kpis - Get all KPIs
export async function GET(request: NextRequest) {
  try {
    const kpis = await kpiService.getAll();
    return NextResponse.json({ success: true, data: kpis });
  } catch (error: any) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

// POST /api/kpis - Create a new KPI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kpi = await kpiService.create(body);
    return NextResponse.json({ success: true, data: kpi }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating KPI:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create KPI' },
      { status: 400 }
    );
  }
}
















