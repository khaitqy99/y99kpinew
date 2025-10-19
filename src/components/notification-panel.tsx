'use client';

import React, { useState, useMemo, useContext, useEffect } from 'react';
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
import { SessionContext } from '@/contexts/SessionContext';
import { DataContext } from '@/contexts/DataContext';

const notificationIcons: { [key: string]: React.ReactNode } = {
  assigned: <FileCheck className="h-5 w-5 text-blue-500" />,
  approved: <CalendarCheck className="h-5 w-5 text-green-500" />,
  rejected: <AlertTriangle className="h-5 w-5 text-red-500" />,
  reminder: <Bell className="h-5 w-5 text-yellow-500" />,
  reward: <Gift className="h-5 w-5 text-purple-500" />
};

export function NotificationPanel() {
  const { user } = useContext(SessionContext);
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useContext(DataContext);
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter(n => n.recipientId === user.id || n.recipientId === 'all');
  }, [notifications, user]);

  const unreadCount = useMemo(() => userNotifications.filter((n) => !n.read).length, [userNotifications]);

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
          <SheetTitle>Thông báo</SheetTitle>
           <div className="text-sm">
            <p className="text-muted-foreground whitespace-nowrap">
              Bạn có {unreadCount} thông báo chưa đọc.
            </p>
            <div className='text-right'>
                <Button
                variant="link"
                className="p-0 h-auto"
                onClick={markAllNotificationsAsRead}
                disabled={unreadCount === 0}
                >
                Đánh dấu tất cả là đã đọc
                </Button>
            </div>
          </div>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-1 py-4">
            {userNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3 text-sm transition-colors cursor-pointer',
                  notification.read
                    ? 'text-muted-foreground'
                    : 'bg-accent/50',
                  'hover:bg-accent'
                )}
              >
                <div className="relative mt-1">
                    {notificationIcons[notification.type]}
                    {!notification.read && <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{notification.title}</p>
                  <p className={cn(!notification.read ? "text-foreground/80" : "text-muted-foreground")}>{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.time}
                  </p>
                </div>
              </div>
            ))}
             {userNotifications.length === 0 && (
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
