import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get current user' },
      { status: 500 }
    );
  }
}




