'use client';

import React, { useState, useContext, useMemo, useCallback } from 'react';
import {
  Calendar,
  TrendingUp,
  Plus,
  Edit,
  Eye,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Building,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { formatDateToLocal } from '@/lib/utils';
import { getPeriodLabel } from '@/lib/period-utils';
import type { Kpi, KpiRecord } from '@/services/supabase-service';

// Lazy load components
const KpiProgressDialog = React.lazy(() => import('./KpiProgressDialog'));
const KpiProgressChart = React.lazy(() => import('./KpiProgressChart'));

interface DailyProgressRecord {
  id: string;
  date: string;
  department: string;
  responsiblePerson: string;
  kpiName: string;
  actualResult: number;
  notes: string;
  createdAt: string;
}

interface KpiProgressTabProps {
  kpis: Kpi[];
}

const KpiProgressTab: React.FC<KpiProgressTabProps> = ({ kpis }) => {
  const { toast } = useToast();
  const { users, departments, addDailyKpiProgress, editDailyKpiProgress, deleteDailyKpiProgress, dailyKpiProgress } = useContext(SupabaseDataContext);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [isProgressDialogOpen, setProgressDialogOpen] = useState(false);
  const [isChartOpen, setChartOpen] = useState(false);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Daily progress form state
  const [isDailyFormOpen, setIsDailyFormOpen] = useState(false);
  const [dailyFormData, setDailyFormData] = useState({
    date: formatDateToLocal(new Date()),
    department: '',
    responsiblePerson: '',
    kpiName: '',
    actualResult: '',
    notes: '',
  });

  // Mock data for demonstration - replace with actual API calls
  const mockKpiRecords: KpiRecord[] = useMemo(() => [
    {
      id: '1',
      kpi_id: kpis[0]?.id || '',
      employee_id: 'emp1',
      department_id: 'dept1',
      period: '2024-01',
      target: 100,
      actual: 85,
      progress: 85,
      status: 'in_progress',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      submission_date: '2024-01-15T10:00:00Z',
      submission_details: 'Tiến độ tốt, đạt 85% mục tiêu',
      feedback: [],
      bonus_amount: 500000,
      penalty_amount: 0,
      score: 85,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      last_updated: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      kpi_id: kpis[1]?.id || '',
      employee_id: 'emp2',
      department_id: 'dept2',
      period: '2024-01',
      target: 50,
      actual: 60,
      progress: 120,
      status: 'completed',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      submission_date: '2024-01-20T14:30:00Z',
      approval_date: '2024-01-21T09:00:00Z',
      approved_by: 'admin',
      submission_details: 'Vượt mục tiêu 20%',
      feedback: [],
      bonus_amount: 1000000,
      penalty_amount: 0,
      score: 120,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-21T09:00:00Z',
      last_updated: '2024-01-21T09:00:00Z',
    },
  ], [kpis]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not_started': { variant: 'secondary' as const, label: 'Chưa bắt đầu', icon: Clock },
      'in_progress': { variant: 'default' as const, label: 'Đang thực hiện', icon: TrendingUp },
      'completed': { variant: 'default' as const, label: 'Hoàn thành', icon: CheckCircle },
      'pending_approval': { variant: 'outline' as const, label: 'Chờ duyệt', icon: Clock },
      'approved': { variant: 'default' as const, label: 'Đã duyệt', icon: CheckCircle },
      'rejected': { variant: 'destructive' as const, label: 'Từ chối', icon: AlertCircle },
      'overdue': { variant: 'destructive' as const, label: 'Quá hạn', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-blue-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleAddProgress = useCallback((kpi: Kpi) => {
    setSelectedKpi(kpi);
    setProgressDialogOpen(true);
  }, []);

  const handleViewChart = useCallback((kpi: Kpi) => {
    setSelectedKpi(kpi);
    setChartOpen(true);
  }, []);

  const handleViewDetails = useCallback((record: KpiRecord) => {
    // TODO: Implement view details functionality
    toast({
      title: 'Chi tiết KPI',
      description: `Xem chi tiết bản ghi ${record.id}`,
    });
  }, [toast]);

  const handleEditProgress = useCallback((record: KpiRecord) => {
    // TODO: Implement edit progress functionality
    toast({
      title: 'Chỉnh sửa tiến độ',
      description: `Chỉnh sửa bản ghi ${record.id}`,
    });
  }, [toast]);

  // Daily progress handlers
  const handleDailyFormSubmit = useCallback(async () => {
    if (!dailyFormData.date || !dailyFormData.department || !dailyFormData.responsiblePerson || 
        !dailyFormData.kpiName || !dailyFormData.actualResult) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ các trường bắt buộc."
      });
      return;
    }

    setLoading(true);
    try {
      // Find the selected department and employee
      const selectedDepartment = departments.find(d => d.name === dailyFormData.department);
      const selectedEmployee = users.find(u => u.name === dailyFormData.responsiblePerson);
      const selectedKpi = kpis.find(k => k.name === dailyFormData.kpiName);

      const progressData = {
        date: dailyFormData.date,
        department_id: selectedDepartment?.id || null,
        department_name: dailyFormData.department,
        employee_id: selectedEmployee?.id || null,
        responsible_person: dailyFormData.responsiblePerson,
        kpi_id: selectedKpi?.id || null,
        kpi_name: dailyFormData.kpiName,
        actual_result: Number(dailyFormData.actualResult),
        notes: dailyFormData.notes || null,
        created_by: null, // Will be set by current user context
        is_active: true,
      };

      await addDailyKpiProgress(progressData as any);
      
      toast({
        title: 'Thành công',
        description: 'Đã thêm tiến độ hàng ngày mới.'
      });

      // Reset form
      setDailyFormData({
        date: formatDateToLocal(new Date()),
        department: '',
        responsiblePerson: '',
        kpiName: '',
        actualResult: '',
        notes: '',
      });
      setIsDailyFormOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể lưu tiến độ hàng ngày'
      });
    } finally {
      setLoading(false);
    }
  }, [dailyFormData, departments, users, kpis, addDailyKpiProgress, toast]);

  const handleEditDailyRecord = useCallback((record: any) => {
    setDailyFormData({
      date: record.date,
      department: record.department_name,
      responsiblePerson: record.responsible_person,
      kpiName: record.kpi_name,
      actualResult: String(record.actual_result),
      notes: record.notes || '',
    });
    setIsDailyFormOpen(true);
  }, []);

  const handleDeleteDailyRecord = useCallback(async (recordId: string) => {
    try {
      await deleteDailyKpiProgress(recordId);
      toast({
        title: 'Đã xóa',
        description: 'Đã xóa bản ghi tiến độ hàng ngày.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể xóa bản ghi tiến độ'
      });
    }
  }, [deleteDailyKpiProgress, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quản lý tiến độ KPI hàng ngày
          </CardTitle>
          <CardDescription>
            Theo dõi và cập nhật tiến độ thực hiện các KPI theo thời gian thực
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Tiến độ hàng ngày</TabsTrigger>
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="records">Bản ghi tiến độ</TabsTrigger>
              <TabsTrigger value="analytics">Phân tích</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Nhập tiến độ KPI hàng ngày</h3>
                  <p className="text-sm text-muted-foreground">
                    Nhập số liệu KPI theo ngày để theo dõi tiến độ thực hiện
                  </p>
                </div>
                <Button onClick={() => setIsDailyFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm tiến độ ngày
                </Button>
              </div>

              {/* Daily Progress Form */}
              {isDailyFormOpen && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nhập tiến độ KPI hàng ngày</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Ngày *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={dailyFormData.date}
                          onChange={(e) => setDailyFormData(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Bộ phận *</Label>
                        <Select 
                          value={dailyFormData.department} 
                          onValueChange={(value) => setDailyFormData(prev => ({ ...prev, department: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn bộ phận" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.name}>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  {dept.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="responsiblePerson">Người chịu trách nhiệm *</Label>
                        <Select 
                          value={dailyFormData.responsiblePerson} 
                          onValueChange={(value) => setDailyFormData(prev => ({ ...prev, responsiblePerson: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn người chịu trách nhiệm" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.name}>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {user.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kpiName">Tên KPI *</Label>
                        <Select 
                          value={dailyFormData.kpiName} 
                          onValueChange={(value) => setDailyFormData(prev => ({ ...prev, kpiName: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn KPI" />
                          </SelectTrigger>
                          <SelectContent>
                            {kpis.map(kpi => (
                              <SelectItem key={kpi.id} value={kpi.name}>
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  {kpi.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actualResult">Kết quả thực tế *</Label>
                      <Input
                        id="actualResult"
                        type="number"
                        value={dailyFormData.actualResult}
                        onChange={(e) => setDailyFormData(prev => ({ ...prev, actualResult: e.target.value }))}
                        placeholder="Nhập kết quả thực tế"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú</Label>
                      <Textarea
                        id="notes"
                        value={dailyFormData.notes}
                        onChange={(e) => setDailyFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ghi chú về tiến độ thực hiện..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleDailyFormSubmit} 
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Lưu tiến độ
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDailyFormOpen(false)}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Progress Records Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Bản ghi tiến độ hàng ngày</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Bộ phận</TableHead>
                        <TableHead>Người chịu trách nhiệm</TableHead>
                        <TableHead>Tên KPI</TableHead>
                        <TableHead>Kết quả thực tế</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyKpiProgress.length > 0 ? dailyKpiProgress.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {new Date(record.date).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {record.department_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {record.responsible_person}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              {record.kpi_name}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.actual_result}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.notes || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditDailyRecord(record)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDailyRecord(record.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            <div className="flex flex-col items-center justify-center">
                              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">Chưa có bản ghi tiến độ hàng ngày</p>
                              <p className="text-sm text-muted-foreground">Thêm tiến độ mới để bắt đầu</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi) => {
                  const records = mockKpiRecords.filter(r => r.kpi_id === kpi.id);
                  const latestRecord = records[records.length - 1];
                  const avgProgress = records.length > 0 
                    ? records.reduce((sum, r) => sum + r.progress, 0) / records.length 
                    : 0;

                  return (
                    <Card key={kpi.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {kpi.department} • {kpi.frequency}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddProgress(kpi)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewChart(kpi)}
                              className="h-6 w-6 p-0"
                            >
                              <BarChart3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Mục tiêu:</span>
                            <span className="font-medium">{kpi.target}{kpi.unit}</span>
                          </div>
                          
                          {latestRecord && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Tiến độ hiện tại:</span>
                                  <span className="font-medium">{latestRecord.progress}%</span>
                                </div>
                                <Progress 
                                  value={latestRecord.progress} 
                                  className="h-2"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                {getStatusBadge(latestRecord.status)}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(latestRecord.last_updated).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </>
                          )}

                          {!latestRecord && (
                            <div className="text-center py-4">
                              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Chưa có tiến độ</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddProgress(kpi)}
                                className="mt-2"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Thêm tiến độ
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Bản ghi tiến độ KPI</h3>
                <Button onClick={() => setProgressDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm tiến độ mới
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead>Kỳ</TableHead>
                    <TableHead>Mục tiêu</TableHead>
                    <TableHead>Thực tế</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockKpiRecords.map((record) => {
                    const kpi = kpis.find(k => k.id === record.kpi_id);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {kpi?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{kpi?.department || 'N/A'}</TableCell>
                        <TableCell>{getPeriodLabel(record.period)}</TableCell>
                        <TableCell>{record.target}{kpi?.unit || ''}</TableCell>
                        <TableCell>{record.actual}{kpi?.unit || ''}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={record.progress} className="w-16 h-2" />
                            <span className="text-sm font-medium">{record.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(record.last_updated).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(record)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProgress(record)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Thống kê tổng quan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tổng số KPI:</span>
                        <span className="font-medium">{kpis.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">KPI đang thực hiện:</span>
                        <span className="font-medium">
                          {mockKpiRecords.filter(r => r.status === 'in_progress').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">KPI hoàn thành:</span>
                        <span className="font-medium">
                          {mockKpiRecords.filter(r => r.status === 'completed').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tiến độ trung bình:</span>
                        <span className="font-medium">
                          {mockKpiRecords.length > 0 
                            ? Math.round(mockKpiRecords.reduce((sum, r) => sum + r.progress, 0) / mockKpiRecords.length)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Biểu đồ tiến độ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Biểu đồ sẽ được hiển thị ở đây</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Dialog */}
      <React.Suspense fallback={<div>Loading...</div>}>
        <KpiProgressDialog
          open={isProgressDialogOpen}
          onOpenChange={setProgressDialogOpen}
          kpi={selectedKpi}
        />
      </React.Suspense>

      {/* Chart Dialog */}
      <React.Suspense fallback={<div>Loading...</div>}>
        <KpiProgressChart
          open={isChartOpen}
          onOpenChange={setChartOpen}
          kpi={selectedKpi}
        />
      </React.Suspense>
    </div>
  );
};

export default KpiProgressTab;
