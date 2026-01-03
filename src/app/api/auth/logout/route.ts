import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';

// POST /api/auth/logout - Logout user
export async function POST(request: NextRequest) {
  try {
    await AuthService.logout();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to logout' },
      { status: 500 }
    );
  }
}


















