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
import { Badge } from '@/components/ui/badge';
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
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useContext(SupabaseDataContext);
  
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const userNotifications = useMemo(() => {
    if (!user || !notifications) return [];
    return notifications.filter(n => n.user_id === user.id || n.user_id === 'all');
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
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
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
          <SheetTitle className="flex items-center justify-between">
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} mới
              </Badge>
            )}
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
        
        {/* Category Filter */}
        <div className="flex gap-2 py-3 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category === 'all' ? 'Tất cả' : 
               category === 'kpi' ? 'KPI' :
               category === 'bonus' ? 'Thưởng phạt' :
               category === 'system' ? 'Hệ thống' :
               category === 'reminder' ? 'Nhắc nhở' : category}
            </Button>
          ))}
        </div>
        
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
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", priorityColors[notification.priority] || priorityColors.medium)}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className={cn("mt-1", !notification.read ? "text-foreground/80" : "text-muted-foreground")}>
                    {notification.message}
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
                    {notification.action && (
                      <span className="text-xs text-primary font-medium">
                        {notification.action} →
                      </span>
                    )}
                  </div>
                  {notification.metadata && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {notification.metadata.bonusAmount && (
                        <span className="text-green-600 font-medium">
                          Thưởng: {notification.metadata.bonusAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                      )}
                      {notification.metadata.penaltyAmount && (
                        <span className="text-red-600 font-medium">
                          Phạt: {notification.metadata.penaltyAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                      )}
                      {notification.metadata.deadline && (
                        <span className="text-orange-600">
                          Hạn: {new Date(notification.metadata.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  )}
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
