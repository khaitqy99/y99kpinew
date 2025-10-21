'use client';

import { notificationService } from './supabase-service';
import { SessionContext } from '@/contexts/SessionContext';
import { useContext } from 'react';

export interface NotificationData {
  user_id: string;
  type: 'assigned' | 'submitted' | 'approved' | 'rejected' | 'reminder' | 'reward' | 'penalty' | 'deadline';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'kpi' | 'bonus' | 'system' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  actor: {
    id: string;
    name: string;
    avatar: string;
  };
  target: string;
  action: string;
  actionUrl?: string;
  metadata?: {
    kpiId?: string;
    recordId?: string;
    bonusAmount?: number;
    penaltyAmount?: number;
    deadline?: string;
    period?: string;
  };
}

export class NotificationManager {
  private static instance: NotificationManager;
  private currentUser: any = null;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  async createNotification(notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'>) {
    try {
      const notification = await notificationService.create({
        ...notificationData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Thông báo khi giao KPI
  async notifyKpiAssigned(kpiRecord: any, assigneeInfo: { id: string; name: string; type: 'employee' | 'department' }) {
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: assigneeInfo.id,
      type: 'assigned',
      priority: 'medium',
      category: 'kpi',
      title: 'KPI mới được giao',
      message: `Bạn đã được giao KPI "${kpiRecord.kpi_name}" với mục tiêu ${kpiRecord.target} ${kpiRecord.unit || ''} trong kỳ ${kpiRecord.period}`,
      read: false,
      actor: {
        id: this.currentUser?.id || 'system',
        name: this.currentUser?.name || 'Hệ thống',
        avatar: this.currentUser?.avatar || '/default-avatar.png'
      },
      target: assigneeInfo.name,
      action: 'Xem chi tiết',
      actionUrl: `/employee/kpis`,
      metadata: {
        kpiId: kpiRecord.kpi_id,
        recordId: kpiRecord.id,
        deadline: kpiRecord.end_date,
        period: kpiRecord.period
      }
    };

    return await this.createNotification(notificationData);
  }

  // Thông báo khi submit KPI
  async notifyKpiSubmitted(kpiRecord: any, submitterInfo: { id: string; name: string }) {
    // Thông báo cho admin/manager
    const adminNotificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: 'admin', // Hoặc lấy từ role admin
      type: 'submitted',
      priority: 'medium',
      category: 'kpi',
      title: 'KPI đã được submit',
      message: `${submitterInfo.name} đã submit KPI "${kpiRecord.kpi_name}" với kết quả ${kpiRecord.actual} ${kpiRecord.unit || ''}`,
      read: false,
      actor: {
        id: submitterInfo.id,
        name: submitterInfo.name,
        avatar: '/default-avatar.png'
      },
      target: 'Quản lý',
      action: 'Xem và phê duyệt',
      actionUrl: `/admin/approval`,
      metadata: {
        kpiId: kpiRecord.kpi_id,
        recordId: kpiRecord.id,
        period: kpiRecord.period
      }
    };

    return await this.createNotification(adminNotificationData);
  }

  // Thông báo khi approve/reject KPI
  async notifyKpiApproved(kpiRecord: any, approverInfo: { id: string; name: string }, status: 'approved' | 'rejected') {
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: kpiRecord.employee_id,
      type: status === 'approved' ? 'approved' : 'rejected',
      priority: status === 'approved' ? 'medium' : 'high',
      category: 'kpi',
      title: status === 'approved' ? 'KPI đã được phê duyệt' : 'KPI đã bị từ chối',
      message: status === 'approved' 
        ? `KPI "${kpiRecord.kpi_name}" của bạn đã được ${approverInfo.name} phê duyệt với điểm số ${kpiRecord.score || 'N/A'}`
        : `KPI "${kpiRecord.kpi_name}" của bạn đã bị ${approverInfo.name} từ chối. Vui lòng xem phản hồi và chỉnh sửa.`,
      read: false,
      actor: {
        id: approverInfo.id,
        name: approverInfo.name,
        avatar: '/default-avatar.png'
      },
      target: kpiRecord.employee_name || 'Nhân viên',
      action: status === 'approved' ? 'Xem kết quả' : 'Xem phản hồi',
      actionUrl: `/employee/kpis`,
      metadata: {
        kpiId: kpiRecord.kpi_id,
        recordId: kpiRecord.id,
        period: kpiRecord.period
      }
    };

    return await this.createNotification(notificationData);
  }

  // Thông báo nhắc nhở deadline
  async notifyDeadlineReminder(kpiRecord: any, daysUntilDeadline: number) {
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: kpiRecord.employee_id,
      type: 'reminder',
      priority: daysUntilDeadline <= 1 ? 'urgent' : daysUntilDeadline <= 3 ? 'high' : 'medium',
      category: 'reminder',
      title: 'Nhắc nhở deadline KPI',
      message: `KPI "${kpiRecord.kpi_name}" sẽ hết hạn trong ${daysUntilDeadline} ngày (${new Date(kpiRecord.end_date).toLocaleDateString('vi-VN')})`,
      read: false,
      actor: {
        id: 'system',
        name: 'Hệ thống',
        avatar: '/system-avatar.png'
      },
      target: kpiRecord.employee_name || 'Nhân viên',
      action: 'Xem chi tiết',
      actionUrl: `/employee/kpis`,
      metadata: {
        kpiId: kpiRecord.kpi_id,
        recordId: kpiRecord.id,
        deadline: kpiRecord.end_date,
        period: kpiRecord.period
      }
    };

    return await this.createNotification(notificationData);
  }

