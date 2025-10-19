'use client';

import React, { useContext } from 'react';
import {
  CheckCircle,
  Clock,
  FileCheck,
  MessageSquare,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { kpiRecords } from '@/data/kpiRecords';
import { kpis } from '@/data/kpis';
import { notifications as mockNotifications } from '@/data/notifications';
import { SessionContext } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function EmployeeDashboardPage() {
  const { user } = useContext(SessionContext);
  
  const employeeKpiRecords = kpiRecords.filter(r => r.employeeId === user?.id);

  const kpiData = employeeKpiRecords.map(record => {
    const kpi = kpis.find(k => k.id === record.kpiId);
    const progress = record.target > 0 ? Math.round((record.actual / record.target) * 100) : 0;
    return {
        ...record,
        title: kpi?.name || 'N/A',
        progress: progress > 100 ? 100 : progress,
        dueDate: new Date(record.endDate).toLocaleDateString('vi-VN'),
    }
  });

  const completedCount = employeeKpiRecords.filter(r => r.status === 'completed').length;
  const pendingCount = employeeKpiRecords.filter(r => r.status === 'pending_approval').length;
  const overdueCount = employeeKpiRecords.filter(r => r.status === 'overdue').length;
  const totalCount = employeeKpiRecords.length;
  
  const notifications = mockNotifications.filter(n => n.recipientId === user?.id || n.recipientId === 'all');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                KPI Hoàn thành
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">
                trong tổng số {totalCount} KPI được giao
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đang chờ duyệt
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                KPI đã được nộp
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
              <p className="text-xs text-muted-foreground">
                Hãy tiếp tục phát huy!
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>KPI Cá Nhân</CardTitle>
                <CardDescription>
                  Theo dõi tiến độ và quản lý các KPI của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {kpiData.map((kpi) => (
                  <div key={kpi.id}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{kpi.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        Hạn chót: {kpi.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={kpi.progress} className="h-2" />
                      <span className="text-lg font-bold w-16 text-right">
                        {kpi.progress}%
                      </span>
                    </div>
                     <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-4 w-4" /> Cập nhật tiến độ
                        </Button>
                        <Button variant="secondary" size="sm" disabled={kpi.progress < 100}>
                          <FileCheck className="mr-2 h-4 w-4" /> Nộp KPI
                        </Button>
                         <Button variant="ghost" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" /> Xem Feedback
                        </Button>
                      </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Thông báo</CardTitle>
                <CardDescription>
                  Các cập nhật và phản hồi gần đây.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-8 w-8 border">
                           <AvatarImage src={notification.actor.avatar} alt="Avatar" />
                          <AvatarFallback>
                            {notification.actor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p>
                            <span className="font-semibold">
                              {notification.actor.name}
                            </span>{' '}
                            {notification.action}{' '}
                            <span className="font-medium text-primary">
                              {notification.target}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
