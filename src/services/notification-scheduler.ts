'use client';

import { notificationManager } from './notification-service';
import { kpiRecordService } from './supabase-service';

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  // Khởi động scheduler để kiểm tra deadline và gửi thông báo nhắc nhở
  startScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Kiểm tra mỗi 30 phút
    this.intervalId = setInterval(async () => {
      await this.checkDeadlines();
    }, 30 * 60 * 1000);

    // Chạy ngay lập tức
    this.checkDeadlines();
  }

  // Dừng scheduler
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Kiểm tra deadline và gửi thông báo nhắc nhở
  private async checkDeadlines() {
    try {
      const allRecords = await kpiRecordService.getAll();
      const now = new Date();
      
      for (const record of allRecords) {
        if (!record.end_date || record.status === 'approved' || record.status === 'rejected') {
          continue;
        }

        const endDate = new Date(record.end_date);
        const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Gửi thông báo nhắc nhở
        if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
          await this.sendDeadlineReminder(record, daysUntilDeadline);
        }
        
        // Gửi thông báo deadline đã hết hạn
        if (daysUntilDeadline < 0 && record.status !== 'overdue') {
          await this.sendOverdueNotification(record);
        }
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }

  // Gửi thông báo nhắc nhở deadline
  private async sendDeadlineReminder(record: any, daysUntilDeadline: number) {
    try {
      // Kiểm tra xem đã gửi thông báo cho deadline này chưa
      const lastReminderKey = `deadline_reminder_${record.id}_${daysUntilDeadline}`;
      const lastReminder = localStorage.getItem(lastReminderKey);
      
      if (lastReminder) {
        const lastReminderDate = new Date(lastReminder);
        const hoursSinceLastReminder = (Date.now() - lastReminderDate.getTime()) / (1000 * 60 * 60);
        
        // Chỉ gửi lại nếu đã qua 24 giờ
        if (hoursSinceLastReminder < 24) {
          return;
        }
      }

      await notificationManager.notifyDeadlineReminder(record, daysUntilDeadline);
      
      // Lưu thời gian gửi thông báo cuối
      localStorage.setItem(lastReminderKey, new Date().toISOString());
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
    }
  }

  // Gửi thông báo deadline đã hết hạn
  private async sendOverdueNotification(record: any) {
    try {
      const notificationData = {
        user_id: record.employee_id,
        type: 'deadline' as const,
        priority: 'urgent' as const,
        category: 'reminder' as const,
        title: 'KPI đã hết hạn',
        message: `KPI "${record.kpi_name || 'KPI'}" đã hết hạn vào ${new Date(record.end_date).toLocaleDateString('vi-VN')}. Vui lòng liên hệ quản lý để được hỗ trợ.`,
        read: false,
        actor: {
          id: 'system',
          name: 'Hệ thống',
          avatar: '/system-avatar.png'
        },
        target: record.employee_name || 'Nhân viên',
        action: 'Xem chi tiết',
        actionUrl: '/employee/kpis',
        metadata: {
          kpiId: record.kpi_id,
          recordId: record.id,
          deadline: record.end_date,
          period: record.period
        }
      };

      await notificationManager.createNotification(notificationData);
      
      // Cập nhật trạng thái record thành overdue
      await kpiRecordService.update(record.id, { status: 'overdue' });
    } catch (error) {
      console.error('Error sending overdue notification:', error);
    }
  }

  // Gửi thông báo bonus/penalty sau khi approve KPI
  async sendBonusPenaltyNotification(record: any, bonusAmount?: number, penaltyAmount?: number) {
    try {
      if (!bonusAmount && !penaltyAmount) {
        return;
      }

      await notificationManager.notifyBonusPenalty(record, bonusAmount, penaltyAmount);
    } catch (error) {
      console.error('Error sending bonus/penalty notification:', error);
    }
  }

  // Gửi thông báo hệ thống cho tất cả người dùng
  async sendSystemNotification(message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    try {
      await notificationManager.notifySystem(message, undefined, priority);
    } catch (error) {
      console.error('Error sending system notification:', error);
    }
  }

  // Gửi thông báo cho người dùng cụ thể
  async sendUserNotification(userId: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    try {
      await notificationManager.notifySystem(message, userId, priority);
    } catch (error) {
      console.error('Error sending user notification:', error);
    }
  }

  // Tính toán bonus/penalty dựa trên KPI config
  calculateBonusPenalty(record: any, kpiConfig: any) {
    if (!kpiConfig?.reward_penalty_config) {
      return { bonusAmount: 0, penaltyAmount: 0 };
    }

    const config = kpiConfig.reward_penalty_config;
    const progress = record.progress || 0;
    const target = record.target || 0;
    const actual = record.actual || 0;

    let bonusAmount = 0;
    let penaltyAmount = 0;

    // Tính bonus dựa trên progress
    if (progress >= 100) {
      bonusAmount = config.bonus_amount || 0;
    } else if (progress >= 80) {
      bonusAmount = (config.bonus_amount || 0) * 0.5;
    }

    // Tính penalty dựa trên progress
    if (progress < 50) {
      penaltyAmount = config.penalty_amount || 0;
    } else if (progress < 70) {
      penaltyAmount = (config.penalty_amount || 0) * 0.5;
    }

    return { bonusAmount, penaltyAmount };
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();
