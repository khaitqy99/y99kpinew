'use client';

import React, { useState, useContext, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Target,
  Loader2,
  Users,
  Building,
  X,
  Search,
  Clock,
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
import type { Kpi, DailyKpiProgress } from '@/services/supabase-service';

export default function DailyKpiProgressPage() {
  const { toast } = useToast();
  const { 
    users, 
    departments, 
    kpis,
    addDailyKpiProgress, 
    editDailyKpiProgress, 
    deleteDailyKpiProgress, 
    dailyKpiProgress,
    loading: contextLoading
  } = useContext(SupabaseDataContext);
  
  const [loading, setLoading] = useState(false);
  const [isDailyFormOpen, setIsDailyFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Debug logging for real data
  React.useEffect(() => {
    console.log('Daily KPI Progress Data:', {
      users: users?.length || 0,
      departments: departments?.length || 0,
      kpis: kpis?.length || 0,
      dailyKpiProgress: dailyKpiProgress?.length || 0,
      contextLoading
    });
  }, [users, departments, kpis, dailyKpiProgress, contextLoading]);
  
  const [dailyFormData, setDailyFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    department: '',
    responsiblePerson: '',
    kpiName: '',
    actualResult: '',
    notes: '',
  });

  // Filter and search data
  const filteredProgress = dailyKpiProgress.filter(record => {
    const matchesSearch = 
      record.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.kpi_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || filterDepartment === 'all' || record.department_name === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Daily progress handlers
  const handleDailyFormSubmit = useCallback(async () => {
    // Validation
    if (!dailyFormData.date || !dailyFormData.department || !dailyFormData.responsiblePerson || 
        !dailyFormData.kpiName || !dailyFormData.actualResult) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ các trường bắt buộc."
      });
      return;
    }

    // Validate actual result is a valid number
    const actualResult = Number(dailyFormData.actualResult);
    if (isNaN(actualResult) || actualResult < 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Kết quả thực tế phải là số hợp lệ và không âm."
      });
      return;
    }

    setLoading(true);
    try {
      // Find related entities
      const selectedDepartment = departments.find(d => d.name === dailyFormData.department);
      const selectedEmployee = users.find(u => u.name === dailyFormData.responsiblePerson);
      const selectedKpi = kpis.find(k => k.name === dailyFormData.kpiName);

      // Validate that all required entities exist
      if (!selectedDepartment) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không tìm thấy phòng ban được chọn."
        });
        return;
      }

      if (!selectedEmployee) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không tìm thấy nhân viên được chọn."
        });
        return;
      }

      if (!selectedKpi) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không tìm thấy KPI được chọn."
        });
        return;
      }

      // Prepare data for insertion
      const progressData = {
        date: dailyFormData.date,
        department_id: selectedDepartment.id,
        department_name: dailyFormData.department,
        employee_id: selectedEmployee.id,
        responsible_person: dailyFormData.responsiblePerson,
        kpi_id: selectedKpi.id,
        kpi_name: dailyFormData.kpiName,
        actual_result: actualResult,
        notes: dailyFormData.notes || null,
        created_by: null, // Will be set by current user context
        is_active: true,
      };

      console.log('Submitting daily KPI progress:', progressData);
      await addDailyKpiProgress(progressData);
      
      toast({
        title: 'Thành công',
        description: 'Đã thêm tiến độ hàng ngày mới.'
      });

      // Reset form
      setDailyFormData({
        date: new Date().toISOString().split('T')[0],
        department: '',
        responsiblePerson: '',
        kpiName: '',
        actualResult: '',
        notes: '',
      });
      setIsDailyFormOpen(false);
    } catch (error: any) {
      console.error('Error submitting daily KPI progress:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể lưu tiến độ hàng ngày'
      });
    } finally {
      setLoading(false);
    }
  }, [dailyFormData, departments, users, kpis, addDailyKpiProgress, toast]);

  const handleEditDailyRecord = useCallback((record: DailyKpiProgress) => {
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

  // Show loading state if context is still loading
  if (contextLoading.dailyKpiProgress || contextLoading.users || contextLoading.departments || contextLoading.kpis) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Nhập tiến độ</CardTitle>
                <CardDescription>
                  Thêm bản ghi tiến độ KPI mới
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isDailyFormOpen ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Chưa có form nhập</p>
                    <Button 
                      onClick={() => setIsDailyFormOpen(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Bắt đầu nhập
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium">Ngày *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={dailyFormData.date}
                          onChange={(e) => setDailyFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-medium">Bộ phận *</Label>
                        <Select 
                          value={dailyFormData.department} 
                          onValueChange={(value) => setDailyFormData(prev => ({ ...prev, department: value }))}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

                      <div className="space-y-2">
                        <Label htmlFor="responsiblePerson" className="text-sm font-medium">Người chịu trách nhiệm *</Label>
                        <Select 
                          value={dailyFormData.responsiblePerson} 
                          onValueChange={(value) => setDailyFormData(prev => ({ ...prev, responsiblePerson: value }))}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                        <Label htmlFor="kpiName" className="text-sm font-medium">Tên KPI *</Label>
                        <Select 
                          value={dailyFormData.kpiName} 
                          onValueChange={(value) => setDailyFormData(prev => ({ ...prev, kpiName: value }))}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

                      <div className="space-y-2">
                        <Label htmlFor="actualResult" className="text-sm font-medium">Kết quả thực tế *</Label>
                        <Input
                          id="actualResult"
                          type="number"
                          value={dailyFormData.actualResult}
                          onChange={(e) => setDailyFormData(prev => ({ ...prev, actualResult: e.target.value }))}
                          placeholder="Nhập kết quả thực tế"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">Ghi chú</Label>
                        <Textarea
                          id="notes"
                          value={dailyFormData.notes}
                          onChange={(e) => setDailyFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Ghi chú về tiến độ thực hiện..."
                          rows={3}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleDailyFormSubmit} 
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Records Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Bản ghi tiến độ</CardTitle>
                    <CardDescription>
                      Danh sách các bản ghi tiến độ hàng ngày
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger className="w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Lọc theo phòng ban" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả phòng ban</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="font-semibold text-gray-700">Ngày</TableHead>
                        <TableHead className="font-semibold text-gray-700">Bộ phận</TableHead>
                        <TableHead className="font-semibold text-gray-700">Người chịu trách nhiệm</TableHead>
                        <TableHead className="font-semibold text-gray-700">KPI</TableHead>
                        <TableHead className="font-semibold text-gray-700">Kết quả</TableHead>
                        <TableHead className="font-semibold text-gray-700">Ghi chú</TableHead>
                        <TableHead className="font-semibold text-gray-700">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProgress.length > 0 ? filteredProgress.map((record: DailyKpiProgress) => {
                        // Safe date parsing
                        const recordDate = record.date ? new Date(record.date) : new Date();
                        const isValidDate = !isNaN(recordDate.getTime());
                        
                        return (
                          <TableRow key={record.id} className="border-gray-100 hover:bg-gray-50/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {isValidDate ? recordDate.toLocaleDateString('vi-VN') : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{record.department_name || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{record.responsible_person || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{record.kpi_name || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold">
                                {typeof record.actual_result === 'number' ? record.actual_result : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate text-sm text-gray-600">
                                {record.notes || '-'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditDailyRecord(record)}
                                  className="h-8 w-8 p-0 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteDailyRecord(record.id)}
                                  className="h-8 w-8 p-0 border-gray-300 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <Clock className="h-12 w-12 text-gray-400 mb-4" />
                              <p className="text-gray-500 font-medium">Chưa có bản ghi tiến độ</p>
                              <p className="text-sm text-gray-400 mt-1">Thêm tiến độ mới để bắt đầu</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}