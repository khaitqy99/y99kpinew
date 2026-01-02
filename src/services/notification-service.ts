'use client';

import { notificationService } from './supabase-service';
import { employeeService } from './supabase-service';
import { SessionContext } from '@/contexts/SessionContext';
import { useContext } from 'react';

export interface NotificationData {
  user_id: string | number;
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

  // Helper function to convert user_id to number or null
  private normalizeUserId(userId: string | number | null | undefined): number | null {
    if (userId === null || userId === undefined || userId === '') {
      return null;
    }
    if (typeof userId === 'number') {
      return userId;
    }
    if (typeof userId === 'string') {
      // Handle special cases
      if (userId === 'admin' || userId === 'all') {
        return null;
      }
      // Try to parse as number
      const parsed = Number(userId);
      if (!isNaN(parsed) && isFinite(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  // Helper function to determine user_type based on user_id
  private getUserType(userId: string | number | null | undefined): 'employee' | 'admin' | 'all' {
    if (userId === null || userId === undefined || userId === '' || userId === 'all') {
      return 'all';
    }
    if (typeof userId === 'string' && userId === 'admin') {
      return 'admin';
    }
    return 'employee';
  }

  // Helper function to get all admin user IDs
  private async getAdminUserIds(): Promise<number[]> {
    try {
      const employees = await employeeService.getAll();
      // Admins are employees with level >= 4
      return employees
        .filter(emp => emp.level >= 4 && emp.is_active)
        .map(emp => emp.id);
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  async createNotification(notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'>) {
    try {
      const userId = notificationData.user_id;
      
      // Handle special cases: 'admin' and 'all'
      if (userId === 'admin') {
        // Find all admin users and create notifications for each
        const adminIds = await this.getAdminUserIds();
        if (adminIds.length === 0) {
          console.warn('No admin users found, skipping notification');
          return null;
        }
        
        const results = [];
        for (const adminId of adminIds) {
          const dbNotification = {
            user_id: adminId,
            user_type: 'admin' as const,
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
          try {
            const notification = await notificationService.create(dbNotification);
            results.push(notification);
          } catch (error) {
            console.error(`Error creating notification for admin ${adminId}:`, error);
          }
        }
        return results.length > 0 ? results[0] : null;
      } else if (userId === 'all' || userId === null || userId === undefined || userId === '') {
        // Create notification for all users (user_id = null, user_type = 'all')
        const dbNotification = {
          user_id: null,
          user_type: 'all' as const,
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
        return await notificationService.create(dbNotification);
      } else {
        // Normal user notification - convert to number
        const normalizedUserId = this.normalizeUserId(userId);
        const userType = this.getUserType(userId);
        
        if (normalizedUserId === null) {
          throw new Error(`Invalid user_id: ${userId}. Must be a number or 'admin' or 'all'`);
        }

        const dbNotification = {
          user_id: normalizedUserId,
          user_type: userType,
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
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      console.error('Notification data:', notificationData);
      throw error;
    }
  }

  // Thông báo khi giao KPI
  async notifyKpiAssigned(kpiRecord: any, assigneeInfo: { id: string; name: string; type: 'employee' | 'department' }) {
    // Lấy tên KPI từ nested object hoặc trực tiếp
    const kpiName = (kpiRecord.kpis?.name || kpiRecord.kpi_name || 'KPI');
    const unit = (kpiRecord.kpis?.unit || kpiRecord.unit || '');
    
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: assigneeInfo.id,
      type: 'assigned',
      priority: 'medium',
      category: 'kpi',
      title: 'KPI mới được giao',
      message: `Bạn đã được giao KPI "${kpiName}" với mục tiêu ${kpiRecord.target || 0} ${unit} trong kỳ ${kpiRecord.period || 'hiện tại'}`,
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
    // Lấy tên KPI và unit từ nested object hoặc trực tiếp
    const kpiName = (kpiRecord.kpis?.name || kpiRecord.kpi_name || 'KPI');
    const unit = (kpiRecord.kpis?.unit || kpiRecord.unit || '');
    
    // Thông báo cho admin/manager
    const adminNotificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: 'admin', // Thông báo cho tất cả admin
      type: 'submitted',
      priority: 'medium',
      category: 'kpi',
      title: 'KPI đã được submit',
      message: `${submitterInfo.name} đã submit KPI "${kpiName}" với kết quả ${kpiRecord.actual} ${unit}`,
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
      message: `Bạn đã submit KPI "${kpiName}" thành công. Đang chờ phê duyệt từ quản lý.`,
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
    // Lấy tên KPI từ nested object hoặc trực tiếp
    const kpiName = (kpiRecord.kpis?.name || kpiRecord.kpi_name || 'KPI');
    
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: kpiRecord.employee_id,
      type: status === 'approved' ? 'approved' : 'rejected',
      priority: status === 'approved' ? 'medium' : 'high',
      category: 'kpi',
      title: status === 'approved' ? 'KPI đã được phê duyệt' : 'KPI đã bị từ chối',
      message: status === 'approved' 
        ? `KPI "${kpiName}" của bạn đã được ${approverInfo.name} phê duyệt với điểm số ${kpiRecord.score || 'N/A'}`
        : `KPI "${kpiName}" của bạn đã bị ${approverInfo.name} từ chối. Vui lòng xem phản hồi và chỉnh sửa.`,
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
    // Lấy tên KPI từ nested object hoặc trực tiếp
    const kpiName = (kpiRecord.kpis?.name || kpiRecord.kpi_name || 'KPI');
    
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: kpiRecord.employee_id,
      type: 'reminder',
      priority: daysUntilDeadline <= 1 ? 'urgent' : daysUntilDeadline <= 3 ? 'high' : 'medium',
      category: 'reminder',
      title: 'Nhắc nhở deadline KPI',
      message: `KPI "${kpiName}" sẽ hết hạn trong ${daysUntilDeadline} ngày (${new Date(kpiRecord.end_date).toLocaleDateString('vi-VN')})`,
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

  // Thông báo khi nhân viên cập nhật tiến độ KPI
  async notifyKpiProgressUpdated(kpiRecord: any, employeeInfo: { id: string; name: string }, actual: number, progress: number) {
    // Lấy tên KPI và unit từ nested object hoặc trực tiếp
    const kpiName = (kpiRecord.kpis?.name || kpiRecord.kpi_name || 'KPI');
    const unit = (kpiRecord.kpis?.unit || kpiRecord.unit || '');
    
    // Thông báo cho admin/manager
    const adminNotificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: 'admin', // Thông báo cho tất cả admin
      type: 'reminder',
      priority: 'low',
      category: 'kpi',
      title: 'KPI đã được cập nhật tiến độ',
      message: `${employeeInfo.name} đã cập nhật tiến độ KPI "${kpiName}" - Kết quả: ${actual} ${unit} (${progress.toFixed(1)}%)`,
      read: false,
      actor: {
        id: employeeInfo.id,
        name: employeeInfo.name,
        avatar: '/default-avatar.png'
      },
      target: 'Quản lý',
      action: 'Xem chi tiết',
      actionUrl: `/admin/assign`,
      metadata: {
        kpiId: kpiRecord.kpi_id,
        recordId: kpiRecord.id,
        period: kpiRecord.period
      }
    };

    return await this.createNotification(adminNotificationData);
  }

  // Thông báo bonus/penalty
  async notifyBonusPenalty(kpiRecord: any, bonusAmount?: number, penaltyAmount?: number) {
    // Lấy tên KPI từ nested object hoặc trực tiếp
    const kpiName = (kpiRecord.kpis?.name || kpiRecord.kpi_name || 'KPI');
    const isBonus = bonusAmount && bonusAmount > 0;
    
    const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
      user_id: kpiRecord.employee_id,
      type: isBonus ? 'reward' : 'penalty',
      priority: 'medium',
      category: 'bonus',
      title: isBonus ? 'Thưởng KPI' : 'Phạt KPI',
      message: isBonus 
        ? `Chúc mừng! Bạn đã nhận được thưởng ${bonusAmount?.toLocaleString('vi-VN')} VNĐ cho KPI "${kpiName}"`
        : `Bạn đã bị phạt ${penaltyAmount?.toLocaleString('vi-VN')} VNĐ cho KPI "${kpiName}"`,
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
  async markAsRead(notificationId: string | number) {
    try {
      const numericId = typeof notificationId === 'string' ? Number(notificationId) : notificationId;
      if (isNaN(numericId) || !isFinite(numericId)) {
        throw new Error(`Invalid notification ID: ${notificationId}`);
      }
      return await notificationService.markAsRead(numericId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId: string | number) {
    try {
      const numericId = typeof userId === 'string' ? Number(userId) : userId;
      if (isNaN(numericId) || !isFinite(numericId)) {
        throw new Error(`Invalid user ID: ${userId}`);
      }
      return await notificationService.markAllAsRead(numericId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();
