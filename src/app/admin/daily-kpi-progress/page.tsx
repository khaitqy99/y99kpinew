'use client';

import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Target,
  Loader2,
  Users,
  Building,
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatDateToLocal, cn } from '@/lib/utils';
import type { Kpi, DailyKpiProgress } from '@/services/supabase-service';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<DailyKpiProgress | null>(null);

  // Date range filter states
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);

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
    date: formatDateToLocal(new Date()),
    department: '',
    responsiblePerson: '',
    kpiName: '',
    actualResult: '',
    notes: '',
  });

  // Filter data
  const filteredProgress = (dailyKpiProgress || []).filter(record => {
    const matchesDepartment = !filterDepartment || filterDepartment === 'all' || record.department_name === filterDepartment;
    
    // Filter by employee
    const matchesEmployee = !filterEmployee || filterEmployee === 'all' || 
      record.employee_id?.toString() === filterEmployee;
    
    // Filter by date range if selected
    let matchesDateRange = true;
    if (filterStartDate || filterEndDate) {
      const recordDate = record.date ? new Date(record.date) : null;
      if (recordDate && !isNaN(recordDate.getTime())) {
        const checkDate = new Date(recordDate);
        checkDate.setHours(0, 0, 0, 0);
        
        const filterStart = filterStartDate ? new Date(filterStartDate) : null;
        const filterEnd = filterEndDate ? new Date(filterEndDate) : null;
        
        if (filterStart) {
          filterStart.setHours(0, 0, 0, 0);
        }
        if (filterEnd) {
          filterEnd.setHours(23, 59, 59, 999);
        }
        
        if (filterStart && filterEnd) {
          matchesDateRange = checkDate >= filterStart && checkDate <= filterEnd;
        } else if (filterStart) {
          matchesDateRange = checkDate >= filterStart;
        } else if (filterEnd) {
          matchesDateRange = checkDate <= filterEnd;
        }
      } else {
        matchesDateRange = false;
      }
    }
    
    return matchesDepartment && matchesEmployee && matchesDateRange;
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
        date: formatDateToLocal(new Date()),
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

  const handleDeleteDailyRecord = useCallback((recordId: string) => {
    const record = (dailyKpiProgress || []).find(r => r.id === recordId);
    if (record) {
      setRecordToDelete(record);
      setIsDeleteDialogOpen(true);
    }
  }, [dailyKpiProgress]);

  const confirmDeleteDailyRecord = useCallback(async () => {
    if (!recordToDelete) return;
    
    try {
      await deleteDailyKpiProgress(recordToDelete.id);
      toast({
        title: 'Đã xóa',
        description: 'Đã xóa bản ghi tiến độ hàng ngày.'
      });
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể xóa bản ghi tiến độ'
      });
    }
  }, [recordToDelete, deleteDailyKpiProgress, toast]);

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
      {/* Records Section */}
      <div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Bản ghi tiến độ</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
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
                    <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                      <SelectTrigger className="w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Lọc theo nhân viên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhân viên</SelectItem>
                        {users && users.length > 0 ? users.filter((user: any) => {
                          // Filter out admins (level >= 4)
                          const level = user.level || user.roles?.level || 0;
                          return level < 4;
                        }).map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-users" disabled>Chưa có nhân viên</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="filter-start-date"
                            variant={'outline'}
                            className={cn(
                              'w-[140px] justify-start text-left font-normal',
                              !filterStartDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterStartDate ? (
                              format(filterStartDate, 'dd/MM/yyyy')
                            ) : (
                              <span>Từ ngày</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            initialFocus
                            mode="single"
                            defaultMonth={filterStartDate}
                            selected={filterStartDate}
                            onSelect={setFilterStartDate}
                            numberOfMonths={1}
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="filter-end-date"
                            variant={'outline'}
                            className={cn(
                              'w-[140px] justify-start text-left font-normal',
                              !filterEndDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterEndDate ? (
                              format(filterEndDate, 'dd/MM/yyyy')
                            ) : (
                              <span>Đến ngày</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            initialFocus
                            mode="single"
                            defaultMonth={filterEndDate}
                            selected={filterEndDate}
                            onSelect={setFilterEndDate}
                            numberOfMonths={1}
                            disabled={(date) => filterStartDate ? date < filterStartDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                      {(filterStartDate || filterEndDate) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFilterStartDate(undefined);
                            setFilterEndDate(undefined);
                          }}
                          className="h-8 px-2"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                    {(filterStartDate || filterEndDate || filterDepartment !== 'all' || filterEmployee !== 'all') && (
                      <div className="text-sm text-muted-foreground">
                        Hiển thị {filteredProgress.length} bản ghi
                        {filterDepartment !== 'all' && ` - ${filterDepartment}`}
                        {filterEmployee !== 'all' && (() => {
                          const employeeName = users.find((e: any) => e.id?.toString() === filterEmployee)?.name || '';
                          return employeeName ? ` - ${employeeName}` : '';
                        })()}
                        {filterStartDate && filterEndDate && ` - ${format(filterStartDate, 'dd/MM/yyyy')} đến ${format(filterEndDate, 'dd/MM/yyyy')}`}
                        {filterStartDate && !filterEndDate && ` - Từ ${format(filterStartDate, 'dd/MM/yyyy')}`}
                        {!filterStartDate && filterEndDate && ` - Đến ${format(filterEndDate, 'dd/MM/yyyy')}`}
                      </div>
                    )}
                    <Button 
                      onClick={() => {
                        setDailyFormData({
                          date: formatDateToLocal(new Date()),
                          department: '',
                          responsiblePerson: '',
                          kpiName: '',
                          actualResult: '',
                          notes: '',
                        });
                        setIsDailyFormOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm tiến độ
                    </Button>
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
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
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

      {/* Dialog for adding/editing progress */}
      <Dialog open={isDailyFormOpen} onOpenChange={setIsDailyFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {dailyFormData.kpiName ? 'Sửa tiến độ' : 'Thêm tiến độ'}
            </DialogTitle>
            <DialogDescription>
              {dailyFormData.kpiName ? 'Cập nhật thông tin tiến độ KPI' : 'Thêm bản ghi tiến độ KPI mới'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                    {users.filter((user: any) => {
                      // Filter out admins (level >= 4)
                      const level = user.level || user.roles?.level || 0;
                      return level < 4;
                    }).map(user => (
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
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDailyFormOpen(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleDailyFormSubmit} 
              disabled={loading}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bản ghi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bản ghi tiến độ hàng ngày này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDailyRecord} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}