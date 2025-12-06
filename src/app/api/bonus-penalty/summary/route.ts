import { NextRequest, NextResponse } from 'next/server';
import { bonusPenaltyService } from '@/services/bonus-penalty-service';

// GET /api/bonus-penalty/summary - Get bonus/penalty summary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');
    const branchId = searchParams.get('branchId');

    let summary;
    if (branchId) {
      const branchIdNum = parseInt(branchId, 10);
      if (isNaN(branchIdNum)) {
        return NextResponse.json(
          { success: false, error: 'Invalid branch ID' },
          { status: 400 }
        );
      }
      summary = await bonusPenaltyService.getSummaryByBranch(branchIdNum, period || undefined);
    } else {
      summary = await bonusPenaltyService.getSummary(period || undefined);
    }
    
    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error fetching bonus/penalty summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bonus/penalty summary' },
      { status: 500 }
    );
  }
}





