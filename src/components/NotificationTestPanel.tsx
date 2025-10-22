'use client';

import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { SessionContext } from '@/contexts/SessionContext';
import { notificationManager } from '@/services/notification-service';

export function NotificationTestPanel() {
  const { notifications, refreshNotifications } = useContext(SupabaseDataContext);
  const { user } = useContext(SessionContext);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTestNotification = async () => {
    if (!user) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      // Tạo thông báo test với user_id thực
      await notificationManager.createNotification({
        user_id: user.id, // Sử dụng UUID thực
        type: 'reminder',
        priority: 'medium',
        category: 'system',
        title: 'Thông báo test',
        message: `Đây là thông báo test cho ${user.name} (${user.role})`,
        read: false,
        actor: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        },
        target: user.name,
        action: 'Xem',
        actionUrl: '/test-upload'
      });
      
      // Refresh notifications
      await refreshNotifications();
      console.log('Test notification created successfully');
    } catch (err) {
      console.error('Error creating test notification:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  };

  const createAdminNotification = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Tạo thông báo test với user_id = 'admin'
      await notificationManager.createNotification({
        user_id: 'admin', // Sử dụng string đặc biệt
        type: 'assigned',
        priority: 'high',
        category: 'kpi',
        title: 'Thông báo test cho Admin',
        message: 'Đây là thông báo test dành cho admin',
        read: false,
        actor: {
          id: 'system',
          name: 'Hệ thống',
          avatar: '/system-avatar.png'
        },
        target: 'Admin',
        action: 'Xem',
        actionUrl: '/admin/dashboard'
      });
      
      await refreshNotifications();
      console.log('Admin test notification created successfully');
    } catch (err) {
      console.error('Error creating admin test notification:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  };

  const userNotifications = notifications.filter(n => {
    if (n.user_id === user?.id) return true;
    if (user?.role === 'admin' && n.user_id === 'admin') return true;
    if (user?.role === 'employee' && n.user_id === 'employee') return true;
    if (n.user_id === 'all') return true;
    return false;
  });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Test: Tạo thông báo</CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>User hiện tại: {user?.name} ({user?.role}) - ID: {user?.id}</p>
          <p>Tổng số thông báo: {notifications.length}</p>
          <p>Thông báo cho user này: {userNotifications.length}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={createTestNotification}
              disabled={isCreating || !user}
            >
              Tạo thông báo test (UUID)
            </Button>
            <Button 
              onClick={createAdminNotification}
              disabled={isCreating}
              variant="outline"
            >
              Tạo thông báo test (admin)
            </Button>
            <Button 
              onClick={refreshNotifications}
              variant="secondary"
            >
              Refresh
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Lỗi:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Thông báo hiện tại:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{notification.user_id}</Badge>
                    <Badge variant={userNotifications.some(n => n.id === notification.id) ? "default" : "secondary"}>
                      {userNotifications.some(n => n.id === notification.id) ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </div>
                  <h4 className="font-medium">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{notification.type}</Badge>
                    <Badge variant="outline" className="text-xs">{notification.priority}</Badge>
                    <Badge variant="outline" className="text-xs">{notification.category}</Badge>
                    <Badge variant={notification.read ? "secondary" : "destructive"} className="text-xs">
                      {notification.read ? "Đã đọc" : "Chưa đọc"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
