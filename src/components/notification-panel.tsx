'use client';

import React, { useState, useMemo, useContext, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, FileCheck, Gift, AlertTriangle, CalendarCheck, Clock, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { SessionContext } from '@/contexts/SessionContext';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';

const notificationIcons: { [key: string]: React.ReactNode } = {
  assigned: <FileCheck className="h-5 w-5 text-blue-500" />,
  submitted: <FileCheck className="h-5 w-5 text-orange-500" />,
  approved: <CalendarCheck className="h-5 w-5 text-green-500" />,
  rejected: <AlertTriangle className="h-5 w-5 text-red-500" />,
  reminder: <Clock className="h-5 w-5 text-yellow-500" />,
  reward: <Gift className="h-5 w-5 text-purple-500" />,
  penalty: <DollarSign className="h-5 w-5 text-red-600" />,
  deadline: <AlertTriangle className="h-5 w-5 text-red-500" />
};

const priorityColors: { [key: string]: string } = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600'
};

const categoryColors: { [key: string]: string } = {
  kpi: 'bg-blue-50 border-blue-200',
  bonus: 'bg-green-50 border-green-200',
  system: 'bg-gray-50 border-gray-200',
  reminder: 'bg-yellow-50 border-yellow-200'
};

export function NotificationPanel() {
  const { user } = useContext(SessionContext);
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, kpis, kpiRecords } = useContext(SupabaseDataContext);
  
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function để sửa message có chứa "undefined" hoặc "KPI" (fallback)
  const fixNotificationMessage = useCallback((notification: any) => {
    if (!notification.message) {
      return notification.message;
    }
    
    // Kiểm tra xem có cần sửa không (có "undefined" hoặc pattern "KPI "KPI"")
    const needsFix = notification.message.includes('undefined') || 
                     notification.message.match(/KPI\s*"KPI"/);
    
    if (!needsFix) {
      return notification.message;
    }
    
    let kpiName: string | null = null;
    
    // Thử lấy từ kpiRecords nếu có recordId (có thể có nested kpis)
    if (notification.metadata?.recordId && kpiRecords) {
      const record = kpiRecords.find((r: any) => {
        const recordId = typeof r.id === 'string' ? parseInt(r.id, 10) : r.id;
        const metadataRecordId = typeof notification.metadata.recordId === 'string' 
          ? parseInt(notification.metadata.recordId, 10) 
          : notification.metadata.recordId;
        return recordId === metadataRecordId;
      });
      
      if (record) {
        // Thử lấy từ nested kpis object
        if (record.kpis?.name) {
          kpiName = record.kpis.name;
        } else if (record.kpi_name) {
          kpiName = record.kpi_name;
        }
      }
    }
    
    // Nếu chưa tìm thấy và có metadata.kpiId, lấy từ kpis list
    if (!kpiName && notification.metadata?.kpiId && kpis) {
      const kpiId = typeof notification.metadata.kpiId === 'string' 
        ? parseInt(notification.metadata.kpiId, 10) 
        : notification.metadata.kpiId;
      
      const kpi = kpis.find((k: any) => {
        const kId = typeof k.id === 'string' ? parseInt(k.id, 10) : k.id;
        return kId === kpiId;
      });
      
      if (kpi?.name) {
        kpiName = kpi.name;
      }
    }
    
    // Chỉ sửa nếu tìm được tên KPI thực sự
    if (kpiName) {
      // Thay "undefined" hoặc "KPI" trong quotes bằng tên KPI thực
      let fixedMessage = notification.message.replace(/undefined/g, kpiName);
      // Sửa pattern "KPI "KPI"" thành "KPI "{kpiName}""
      fixedMessage = fixedMessage.replace(/KPI\s*"KPI"/g, `KPI "${kpiName}"`);
      return fixedMessage;
    }
    
    // Nếu không tìm được tên KPI, giữ nguyên message
    return notification.message;
  }, [kpis, kpiRecords]);

  const userNotifications = useMemo(() => {
    if (!user || !notifications) return [];
    
    // Convert user.id to number for comparison (user.id is string, n.user_id is number)
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    // Lấy thông báo cho user cụ thể và thông báo theo role
    return notifications.filter(n => {
      // Thông báo cá nhân cho user này (so sánh số với số)
      // Đây là ưu tiên cao nhất - thông báo gửi trực tiếp cho user
      if (n.user_id !== null && n.user_id === userId) return true;
      
      // Nếu có user_id cụ thể nhưng không phải user này, bỏ qua
      if (n.user_id !== null && n.user_id !== userId) return false;
      
      // Xử lý backward compatibility: nếu user_type không có hoặc null,
      // mặc định là 'all' cho thông báo cũ (user_id là null)
      const effectiveUserType = n.user_type || 'all';
      
      // Thông báo cho admin (nếu user là admin)
      // Kiểm tra user_type === 'admin' - thông báo gửi cho tất cả admin
      if (user.role === 'admin' && effectiveUserType === 'admin') return true;
      
      // Thông báo cho employee (nếu user là employee)
      // Kiểm tra user_type === 'employee' - thông báo gửi cho tất cả employee
      if (user.role === 'employee' && effectiveUserType === 'employee') return true;
      
      // Thông báo cho tất cả (user_id là null và user_type là 'all')
      // Hoặc thông báo cũ không có user_type và user_id là null
      if (effectiveUserType === 'all') return true;
      
      return false;
    });
  }, [notifications, user]);

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === 'all') return userNotifications;
    return userNotifications.filter(n => n.category === selectedCategory);
  }, [userNotifications, selectedCategory]);

  const unreadCount = useMemo(() => userNotifications.filter((n) => !n.read).length, [userNotifications]);

  const categories = useMemo(() => {
    const cats = [...new Set(userNotifications.map(n => n.category))];
    return ['all', ...cats];
  }, [userNotifications]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    
    // Có thể thêm navigation logic ở đây nếu cần
    // Ví dụ: router.push('/employee/kpis') cho thông báo KPI
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      await markAllNotificationsAsRead();
    }
  };

  if (!isClient) {
      return (
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle>
            Thông báo
          </SheetTitle>
          <div className="text-sm">
            <p className="text-muted-foreground">
              Bạn có {unreadCount} thông báo chưa đọc.
            </p>
            <div className='text-right'>
                <Button
                variant="link"
                className="p-0 h-auto"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                >
                Đánh dấu tất cả là đã đọc
                </Button>
            </div>
          </div>
        </SheetHeader>
        <Separator />
        
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-2 py-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3 text-sm transition-colors cursor-pointer border',
                  notification.read
                    ? 'text-muted-foreground bg-gray-50'
                    : 'bg-accent/50',
                  'hover:bg-accent',
                  categoryColors[notification.category] || 'bg-gray-50'
                )}
              >
                <div className="relative mt-1 flex-shrink-0">
                    {notificationIcons[notification.type]}
                    {!notification.read && <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground truncate">{notification.title}</p>
                  </div>
                  <p className={cn("mt-1", !notification.read ? "text-foreground/80" : "text-muted-foreground")}>
                    {fixNotificationMessage(notification)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
             {filteredNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                    <Bell className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">
                      {selectedCategory === 'all' ? 'Không có thông báo mới' : `Không có thông báo ${selectedCategory}`}
                    </h3>
                    <p className="text-sm">Tất cả các cập nhật sẽ được hiển thị ở đây.</p>
                </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
