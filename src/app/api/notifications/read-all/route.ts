import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/supabase-service';

// PUT /api/notifications/read-all - Mark all notifications as read for a user
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    await notificationService.markAllAsRead(id);
    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}


















