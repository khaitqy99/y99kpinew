'use client';

import React, { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, FileCheck, Gift, AlertTriangle, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

type Notification = {
  id: string;
  type: 'assigned' | 'approved' | 'rejected' | 'reminder';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
};

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'assigned',
    title: 'KPI mới được giao',
    description: 'Bạn đã được giao KPI "Tăng 10% doanh số bán hàng".',
    timestamp: '2 giờ trước',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'reminder',
    title: 'Nhắc nhở hạn chót',
    description: 'KPI "Hoàn thành báo cáo thị trường" sẽ hết hạn trong 3 ngày.',
    timestamp: 'Hôm qua',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'approved',
    title: 'KPI đã được duyệt',
    description: 'Chúc mừng! KPI "Đạt chứng chỉ Google Ads" của bạn đã được duyệt.',
    timestamp: '2 ngày trước',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'rejected',
    title: 'KPI bị từ chối',
    description: 'KPI "Tối ưu hóa trang sản phẩm" đã bị từ chối với phản hồi.',
    timestamp: '4 ngày trước',
    read: true,
  },
   {
    id: 'notif-5',
    type: 'approved',
    title: 'Thưởng hiệu suất',
    description: 'Bạn đã nhận được thưởng cho việc hoàn thành xuất sắc KPI Quý 2.',
    timestamp: '1 tuần trước',
    read: false,
  },
];

const notificationIcons = {
  assigned: <FileCheck className="h-5 w-5 text-blue-500" />,
  approved: <CalendarCheck className="h-5 w-5 text-green-500" />,
  rejected: <AlertTriangle className="h-5 w-5 text-red-500" />,
  reminder: <Bell className="h-5 w-5 text-yellow-500" />,
  reward: <Gift className="h-5 w-5 text-purple-500" />
};

export function NotificationPanel() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };
  
  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
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
          <SheetTitle>Thông báo</SheetTitle>
           <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Bạn có {unreadCount} thông báo chưa đọc.
            </p>
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Đánh dấu tất cả là đã đọc
            </Button>
          </div>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-1 py-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3 text-sm transition-colors cursor-pointer',
                  notification.read
                    ? 'text-muted-foreground'
                    : 'bg-accent/50 font-semibold',
                  'hover:bg-accent'
                )}
              >
                <div className="relative mt-1">
                    {notificationIcons[notification.type === 'approved' && notification.title.includes('Thưởng') ? 'reward' : notification.type]}
                    {!notification.read && <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{notification.title}</p>
                  <p className={cn(!notification.read ? "text-foreground/80" : "text-muted-foreground")}>{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            ))}
             {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">Không có thông báo mới</h3>
                    <p className="text-sm">Tất cả các cập nhật sẽ được hiển thị ở đây.</p>
                </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
