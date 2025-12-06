'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDown, Plus, Trash2, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

import { cn, formatDateToLocal } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { type KpiRecord } from '@/services/supabase-service';

const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  not_started: { label: 'Chưa bắt đầu', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  overdue: { label: 'Quá hạn', variant: 'destructive' },
  pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
  approved: { label: 'Đã duyệt', variant: 'default' },
  rejected: { label: 'Từ chối', variant: 'destructive' },
};

type AssignedKpiDetails = KpiRecord & {
    employeeName?: string;
    employeeAvatar?: string;
    departmentName?: string;
    kpiName: string;
    kpiDescription: string;
    kpiUnit: string;
    kpiRewardPenalty: string;
    completionPercentage: number;
    assignmentType: 'employee' | 'department';
}


export default function AssignKpiPage() {
  const { toast } = useToast();
  const { users, kpis, kpiRecords, assignKpi, departments, deleteKpiRecord } = React.useContext(SupabaseDataContext);

  // Ensure arrays are always defined
  const safeUsers = users || [];
  const safeKpis = kpis || [];
  const safeKpiRecords = kpiRecords || [];
  const safeDepartments = departments || [];

  const [assignmentType, setAssignmentType] = React.useState<'employee' | 'department'>('employee');
  const [selectedEmployee, setSelectedEmployee] = React.useState(safeUsers[0] || null);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState('');
  const [selectedKpis, setSelectedKpis] = React.useState<any[]>([]);
  // Period will be calculated automatically from date range
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 30))
  );
  
  const [isDetailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<AssignedKpiDetails | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [recordToCancel, setRecordToCancel] = React.useState<AssignedKpiDetails | null>(null);

  // Date range filter states (similar to assign dialog)
  const [filterStartDate, setFilterStartDate] = React.useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = React.useState<Date | undefined>(undefined);
  
  // State to control KPI selection Dialog
  const [isKpiDialogOpen, setIsKpiDialogOpen] = React.useState(false);
  
  // State to control date picker Popovers
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = React.useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = React.useState(false);

  // Calculate period from date range (format: yyyy-MM-dd to yyyy-MM-dd)
  const calculatePeriodFromDate = (startDate: Date, endDate: Date): string => {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  };

  const getAssignedKpis = (records: any[]): AssignedKpiDetails[] => {
    if (!records || records.length === 0) return [];
    
    let filteredRecords = records;
    
    // Filter by employee if selected
    if (filterEmployeeId && filterEmployeeId !== 'all') {
      filteredRecords = filteredRecords.filter(record => 
        record.employee_id === filterEmployeeId
      );
    }
    
    // Filter by status if selected
    if (filterStatus && filterStatus !== 'all') {
      filteredRecords = filteredRecords.filter(record => 
        record.status === filterStatus
      );
    }
    
    // Filter by date range if selected
    if (filterStartDate || filterEndDate) {
      filteredRecords = filteredRecords.filter(record => {
        if (!record.start_date || !record.end_date) return false;
        
        const recordStartDate = new Date(record.start_date);
        const recordEndDate = new Date(record.end_date);
        
        // Check if record overlaps with filter date range
        const filterStart = filterStartDate ? new Date(filterStartDate) : null;
        const filterEnd = filterEndDate ? new Date(filterEndDate) : null;
        
        if (filterStart && filterEnd) {
          // Both dates selected: record must overlap with filter range
          return (recordStartDate <= filterEnd && recordEndDate >= filterStart);
        } else if (filterStart) {
          // Only start date: record must end after filter start
          return recordEndDate >= filterStart;
        } else if (filterEnd) {
          // Only end date: record must start before filter end
          return recordStartDate <= filterEnd;
        }
        
        return true;
      });
    }
    
    return filteredRecords.map(record => {
        const employee = safeUsers.find(e => e.id === record.employee_id);
        const kpi = safeKpis.find(k => k.id === record.kpi_id);
        const actualValue = typeof record.actual === 'number' ? record.actual : 0;
        const completion = record.target > 0 ? Math.round((actualValue / record.target) * 100) : 0;
        
        // Determine assignment type based on whether employee_id exists
        const assignmentType = record.employee_id ? 'employee' : 'department';
        
        // Destructure to avoid including nested objects that might cause rendering issues
        const { kpis: kpiRelation, ...restRecord } = record;
        
        return {
            ...restRecord,
            employeeName: employee?.name || 'N/A',
            employeeAvatar: employee?.avatar || '',
            departmentName: safeDepartments.find((d: any) => d.id === record.department_id)?.name || 'N/A',
            kpiName: kpi?.name || 'N/A',
            kpiDescription: kpi?.description || '',
            kpiUnit: kpi?.unit || '',
            kpiRewardPenalty: typeof kpi?.reward_penalty_config === 'string' 
                ? kpi.reward_penalty_config 
                : JSON.stringify(kpi?.reward_penalty_config || {}),
            completionPercentage: completion > 100 ? 100 : completion,
            assignmentType
        };
    }).sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  };

  const assignedKpis = React.useMemo(() => getAssignedKpis(safeKpiRecords), [safeKpiRecords, filterEmployeeId, filterStatus, filterStartDate, filterEndDate, safeUsers, safeKpis, safeDepartments]);

  
  // Lọc KPI theo phòng ban khi chọn phòng ban hoặc nhân viên
  const filteredKpis = React.useMemo(() => {
    if (assignmentType === 'department' && selectedDepartmentId) {
      // Khi chọn phòng ban, chỉ hiển thị KPI của phòng ban đó
      return safeKpis.filter((kpi: any) => 
        Number(kpi.department_id) === Number(selectedDepartmentId)
      );
    } else if (assignmentType === 'employee' && selectedEmployee) {
      // Khi chọn nhân viên, chỉ hiển thị KPI của phòng ban nhân viên đó
      return safeKpis.filter((kpi: any) => 
        Number(kpi.department_id) === Number(selectedEmployee?.department_id)
      );
    }
    // Chưa chọn hoặc chưa chọn phòng ban/nhân viên, hiển thị tất cả
    return safeKpis;
  }, [assignmentType, selectedDepartmentId, selectedEmployee, safeKpis]);

  // Reset selectedKpis nếu KPI đã chọn không còn trong danh sách đã lọc
  React.useEffect(() => {
    setSelectedKpis(prev => prev.filter(kpi => 
      filteredKpis.find((fKpi: any) => fKpi.id === kpi.id)
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredKpis]);
  
  const handleAssignKpi = async () => {
    if (selectedKpis.length === 0 || !startDate || !endDate) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: 'Vui lòng chọn ít nhất một KPI và điền đầy đủ thông tin để giao KPI.'
        });
        return;
    }

    if (assignmentType === 'employee' && !selectedEmployee) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: 'Vui lòng chọn nhân viên.'
        });
        return;
    }

    if (assignmentType === 'department' && !selectedDepartmentId) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: 'Vui lòng chọn phòng ban.'
        });
        return;
    }

    // TypeScript type guard: at this point startDate and endDate are guaranteed to be defined
    const startDateValue = startDate;
    const endDateValue = endDate;

    // Xác định trạng thái dựa trên start_date
    // Nếu start_date <= hôm nay thì là 'in_progress', nếu > hôm nay thì là 'not_started'
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time về 00:00:00 để so sánh ngày
    
    const startDateObj = new Date(startDateValue);
    startDateObj.setHours(0, 0, 0, 0);
    
    const initialStatus = startDateObj <= today ? 'in_progress' : 'not_started';

    try {
        if (assignmentType === 'department') {
            // Lấy danh sách nhân viên trong phòng ban (exclude admins - level >= 4)
            const departmentIdNum = Number(selectedDepartmentId);
            const departmentEmployees = safeUsers.filter((emp: any) => {
              const level = emp.level || emp.roles?.level || 0;
              return level < 4;
            }).filter((emp: any) => 
                Number(emp.department_id) === departmentIdNum
            );

            if (departmentEmployees.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Lỗi!',
                    description: 'Phòng ban này chưa có nhân viên nào.'
                });
                return;
            }

            // Tạo KPI record cho từng nhân viên trong phòng ban với tất cả KPI đã chọn
            const departmentName = safeDepartments.find((d: any) => d.id === selectedDepartmentId)?.name || 'phòng ban';
            
            // Prepare all records first - for each employee and each selected KPI
            const recordsToCreate: any[] = [];
            departmentEmployees.forEach(employee => {
                selectedKpis.forEach(kpi => {
                    recordsToCreate.push({
                        kpi_id: kpi.id,
                        employee_id: employee.id,
                        department_id: null,
                        period: calculatePeriodFromDate(startDateValue, endDateValue),
                        target: kpi.target,
                        actual: 0,
                        progress: 0,
                        status: initialStatus,
                        start_date: formatDateToLocal(startDateValue),
                        end_date: formatDateToLocal(endDateValue),
                        submission_details: '',
                        attachment: null,
                        bonus_amount: null,
                        penalty_amount: null,
                        score: null,
                        is_active: true,
                    });
                });
            });

            // Use batch operation with better error handling
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            // Validate all records before attempting inserts
            for (let i = 0; i < recordsToCreate.length; i++) {
                const record = recordsToCreate[i];
                try {
                    // Pre-validate - check for duplicates
                    const { data: existing } = await fetch(`/api/check-kpi-duplicate?kpi_id=${record.kpi_id}&employee_id=${record.employee_id}&period=${record.period}`)
                        .then(r => r.json())
                        .catch(() => ({ data: null }));
                    
                    if (existing?.exists) {
                        const employee = departmentEmployees.find((e: any) => e.id === record.employee_id);
                        const kpi = selectedKpis.find((k: any) => k.id === record.kpi_id);
                        errors.push(`Nhân viên ${employee?.name || 'N/A'}: KPI "${kpi?.name || 'N/A'}" đã được giao trong kỳ ${calculatePeriodFromDate(startDateValue, endDateValue)}`);
                        errorCount++;
                        continue;
                    }
                } catch (preValidationError) {
                    // If pre-validation fails, still try to insert (validation will catch it)
                    console.warn('Pre-validation failed, will rely on service validation:', preValidationError);
                }
            }

            // Now attempt to create all records
            for (let i = 0; i < recordsToCreate.length; i++) {
                const record = recordsToCreate[i];
                const employee = departmentEmployees.find((e: any) => e.id === record.employee_id);
                const kpi = selectedKpis.find((k: any) => k.id === record.kpi_id);
                
                // Skip if already failed in pre-validation
                if (errors.some(e => e.includes(employee?.name || '') && e.includes(kpi?.name || ''))) {
                    continue;
                }

                try {
                    await assignKpi(record);
                    successCount++;
                } catch (error: any) {
                    console.error(`Error assigning KPI to employee ${employee?.name}:`, error);
                    errorCount++;
                    errors.push(`Nhân viên ${employee?.name || 'N/A'}, KPI "${kpi?.name || 'N/A'}": ${error?.message || 'Lỗi không xác định'}`);
                }
            }

            const kpiNames = selectedKpis.map(k => k.name).join(', ');
            if (errorCount === 0) {
                toast({
                    title: 'Thành công!',
                    description: `Đã giao ${selectedKpis.length} KPI (${kpiNames}) cho ${successCount} nhân viên trong ${departmentName}.`
                });
            } else {
                const errorMessage = errors.length > 0 
                    ? errors.slice(0, 3).join('; ') + (errors.length > 3 ? ` và ${errors.length - 3} lỗi khác...` : '')
                    : `${errorCount} bản ghi gặp lỗi`;
                
                toast({
                    variant: 'destructive',
                    title: 'Cảnh báo!',
                    description: `Đã giao ${selectedKpis.length} KPI cho ${successCount} bản ghi. ${errorMessage}`
                });
            }
        } else {
            // Giao cho nhân viên đơn lẻ với tất cả KPI đã chọn
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            for (const kpi of selectedKpis) {
                try {
                    const newRecord: any = {
                        kpi_id: kpi.id,
                        employee_id: selectedEmployee?.id,
                        department_id: null,
                        period: calculatePeriodFromDate(startDateValue, endDateValue),
                        target: kpi.target,
                        actual: 0,
                        progress: 0,
                        status: initialStatus,
                        start_date: formatDateToLocal(startDateValue),
                        end_date: formatDateToLocal(endDateValue),
                        submission_details: '',
                        attachment: null,
                        bonus_amount: null,
                        penalty_amount: null,
                        score: null,
                        is_active: true,
                    };
                    
                    await assignKpi(newRecord);
                    successCount++;
                } catch (error: any) {
                    console.error(`Error assigning KPI ${kpi.name}:`, error);
                    errorCount++;
                    errors.push(`KPI "${kpi.name}": ${error?.message || 'Lỗi không xác định'}`);
                }
            }

            const kpiNames = selectedKpis.map(k => k.name).join(', ');
            if (errorCount === 0) {
                toast({
                    title: 'Thành công!',
                    description: `Đã giao ${selectedKpis.length} KPI (${kpiNames}) cho ${selectedEmployee?.name}.`
                });
            } else {
                const errorMessage = errors.length > 0 
                    ? errors.slice(0, 3).join('; ') + (errors.length > 3 ? ` và ${errors.length - 3} lỗi khác...` : '')
                    : `${errorCount} KPI gặp lỗi`;
                
                toast({
                    variant: 'destructive',
                    title: 'Cảnh báo!',
                    description: `Đã giao ${successCount}/${selectedKpis.length} KPI cho ${selectedEmployee?.name}. ${errorMessage}`
                });
            }
        }
        
        // Đóng dialog sau khi gán thành công
        setIsAssignDialogOpen(false);
    } catch (error: any) {
        console.error('Error assigning KPI:', error);
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: error?.message || error?.details || 'Không thể giao KPI. Vui lòng thử lại.'
        });
        // Không đóng dialog nếu có lỗi để người dùng có thể thử lại
    }
  };
  
  const handleRowClick = (record: AssignedKpiDetails) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  }

  const handleCancelClick = (e: React.MouseEvent, record: AssignedKpiDetails) => {
    e.stopPropagation(); // Prevent row click
    setRecordToCancel(record);
    setIsCancelDialogOpen(true);
  }

  const openCancelDialog = (record: AssignedKpiDetails) => {
    setRecordToCancel(record);
    setIsCancelDialogOpen(true);
    setDetailModalOpen(false); // Close detail modal when opening cancel dialog
  }

  const confirmCancel = async () => {
    if (!recordToCancel) return;
    
    try {
      await deleteKpiRecord(recordToCancel.id.toString());
      toast({
        title: 'Thành công!',
        description: `Đã hủy giao KPI "${recordToCancel.kpiName}".`
      });
      setIsCancelDialogOpen(false);
      setRecordToCancel(null);
    } catch (error: any) {
      console.error('Error canceling KPI assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi!',
        description: error?.message || error?.details || 'Không thể hủy giao KPI. Vui lòng thử lại.'
      });
    }
  }

  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>KPI đã giao</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tất cả nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhân viên</SelectItem>
                  {safeUsers.filter((user: any) => {
                    // Filter out admins (level >= 4)
                    const level = user.level || user.roles?.level || 0;
                    return level < 4;
                  }).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
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
              {(filterStartDate || filterEndDate || filterStatus !== 'all' || filterEmployeeId !== 'all') && (
                <div className="text-sm text-muted-foreground">
                  Hiển thị {assignedKpis.length} KPI
                  {filterEmployeeId !== 'all' && (() => {
                    const employeeName = safeUsers.find((e: any) => e.id === filterEmployeeId)?.name || '';
                    return ` của ${employeeName}`;
                  })()}
                  {filterStartDate && filterEndDate && ` - ${format(filterStartDate, 'dd/MM/yyyy')} đến ${format(filterEndDate, 'dd/MM/yyyy')}`}
                  {filterStartDate && !filterEndDate && ` - Từ ${format(filterStartDate, 'dd/MM/yyyy')}`}
                  {!filterStartDate && filterEndDate && ` - Đến ${format(filterEndDate, 'dd/MM/yyyy')}`}
                  {filterStatus !== 'all' && ` - ${statusConfig[filterStatus]?.label || filterStatus}`}
                </div>
              )}
              <Button 
                onClick={() => setIsAssignDialogOpen(true)}
                disabled={safeUsers.length === 0 || safeKpis.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Giao KPI
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Người nhận</TableHead>
                <TableHead className="min-w-[200px]">Tên KPI</TableHead>
                <TableHead className="min-w-[150px]">Thời gian</TableHead>
                <TableHead className="min-w-[150px]">Tiến độ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedKpis.length > 0 ? assignedKpis.map((item) => (
                <TableRow key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {item.assignmentType === 'employee' ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={item.employeeAvatar} />
                          <AvatarFallback>{item.employeeName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="break-words">{item.employeeName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-blue-600">D</span>
                        </div>
                        <span className="break-words">{item.departmentName}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="break-words">{item.kpiName}</TableCell>
                  <TableCell className="break-words">
                    {format(new Date((item as any).start_date), 'dd/MM/yy')} - {format(new Date((item as any).end_date), 'dd/MM/yy')}
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <div className="space-y-1">
                      <Progress value={Math.min(item.completionPercentage, 100)} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.actual || 0} / {item.target || 0} {item.kpiUnit}</span>
                        <span className="font-medium">{item.completionPercentage}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[item.status as keyof typeof statusConfig]?.variant || 'default'}>
                      {statusConfig[item.status as keyof typeof statusConfig]?.label || 'Không xác định'}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Chưa có KPI nào được giao</p>
                      <p className="text-sm text-muted-foreground">Giao KPI cho nhân viên hoặc phòng ban để bắt đầu</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    {selectedRecord && (
        <Dialog open={isDetailModalOpen} onOpenChange={setDetailModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="break-words">{selectedRecord.kpiName}</DialogTitle>
                    <DialogDescription className="break-words">{selectedRecord.kpiDescription}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4 min-w-0">
                        {selectedRecord.assignmentType === 'employee' ? (
                          <>
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={selectedRecord.employeeAvatar} />
                              <AvatarFallback>{selectedRecord.employeeName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold break-words">{selectedRecord.employeeName}</p>
                              <p className="text-sm text-muted-foreground">Nhân viên thực hiện</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-semibold text-blue-600">D</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold break-words">{selectedRecord.departmentName}</p>
                              <p className="text-sm text-muted-foreground">Phòng ban thực hiện</p>
                            </div>
                          </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Mục tiêu</p>
                            <p className="text-lg font-semibold">{selectedRecord.target} {selectedRecord.kpiUnit}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Thực tế</p>
                            <p className="text-lg font-semibold">{selectedRecord.actual} {selectedRecord.kpiUnit}</p>
                        </div>
                         <div className="col-span-2">
                             <p className="text-sm font-medium text-muted-foreground mb-1">Tiến độ hoàn thành</p>
                             <div className="flex items-center gap-2">
                                 <Progress value={selectedRecord.completionPercentage} className="h-2 flex-1" />
                                 <span className="font-semibold text-sm">{selectedRecord.completionPercentage}%</span>
                             </div>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">Trạng thái</p>
                            <Badge variant={statusConfig[selectedRecord.status]?.variant || 'default'}>
                              {statusConfig[selectedRecord.status]?.label || 'Không xác định'}
                            </Badge>
                        </div>
                         <div>
                            <p className="font-medium text-muted-foreground">Thời gian</p>
                            <p className="break-words">{format(new Date((selectedRecord as any).start_date), 'dd/MM/yy')} - {format(new Date((selectedRecord as any).end_date), 'dd/MM/yy')}</p>
                        </div>
                    </div>
                    {selectedRecord.kpiRewardPenalty && (
                        <div className="w-full min-w-0">
                             <p className="font-medium text-muted-foreground text-sm">Cấu hình Thưởng/Phạt</p>
                             <pre className="text-sm p-2 bg-muted rounded-md mt-1 break-words whitespace-pre-wrap max-w-full overflow-x-auto font-mono">
                                 {(() => {
                                     try {
                                         const parsed = typeof selectedRecord.kpiRewardPenalty === 'string' 
                                             ? JSON.parse(selectedRecord.kpiRewardPenalty) 
                                             : selectedRecord.kpiRewardPenalty;
                                         return JSON.stringify(parsed, null, 2);
                                     } catch {
                                         return selectedRecord.kpiRewardPenalty;
                                     }
                                 })()}
                             </pre>
                        </div>
                    )}

                </div>
                <DialogFooter className="flex justify-between">
                    <Button 
                        variant="destructive" 
                        onClick={() => {
                            if (selectedRecord) {
                                openCancelDialog(selectedRecord);
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hủy giao KPI
                    </Button>
                    <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}

      {/* Assign KPI Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Giao KPI</DialogTitle>
            <DialogDescription>
              Chọn loại giao KPI (nhân viên hoặc phòng ban), KPI và thời gian để giao việc.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {safeUsers.length > 0 && safeKpis.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Assignment Type Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại giao</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>{assignmentType === 'employee' ? 'Nhân viên' : 'Phòng ban'}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      <DropdownMenuItem onSelect={() => setAssignmentType('employee')}>
                        Nhân viên
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setAssignmentType('department')}>
                        Phòng ban
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Employee Select */}
                {assignmentType === 'employee' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nhân viên</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <div className='flex items-center gap-2 min-w-0 flex-1'>
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={selectedEmployee?.avatar} />
                              <AvatarFallback>{selectedEmployee?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedEmployee?.name || 'Chọn nhân viên'}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64">
                        {safeUsers.filter((emp: any) => {
                          // Filter out admins (level >= 4)
                          const level = emp.level || emp.roles?.level || 0;
                          return level < 4;
                        }).map(emp => (
                          <DropdownMenuItem key={emp.id} onSelect={() => setSelectedEmployee(emp)}>
                            {emp.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Department Select */}
                {assignmentType === 'department' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phòng ban</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span>{safeDepartments.find((d: any) => d.id === selectedDepartmentId)?.name || 'Chọn phòng ban'}</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64">
                        {safeDepartments.map((dept: any) => (
                          <DropdownMenuItem key={dept.id} onSelect={() => setSelectedDepartmentId(dept.id)}>
                            {dept.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {selectedDepartmentId && (
                      <p className="text-xs text-muted-foreground">
                        KPI sẽ được tự động giao cho {safeUsers.filter((emp: any) => {
                          const level = emp.level || emp.roles?.level || 0;
                          return level < 4 && Number(emp.department_id) === Number(selectedDepartmentId);
                        }).length} nhân viên trong phòng ban này
                      </p>
                    )}
                  </div>
                )}
                
                {/* KPI Multi-Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn KPI</label>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between" 
                    disabled={filteredKpis.length === 0}
                    onClick={() => setIsKpiDialogOpen(true)}
                  >
                    <span className='truncate'>
                      {selectedKpis.length === 0 
                        ? 'Chọn KPI' 
                        : selectedKpis.length === 1 
                        ? selectedKpis[0].name 
                        : `Đã chọn ${selectedKpis.length} KPI`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                  {selectedKpis.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedKpis.map((kpi: any) => (
                        <Badge key={kpi.id} variant="secondary" className="flex items-center gap-1">
                          <span className="truncate max-w-[200px]">{kpi.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKpis(prev => prev.filter((sk: any) => sk.id !== kpi.id));
                            }}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {assignmentType === 'department' && selectedDepartmentId && filteredKpis.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {filteredKpis.length} KPI của phòng ban này
                    </p>
                  )}
                  {assignmentType === 'employee' && selectedEmployee && filteredKpis.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {filteredKpis.length} KPI của phòng ban {safeDepartments.find((d: any) => d.id === selectedEmployee?.department_id)?.name || ''}
                    </p>
                  )}
                </div>
                
                {/* Start Date Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày bắt đầu</label>
                  <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, 'dd/MM/yyyy')
                        ) : (
                          <span>Chọn ngày bắt đầu</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      align="start"
                      onPointerDownOutside={(e) => {
                        // Only close if clicking outside the calendar
                        const target = e.target as HTMLElement;
                        if (target.closest('[role="grid"]') || target.closest('[role="gridcell"]')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <CalendarComponent
                        initialFocus
                        mode="single"
                        defaultMonth={startDate}
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          // Close popover after selecting a date
                          setIsStartDatePopoverOpen(false);
                        }}
                        numberOfMonths={1}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày kết thúc</label>
                  <Popover open={isEndDatePopoverOpen} onOpenChange={setIsEndDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, 'dd/MM/yyyy')
                        ) : (
                          <span>Chọn ngày kết thúc</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      align="start"
                      onPointerDownOutside={(e) => {
                        // Only close if clicking outside the calendar
                        const target = e.target as HTMLElement;
                        if (target.closest('[role="grid"]') || target.closest('[role="gridcell"]')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <CalendarComponent
                        initialFocus
                        mode="single"
                        defaultMonth={endDate}
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          // Close popover after selecting a date
                          setIsEndDatePopoverOpen(false);
                        }}
                        numberOfMonths={1}
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">
                  {safeUsers.length === 0 && safeKpis.length === 0 
                    ? 'Chưa có nhân viên và KPI nào.' 
                    : safeUsers.length === 0 
                      ? 'Chưa có nhân viên nào.' 
                      : 'Chưa có KPI nào.'
                  }
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleAssignKpi}
              disabled={safeUsers.length === 0 || safeKpis.length === 0}
            >
              Giao KPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPI Selection Dialog */}
      <Dialog open={isKpiDialogOpen} onOpenChange={setIsKpiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn KPI</DialogTitle>
            <DialogDescription>
              {assignmentType === 'department' && selectedDepartmentId
                ? `Chọn KPI để giao cho phòng ban ${safeDepartments.find((d: any) => d.id === selectedDepartmentId)?.name || ''}`
                : assignmentType === 'employee' && selectedEmployee
                ? `Chọn KPI để giao cho ${selectedEmployee?.name || ''}`
                : 'Chọn một hoặc nhiều KPI để giao'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {filteredKpis.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredKpis.map((kpi: any) => {
                  const isSelected = selectedKpis.some((sk: any) => sk.id === kpi.id);
                  return (
                    <div
                      key={kpi.id}
                      className="flex items-center space-x-2 p-3 rounded-md border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        // Toggle selection when clicking anywhere on the item
                        if (isSelected) {
                          setSelectedKpis(prev => prev.filter((sk: any) => sk.id !== kpi.id));
                        } else {
                          setSelectedKpis(prev => [...prev, kpi]);
                        }
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedKpis(prev => [...prev, kpi]);
                          } else {
                            setSelectedKpis(prev => prev.filter((sk: any) => sk.id !== kpi.id));
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      />
                      <div className="flex-1">
                        <label 
                          className="text-sm font-medium cursor-pointer block"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              setSelectedKpis(prev => prev.filter((sk: any) => sk.id !== kpi.id));
                            } else {
                              setSelectedKpis(prev => [...prev, kpi]);
                            }
                          }}
                        >
                          {kpi.name}
                        </label>
                        {kpi.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {kpi.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Mục tiêu: {kpi.target} {kpi.unit}</span>
                          {kpi.department && (
                            <span>• {kpi.department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {assignmentType === 'department' && !selectedDepartmentId
                  ? 'Vui lòng chọn phòng ban trước'
                  : assignmentType === 'employee' && !selectedEmployee
                  ? 'Vui lòng chọn nhân viên trước'
                  : 'Không có KPI nào cho phòng ban này'}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKpiDialogOpen(false)}>
              Đóng
            </Button>
            <Button 
              onClick={() => {
                if (selectedKpis.length > 0) {
                  setIsKpiDialogOpen(false);
                }
              }}
              disabled={selectedKpis.length === 0}
            >
              Xác nhận ({selectedKpis.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel KPI Assignment Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy giao KPI</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy giao KPI "{recordToCancel?.kpiName}" cho {recordToCancel?.assignmentType === 'employee' ? recordToCancel?.employeeName : recordToCancel?.departmentName}? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancel} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