  // Thông báo bonus/penalty
  async notifyBonusPenalty(kpiRecord: any, bonusAmount?: number, penaltyAmount?: number) {
    const isBonus = bonusAmount && bonusAmount > 0;
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: kpiRecord.employee_id,
      type: isBonus ? 'reward' : 'penalty',
      priority: 'medium',
      category: 'bonus',
      title: isBonus ? 'Thưởng KPI' : 'Phạt KPI',
      message: isBonus 
        ? `Chúc mừng! Bạn đã nhận được thưởng ${bonusAmount?.toLocaleString('vi-VN')} VNĐ cho KPI "${kpiRecord.kpi_name}"`
        : `Bạn đã bị phạt ${penaltyAmount?.toLocaleString('vi-VN')} VNĐ cho KPI "${kpiRecord.kpi_name}"`,
      read: false,
      actor: {
        id: 'system',
        name: 'Hệ thống',
        avatar: '/system-avatar.png'
      },
      target: kpiRecord.employee_name || 'Nhân viên',
      action: 'Xem chi tiết',
      actionUrl: `/employee/bonus-penalty`,
      metadata: {
        kpiId: kpiRecord.kpi_id,
        recordId: kpiRecord.id,
        bonusAmount: bonusAmount || 0,
        penaltyAmount: penaltyAmount || 0,
        period: kpiRecord.period
      }
    };

    return await this.createNotification(notificationData);
  }

  // Thông báo hệ thống
  async notifySystem(message: string, userId?: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: userId || 'all',
      type: 'reminder',
      priority,
      category: 'system',
      title: 'Thông báo hệ thống',
      message,
      read: false,
      actor: {
        id: 'system',
        name: 'Hệ thống',
        avatar: '/system-avatar.png'
      },
      target: userId ? 'Người dùng' : 'Tất cả',
      action: 'Xem',
      actionUrl: '/settings'
    };

    return await this.createNotification(notificationData);
  }

  // Lấy thông báo cho user
  async getUserNotifications(userId: string) {
    try {
      return await notificationService.getByUserId(userId);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Đánh dấu đã đọc
  async markAsRead(notificationId: string) {
    try {
      return await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId: string) {
    try {
      return await notificationService.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();
