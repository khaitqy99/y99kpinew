'use client';

import { useContext, useMemo } from 'react';
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
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';

// Helper function to get month name in Vietnamese
const getMonthName = (monthIndex: number) => {
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  return months[monthIndex];
};

// Helper function to calculate completion rate for a month
const calculateMonthlyCompletionRate = (records: any[], targetMonth: number, targetYear: number) => {
  const monthRecords = records.filter(record => {
    // Try different date fields that might exist in the record
    const recordDate = new Date(record.created_at || record.createdAt || record.submission_date || record.submissionDate);
    
    // Skip invalid dates
    if (isNaN(recordDate.getTime())) return false;
    
    return recordDate.getMonth() === targetMonth && recordDate.getFullYear() === targetYear;
  });

  if (monthRecords.length === 0) return 0;

  const completedRecords = monthRecords.filter(record => 
    record.status === 'completed' || record.status === 'approved'
  );
  
  return Math.round((completedRecords.length / monthRecords.length) * 100);
};


export default function AdminDashboardPage() {
  const { kpiRecords, users, kpis, loading } = useContext(SupabaseDataContext);

  // Show loading state while data is being fetched
  if (loading.kpiRecords || loading.users || loading.kpis) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  // Ensure arrays are defined before using filter
  const safeKpiRecords = kpiRecords || [];
  const safeUsers = users || [];
  const safeKpis = kpis || [];

  // Calculate chart data from real KPI records
  const kpiChartData = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Get last 6 months
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      const completionRate = calculateMonthlyCompletionRate(safeKpiRecords, targetMonth, targetYear);
      
      chartData.push({
        name: getMonthName(targetMonth),
        completed: completionRate,
        month: targetMonth,
        year: targetYear,
        totalRecords: safeKpiRecords.filter(record => {
          const recordDate = new Date(record.created_at || record.createdAt || record.submission_date || record.submissionDate);
          return !isNaN(recordDate.getTime()) && 
                 recordDate.getMonth() === targetMonth && 
                 recordDate.getFullYear() === targetYear;
        }).length
      });
    }
    
    return chartData;
  }, [safeKpiRecords]);

  const pendingKpis = safeKpiRecords.filter(r => r.status === 'pending_approval').slice(0,3).map(record => {
    const employee = safeUsers.find(e => e.id === record.employee_id);
    const kpi = safeKpis.find(k => k.id === record.kpi_id);
    return {
        id: record.id,
        title: kpi?.name || 'N/A',
        assignee: employee?.name || 'N/A',
        status: 'Chờ duyệt',
    }
  });

  const totalKpis = safeKpiRecords.length;
  const pendingCount = safeKpiRecords.filter(r => r.status === 'pending_approval').length;
  const employeeCount = safeUsers.length;
  const completedCount = safeKpiRecords.filter(r => r.status === 'completed' || r.status === 'approved').length;
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
              <p className="text-xs text-muted-foreground">
                {safeKpis.length > 0 ? `${safeKpis.length} KPI được định nghĩa` : 'Chưa có KPI nào'}
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
                {pendingCount > 0 ? 'Cần được duyệt' : 'Không có KPI chờ duyệt'}
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
                {employeeCount > 0 ? 'Nhân viên trong hệ thống' : 'Chưa có nhân viên nào'}
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
                {completionRate > 0 ? `${completedCount}/${totalKpis} KPI hoàn thành` : 'Chưa có KPI nào hoàn thành'}
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
              {kpiChartData.length > 0 && kpiChartData.some(item => item.totalRecords > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpiChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      unit="%" 
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const totalRecords = props.payload.totalRecords;
                        return [
                          `${value}%`,
                          `Tỷ lệ hoàn thành (${totalRecords} KPI)`
                        ];
                      }}
                      labelFormatter={(label: string, payload: any[]) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${label} ${data.year}`;
                        }
                        return label;
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có dữ liệu KPI</p>
                    <p className="text-xs">Dữ liệu sẽ hiển thị khi có KPI được tạo</p>
                  </div>
                </div>
              )}
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
              <Button variant="outline" asChild><Link href="/admin/approval">Duyệt KPI</Link></Button>
              <Button variant="outline" asChild>
                <Link href="/settings">Tạo phòng ban</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings">Tạo nhân viên</Link>
              </Button>
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
                {pendingKpis.length > 0 ? (
                  pendingKpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell className="font-medium">{kpi.id}</TableCell>
                      <TableCell>{kpi.title}</TableCell>
                      <TableCell>{kpi.assignee}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{kpi.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-muted-foreground">Không có KPI nào chờ duyệt</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
