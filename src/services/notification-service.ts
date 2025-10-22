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
      // Xử lý user_id đặc biệt - giữ nguyên để có thể filter theo role
      let userId = notificationData.user_id;
      
      // Chỉ lấy các field có trong database schema
      const dbNotification = {
        user_id: userId,
        type: notificationData.type,
        priority: notificationData.priority,
        category: notificationData.category,
        title: notificationData.title,
        message: notificationData.message,
        read: notificationData.read,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Creating notification with data:', dbNotification);
      const notification = await notificationService.create(dbNotification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      console.error('Notification data:', notificationData);
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
      message: `Bạn đã được giao KPI "${kpiRecord.kpi_name || 'KPI'}" với mục tiêu ${kpiRecord.target || 0} ${kpiRecord.unit || ''} trong kỳ ${kpiRecord.period || 'hiện tại'}`,
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
      user_id: 'admin', // Thông báo cho tất cả admin
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

    // Thông báo xác nhận cho người submit
    const submitterNotificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: submitterInfo.id,
      type: 'submitted',
      priority: 'low',
      category: 'kpi',
      title: 'KPI đã được submit thành công',
      message: `Bạn đã submit KPI "${kpiRecord.kpi_name}" thành công. Đang chờ phê duyệt từ quản lý.`,
      read: false,
      actor: {
        id: submitterInfo.id,
        name: submitterInfo.name,
        avatar: '/default-avatar.png'
      },
      target: submitterInfo.name,
      action: 'Xem chi tiết',
      actionUrl: `/employee/kpis`,
      metadata: {
        kpiId: kpiRecord.kpi_id,
        recordId: kpiRecord.id,
        period: kpiRecord.period
      }
    };

    // Tạo cả hai thông báo
    await this.createNotification(adminNotificationData);
    return await this.createNotification(submitterNotificationData);
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

  // Thông báo khi có KPI mới được tạo (cho admin)
  async notifyNewKpiCreated(kpi: any, creatorInfo: { id: string; name: string }) {
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: 'admin',
      type: 'assigned',
      priority: 'low',
      category: 'kpi',
      title: 'KPI mới được tạo',
      message: `${creatorInfo.name} đã tạo KPI mới "${kpi.name}" trong hệ thống`,
      read: false,
      actor: {
        id: creatorInfo.id,
        name: creatorInfo.name,
        avatar: '/default-avatar.png'
      },
      target: 'Quản lý',
      action: 'Xem chi tiết',
      actionUrl: `/admin/kpis`,
      metadata: {
        kpiId: kpi.id,
        period: kpi.period
      }
    };

    return await this.createNotification(notificationData);
  }

  // Thông báo khi có thưởng/phạt mới được thêm (cho nhân viên)
  async notifyBonusPenaltyAdded(record: any, employeeInfo: { id: string; name: string }, bonusAmount?: number, penaltyAmount?: number) {
    const isBonus = bonusAmount && bonusAmount > 0;
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: employeeInfo.id,
      type: isBonus ? 'reward' : 'penalty',
      priority: 'medium',
      category: 'bonus',
      title: isBonus ? 'Thưởng mới' : 'Phạt mới',
      message: isBonus 
        ? `Bạn đã nhận được thưởng ${bonusAmount?.toLocaleString('vi-VN')} VNĐ cho ${record.reason || 'hiệu suất tốt'}`
        : `Bạn đã bị phạt ${penaltyAmount?.toLocaleString('vi-VN')} VNĐ vì ${record.reason || 'hiệu suất chưa đạt'}`,
      read: false,
      actor: {
        id: 'system',
        name: 'Hệ thống',
        avatar: '/system-avatar.png'
      },
      target: employeeInfo.name,
      action: 'Xem chi tiết',
      actionUrl: `/employee/bonus-penalty`,
      metadata: {
        bonusAmount: bonusAmount || 0,
        penaltyAmount: penaltyAmount || 0,
        period: record.period
      }
    };

    return await this.createNotification(notificationData);
  }

  // Thông báo chào mừng cho user mới
  async notifyWelcomeUser(userInfo: { id: string; name: string; role: string }) {
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: userInfo.id,
      type: 'reminder',
      priority: 'low',
      category: 'system',
      title: 'Chào mừng đến với hệ thống KPI',
      message: `Chào mừng ${userInfo.name}! Bạn đã được thêm vào hệ thống với vai trò ${userInfo.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}.`,
      read: false,
      actor: {
        id: 'system',
        name: 'Hệ thống',
        avatar: '/system-avatar.png'
      },
      target: userInfo.name,
      action: 'Khám phá',
      actionUrl: userInfo.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'
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
