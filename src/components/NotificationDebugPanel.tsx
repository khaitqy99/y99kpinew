'use client';

import React, { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { SessionContext } from '@/contexts/SessionContext';

export function NotificationDebugPanel() {
  const { notifications, loading } = useContext(SupabaseDataContext);
  const { user } = useContext(SessionContext);

  if (loading.notifications) {
    return <div>Loading notifications...</div>;
  }

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
        <CardTitle>Debug: Thông báo hệ thống</CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>User hiện tại: {user?.name} ({user?.role}) - ID: {user?.id}</p>
          <p>Tổng số thông báo: {notifications.length}</p>
          <p>Thông báo cho user này: {userNotifications.length}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Tất cả thông báo trong hệ thống:</h3>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{notification.user_id}</Badge>
                    <Badge variant={notification.user_id === user?.id ? "default" : "secondary"}>
                      {notification.user_id === user?.id ? "Cá nhân" : 
                       notification.user_id === 'admin' ? "Admin" :
                       notification.user_id === 'employee' ? "Employee" :
                       notification.user_id === 'all' ? "Tất cả" : "Khác"}
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

          <div>
            <h3 className="font-semibold mb-2">Thông báo được hiển thị cho user hiện tại:</h3>
            <div className="space-y-2">
              {userNotifications.map((notification) => (
                <div key={notification.id} className="p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{notification.user_id}</Badge>
                    <Badge variant="default">Hiển thị</Badge>
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
