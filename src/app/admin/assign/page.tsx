'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn, formatDateToLocal } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { generatePeriodOptions, getDefaultPeriod, getPeriodLabel, getPeriodDateRange } from '@/lib/period-utils';
import { type KpiRecord } from '@/services/supabase-service';

const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  not_started: { label: 'Chưa bắt đầu', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  overdue: { label: 'Quá hạn', variant: 'destructive' },
  pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
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
  const [selectedKpi, setSelectedKpi] = React.useState(safeKpis[0] || null);
  const [selectedPeriod, setSelectedPeriod] = React.useState(getDefaultPeriod());
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 30)),
  });
  
  const [isDetailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<AssignedKpiDetails | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [recordToCancel, setRecordToCancel] = React.useState<AssignedKpiDetails | null>(null);

  // Generate periods dynamically
  const allPeriods = generatePeriodOptions();
  
  // Lọc periods theo frequency của KPI đã chọn
  const filteredPeriods = React.useMemo(() => {
    // Nếu chưa chọn KPI, hiển thị tất cả kỳ
    if (!selectedKpi) {
      return allPeriods;
    }

    // Lấy frequency của KPI đã chọn
    const kpiFrequency = (selectedKpi as any).frequency || '';
    
    // Lọc periods theo frequency
    switch (kpiFrequency) {
      case 'quarterly':
        // Chỉ hiển thị quý
        return allPeriods.filter(p => p.type === 'quarter');
      case 'monthly':
        // Chỉ hiển thị tháng
        return allPeriods.filter(p => p.type === 'month');
      case 'yearly':
        // Nếu là yearly, hiển thị quý (vì có thể chọn quý trong năm)
        return allPeriods.filter(p => p.type === 'quarter');
      case 'weekly':
      case 'daily':
        // Nếu là weekly hoặc daily, hiển thị tháng (vì có thể chọn tháng)
        return allPeriods.filter(p => p.type === 'month');
      default:
        // Mặc định hiển thị tất cả
        return allPeriods;
    }
  }, [allPeriods, selectedKpi]);

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

  const assignedKpis = React.useMemo(() => getAssignedKpis(safeKpiRecords), [safeKpiRecords, filterEmployeeId, filterStatus, safeUsers, safeKpis, safeDepartments]);

  
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

  // Reset selectedKpi nếu KPI hiện tại không còn trong danh sách đã lọc
  React.useEffect(() => {
    if (selectedKpi && !filteredKpis.find((kpi: any) => kpi.id === selectedKpi.id)) {
      setSelectedKpi(filteredKpis[0] || null);
    } else if (!selectedKpi && filteredKpis.length > 0) {
      setSelectedKpi(filteredKpis[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredKpis]);

  // Reset selectedPeriod nếu kỳ hiện tại không còn trong danh sách đã lọc
  React.useEffect(() => {
    if (selectedPeriod && !filteredPeriods.find((p) => p.value === selectedPeriod)) {
      setSelectedPeriod(filteredPeriods[0]?.value || getDefaultPeriod());
    } else if (!selectedPeriod && filteredPeriods.length > 0) {
      setSelectedPeriod(filteredPeriods[0]?.value || getDefaultPeriod());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPeriods]);
  
  const handleAssignKpi = async () => {
    if (!selectedKpi || !date?.from || !date?.to) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: 'Vui lòng điền đầy đủ thông tin để giao KPI.'
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

    // TypeScript type guard: at this point date.from and date.to are guaranteed to be defined
    const startDateValue = date.from;
    const endDateValue = date.to;

    // Xác định trạng thái dựa trên start_date
    // Nếu start_date <= hôm nay thì là 'in_progress', nếu > hôm nay thì là 'not_started'
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time về 00:00:00 để so sánh ngày
    
    const startDate = new Date(startDateValue);
    startDate.setHours(0, 0, 0, 0);
    
    const initialStatus = startDate <= today ? 'in_progress' : 'not_started';

    try {
        if (assignmentType === 'department') {
            // Lấy danh sách nhân viên trong phòng ban
            const departmentIdNum = Number(selectedDepartmentId);
            const departmentEmployees = safeUsers.filter((emp: any) => 
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

            // Tạo KPI record cho từng nhân viên trong phòng ban
            const departmentName = safeDepartments.find((d: any) => d.id === selectedDepartmentId)?.name || 'phòng ban';
            
            // Prepare all records first
            const recordsToCreate = departmentEmployees.map(employee => ({
                    kpi_id: selectedKpi.id,
                    employee_id: employee.id, // Gán cho từng nhân viên
                    department_id: null, // Không set department_id khi gán cho nhân viên
                    period: selectedPeriod,
                    target: selectedKpi.target,
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
                }));

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
                        errors.push(`Nhân viên ${departmentEmployees[i].name}: KPI đã được giao trong kỳ ${selectedPeriod}`);
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
                const employee = departmentEmployees[i];
                
                // Skip if already failed in pre-validation
                if (errors.some(e => e.includes(employee.name))) {
                    continue;
                }

                try {
                    await assignKpi(record);
                    successCount++;
                } catch (error: any) {
                    console.error(`Error assigning KPI to employee ${employee.name}:`, error);
                    errorCount++;
                    errors.push(`Nhân viên ${employee.name}: ${error?.message || 'Lỗi không xác định'}`);
                }
            }

            if (errorCount === 0) {
                toast({
                    title: 'Thành công!',
                    description: `Đã giao KPI "${selectedKpi.name}" cho ${successCount} nhân viên trong ${departmentName}.`
                });
            } else {
                const errorMessage = errors.length > 0 
                    ? errors.slice(0, 3).join('; ') + (errors.length > 3 ? ` và ${errors.length - 3} lỗi khác...` : '')
                    : `${errorCount} nhân viên gặp lỗi`;
                
                toast({
                    variant: 'destructive',
                    title: 'Cảnh báo!',
                    description: `Đã giao KPI cho ${successCount} nhân viên. ${errorMessage}`
                });
            }
        } else {
            // Giao cho nhân viên đơn lẻ
            const newRecord: any = {
                kpi_id: selectedKpi.id,
                employee_id: selectedEmployee?.id,
                department_id: null,
                period: selectedPeriod,
                target: selectedKpi.target,
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
            toast({
                title: 'Thành công!',
                description: `Đã giao KPI "${selectedKpi.name}" cho ${selectedEmployee?.name}.`
            });
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
            <div className="flex items-center gap-4">
              <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tất cả nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhân viên</SelectItem>
                  {safeUsers.map(user => (
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
                <TableHead>Kỳ</TableHead>
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
                  <TableCell className="break-words">{getPeriodLabel(item.period)}</TableCell>
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
                  <TableCell colSpan={6} className="text-center h-24">
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
                     <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">Trạng thái</p>
                            <Badge variant={statusConfig[selectedRecord.status]?.variant || 'default'}>
                              {statusConfig[selectedRecord.status]?.label || 'Không xác định'}
                            </Badge>
                        </div>
                         <div>
                            <p className="font-medium text-muted-foreground">Kỳ</p>
                            <p>{getPeriodLabel(selectedRecord.period)}</p>
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
                        {safeUsers.map(emp => (
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
                        KPI sẽ được tự động giao cho {safeUsers.filter((emp: any) => Number(emp.department_id) === Number(selectedDepartmentId)).length} nhân viên trong phòng ban này
                      </p>
                    )}
                  </div>
                )}
                
                {/* KPI Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn KPI</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between" disabled={filteredKpis.length === 0}>
                        <span className='truncate'>{selectedKpi?.name || 'Chọn KPI'}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {filteredKpis.length > 0 ? (
                        filteredKpis.map((kpi: any) => (
                          <DropdownMenuItem key={kpi.id} onSelect={() => setSelectedKpi(kpi)}>
                            {kpi.name}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          {assignmentType === 'department' && !selectedDepartmentId
                            ? 'Vui lòng chọn phòng ban trước'
                            : assignmentType === 'employee' && !selectedEmployee
                            ? 'Vui lòng chọn nhân viên trước'
                            : 'Không có KPI nào cho phòng ban này'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                
                {/* Period Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn kỳ</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between" disabled={filteredPeriods.length === 0}>
                        <span>{getPeriodLabel(selectedPeriod)}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {filteredPeriods.length > 0 ? (
                        filteredPeriods.map(p => (
                          <DropdownMenuItem key={p.value} onSelect={() => setSelectedPeriod(p.value)}>
                            {p.label}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          {!selectedKpi 
                            ? 'Vui lòng chọn KPI trước'
                            : 'Không có kỳ phù hợp với tần suất của KPI này'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedKpi && filteredPeriods.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      KPI này dùng {(selectedKpi as any).frequency === 'quarterly' ? 'quý' : (selectedKpi as any).frequency === 'monthly' ? 'tháng' : 'tần suất'} - {filteredPeriods.length} kỳ có thể chọn
                    </p>
                  )}
                </div>
                
                {/* Date Picker */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Thời gian thực hiện</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, 'dd/MM/yyyy')} -{' '}
                              {format(date.to, 'dd/MM/yyyy')}
                            </>
                          ) : (
                            format(date.from, 'dd/MM/yyyy')
                          )
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
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
