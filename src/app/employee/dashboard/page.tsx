'use client';

import {
  Bell,
  CheckCircle,
  Clock,
  FileCheck,
  MessageSquare,
  RefreshCw,
  Target,
  XCircle,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const kpiData = [
  {
    id: 'KPI-004',
    title: 'Hoàn thành báo cáo phân tích đối thủ cạnh tranh',
    progress: 75,
    status: 'Đang thực hiện',
    dueDate: '30/06/2024',
  },
  {
    id: 'KPI-005',
    title: 'Tăng 15% lượng khách hàng tiềm năng',
    progress: 40,
    status: 'Đang thực hiện',
    dueDate: '15/07/2024',
  },
  {
    id: 'KPI-006',
    title: 'Đạt chứng chỉ chuyên môn mới',
    progress: 100,
    status: 'Chờ duyệt',
    dueDate: '20/06/2024',
  },
  {
    id: 'KPI-007',
    title: 'Giảm 5% thời gian xử lý yêu cầu khách hàng',
    progress: 90,
    status: 'Hoàn thành',
    dueDate: '31/05/2024',
  },
];

const notifications = [
  {
    id: 1,
    user: 'Trưởng phòng Marketing',
    action: 'đã duyệt KPI của bạn:',
    target: 'Tăng trưởng doanh thu Q2.',
    time: '2 giờ trước',
    avatar: 'https://picsum.photos/seed/10/40/40',
  },
  {
    id: 2,
    user: 'Hệ thống',
    action: 'nhắc nhở: KPI',
    target: '"Hoàn thành báo cáo phân tích đối thủ" sắp đến hạn.',
    time: '1 ngày trước',
    avatar: 'https://picsum.photos/seed/11/40/40',
  },
  {
    id: 3,
    user: 'Lê Văn C',
    action: 'đã gửi một phản hồi về KPI:',
    target: '"Tối ưu hóa tỷ lệ chuyển đổi".',
    time: '3 ngày trước',
    avatar: 'https://picsum.photos/seed/12/40/40',
  },
];

export default function EmployeeDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                KPI Hoàn thành
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                trong tổng số 8 KPI được giao
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
              <div className="text-2xl font-bold">1</div>
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
              <div className="text-2xl font-bold text-destructive">0</div>
              <p className="text-xs text-muted-foreground">
                Hãy tiếp tục phát huy!
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
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
                      <Progress value={kpi.progress} className="w-full" />
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
                           <AvatarImage src={notification.avatar} alt="Avatar" />
                          <AvatarFallback>
                            {notification.user.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p>
                            <span className="font-semibold">
                              {notification.user}
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
