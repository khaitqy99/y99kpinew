import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/supabase-service';

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    let notifications;
    if (userId) {
      notifications = await notificationService.getByUserId(userId);
    } else {
      notifications = await notificationService.getAll();
    }

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notification = await notificationService.create(body);
    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create notification' },
      { status: 400 }
    );
  }
}
















