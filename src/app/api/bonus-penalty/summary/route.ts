import { NextRequest, NextResponse } from 'next/server';
import { bonusPenaltyService } from '@/services/bonus-penalty-service';

// GET /api/bonus-penalty/summary - Get bonus/penalty summary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');

    const summary = await bonusPenaltyService.getSummary(period || undefined);
    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error fetching bonus/penalty summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bonus/penalty summary' },
      { status: 500 }
    );
  }
}





