'use client';

import { useContext } from 'react';
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  Target,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataContext } from '@/contexts/DataContext';

const kpiChartData = [
  { name: 'Jan', completed: 80 },
  { name: 'Feb', completed: 85 },
  { name: 'Mar', completed: 90 },
  { name: 'Apr', completed: 88 },
  { name: 'May', completed: 92 },
  { name: 'Jun', completed: 95 },
];


export default function AdminDashboardPage() {
  const { kpiRecords, employees, kpis } = useContext(DataContext);

  const pendingKpis = kpiRecords.filter(r => r.status === 'pending_approval').slice(0,3).map(record => {
    const employee = employees.find(e => e.id === record.employeeId);
    const kpi = kpis.find(k => k.id === record.kpiId);
    return {
        id: record.id,
        title: kpi?.name || 'N/A',
        assignee: employee?.name || 'N/A',
        status: 'Chờ duyệt',
    }
  });


  const totalKpis = kpiRecords.length;
  const pendingCount = kpiRecords.filter(r => r.status === 'pending_approval').length;
  const employeeCount = employees.length;
  const completedCount = kpiRecords.filter(r => r.status === 'completed').length;
  const completionRate = totalKpis > 0 ? (completedCount / totalKpis) * 100 : 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng KPI</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalKpis}</div>
              <p className="text-xs text-muted-foreground">+5 so với tháng trước</p>
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
                +3 so với tuần trước
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeCount}</div>
              <p className="text-xs text-muted-foreground">
                +1 so với quý trước
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tỷ lệ hoàn thành
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% so với tháng trước
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Tỷ lệ hoàn thành KPI</CardTitle>
              <CardDescription>
                Biểu đồ hoàn thành KPI trong 6 tháng gần nhất.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpiChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis unit="%" />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Thực hiện các tác vụ nhanh tại đây.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button asChild><Link href="/admin/kpis">Tạo KPI mới</Link></Button>
              <Button variant="outline" asChild><Link href="/admin/assign">Giao KPI</Link></Button>
              <Button variant="secondary" asChild><Link href="/admin/approval">Duyệt KPI</Link></Button>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>KPI chờ duyệt</CardTitle>
              <CardDescription>
                Danh sách các KPI đang chờ được phê duyệt.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/approval">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KPI</TableHead>
                  <TableHead>Tên KPI</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingKpis.map((kpi) => (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.id}</TableCell>
                    <TableCell>{kpi.title}</TableCell>
                    <TableCell>{kpi.assignee}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{kpi.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
