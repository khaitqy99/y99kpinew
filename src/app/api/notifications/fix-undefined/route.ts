import { NextRequest, NextResponse } from 'next/server';
import { notificationService, kpiService } from '@/services/supabase-service';

// POST /api/notifications/fix-undefined - Fix notifications with "undefined" in message
export async function POST(request: NextRequest) {
  try {
    // Lấy tất cả thông báo
    const allNotifications = await notificationService.getAll();
    
    // Lấy tất cả KPIs để map
    const allKpis = await kpiService.getAll();
    const kpiMap = new Map(allKpis.map(kpi => [kpi.id, kpi.name]));
    
    let fixedCount = 0;
    const errors: string[] = [];
    
    // Tìm và sửa các thông báo có "undefined" trong message
    for (const notification of allNotifications) {
      if (notification.message && notification.message.includes('undefined')) {
        let newMessage = notification.message;
        
        // Nếu có metadata.kpiId, lấy tên KPI từ map
        if (notification.metadata?.kpiId) {
          const kpiId = typeof notification.metadata.kpiId === 'string' 
            ? parseInt(notification.metadata.kpiId, 10) 
            : notification.metadata.kpiId;
          
          const kpiName = kpiMap.get(kpiId);
          if (kpiName) {
            newMessage = notification.message.replace(/undefined/g, kpiName);
          } else {
            // Nếu không tìm thấy KPI, thay bằng "KPI"
            newMessage = notification.message.replace(/undefined/g, 'KPI');
          }
        } else {
          // Nếu không có kpiId, thay bằng "KPI"
          newMessage = notification.message.replace(/undefined/g, 'KPI');
        }
        
        // Chỉ update nếu message đã thay đổi
        if (newMessage !== notification.message) {
          try {
            await notificationService.update(notification.id, { message: newMessage });
            fixedCount++;
          } catch (error: any) {
            errors.push(`Failed to update notification ${notification.id}: ${error.message}`);
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      fixedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error fixing notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fix notifications' },
      { status: 500 }
    );
  }
}

