import { NextRequest, NextResponse } from 'next/server';
import { bonusPenaltyService } from '@/services/bonus-penalty-service';

// GET /api/bonus-penalty/periods - Get available periods
export async function GET(request: NextRequest) {
  try {
    const periods = await bonusPenaltyService.getAvailablePeriods();
    return NextResponse.json({ success: true, data: periods });
  } catch (error: any) {
    console.error('Error fetching available periods:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch available periods' },
      { status: 500 }
    );
  }
}















