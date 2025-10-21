'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
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
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { generatePeriodOptions, getDefaultPeriod, getPeriodLabel } from '@/lib/period-utils';

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
  const { users, kpis, kpiRecords, assignKpi, departments } = React.useContext(SupabaseDataContext);

  const [assignmentType, setAssignmentType] = React.useState<'employee' | 'department'>('employee');
  const [selectedEmployee, setSelectedEmployee] = React.useState(users[0] || null);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState('');
  const [selectedKpi, setSelectedKpi] = React.useState(kpis[0] || null);
  const [selectedPeriod, setSelectedPeriod] = React.useState(getDefaultPeriod());
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 30)),
  });
  
  const [isDetailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<AssignedKpiDetails | null>(null);

  // Generate periods dynamically
  const periods = generatePeriodOptions();

  const getAssignedKpis = (records: any[]): AssignedKpiDetails[] => {
    return records.map(record => {
        const employee = users.find(e => e.id === record.employee_id);
        const kpi = kpis.find(k => k.id === record.kpi_id);
        const actualValue = typeof record.actual === 'number' ? record.actual : 0;
        const completion = record.target > 0 ? Math.round((actualValue / record.target) * 100) : 0;
        
        // Determine assignment type based on whether employee_id exists
        const assignmentType = record.employee_id ? 'employee' : 'department';
        
        return {
            ...record,
            employeeName: employee?.name || 'N/A',
            employeeAvatar: employee?.avatar || '',
            departmentName: departments.find((d: any) => d.id === record.department_id)?.name || 'N/A',
            kpiName: kpi?.name || 'N/A',
            kpiDescription: kpi?.description || '',
            kpiUnit: kpi?.unit || '',
            kpiRewardPenalty: kpi?.reward_penalty_config || '',
            completionPercentage: completion > 100 ? 100 : completion,
            assignmentType
        };
    }).sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  };

  const assignedKpis = getAssignedKpis(kpiRecords);
  
  const handleAssignKpi = () => {
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

    const newRecord: any = {
        kpi_id: selectedKpi.id,
        employee_id: assignmentType === 'employee' ? selectedEmployee?.id : null,
        department_id: assignmentType === 'department' ? selectedDepartmentId : null,
        period: `${date.from.toISOString().split('T')[0]} to ${date.to.toISOString().split('T')[0]}`, // Format period as string
        target: selectedKpi.target,
        actual: 0,
        progress: 0,
        status: 'not_started',
        start_date: date.from.toISOString().split('T')[0], // Format as date string
        end_date: date.to.toISOString().split('T')[0], // Format as date string
        submission_details: '',
        attachment: null,
        feedback: [],
        bonus_amount: null,
        penalty_amount: null,
        score: null,
        is_active: true,
    };
    
    assignKpi(newRecord);

    const assigneeName = assignmentType === 'employee' ? selectedEmployee?.name : (departments.find((d: any) => d.id === selectedDepartmentId)?.name || '');
    toast({
        title: 'Thành công!',
        description: `Đã giao KPI "${selectedKpi.name}" cho ${assigneeName}.`
    });
  };
  
  const handleRowClick = (record: AssignedKpiDetails) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  }

  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Giao KPI</CardTitle>
          <CardDescription>
            Chọn loại giao KPI (nhân viên hoặc phòng ban), KPI và thời gian để giao việc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* No data message */}
          {(users.length === 0 || kpis.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">
                {users.length === 0 && kpis.length === 0 
                  ? 'Chưa có nhân viên và KPI nào.' 
                  : users.length === 0 
                    ? 'Chưa có nhân viên nào.' 
                    : 'Chưa có KPI nào.'
                }
              </div>
            </div>
          )}
          
          {users.length > 0 && kpis.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
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
                      <div className='flex items-center gap-2'>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedEmployee?.avatar} />
                          <AvatarFallback>{selectedEmployee?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{selectedEmployee?.name || 'Chọn nhân viên'}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {users.map(emp => (
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
                      <span>{departments.find((d: any) => d.id === selectedDepartmentId)?.name || 'Chọn phòng ban'}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    {departments.map((dept: any) => (
                      <DropdownMenuItem key={dept.id} onSelect={() => setSelectedDepartmentId(dept.id)}>
                        {dept.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
             {/* KPI Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn KPI</label>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="w-full justify-between">
                    <span className='truncate'>{selectedKpi?.name || 'Chọn KPI'}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                    {kpis.map(kpi => (
                        <DropdownMenuItem key={kpi.id} onSelect={() => setSelectedKpi(kpi)}>
                            {kpi.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
             {/* Period Select */}
             <div className="space-y-2">
              <label className="text-sm font-medium">Chọn kỳ</label>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="w-full justify-between">
                    <span>{getPeriodLabel(selectedPeriod)}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                    {periods.map(p => (
                        <DropdownMenuItem key={p.value} onSelect={() => setSelectedPeriod(p.value)}>
                            {p.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
             {/* Date Picker */}
            <div className="space-y-2">
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
            
            {/* Submit Button - Centered below the form */}
            <div className="col-span-full flex justify-center mt-6">
              <Button onClick={handleAssignKpi} size="lg" className="px-8">
                Giao KPI
              </Button>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KPI đã giao</CardTitle>
          <CardDescription>Danh sách các KPI đã được giao cho nhân viên và phòng ban.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người nhận</TableHead>
                <TableHead>Tên KPI</TableHead>
                <TableHead>Kỳ</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedKpis.length > 0 ? assignedKpis.map((item) => (
                <TableRow key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {item.assignmentType === 'employee' ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={item.employeeAvatar} />
                          <AvatarFallback>{item.employeeName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{item.employeeName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">D</span>
                        </div>
                        <span>{item.departmentName}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{item.kpiName}</TableCell>
                  <TableCell>{item.period}</TableCell>
                  <TableCell>
                    {format(new Date((item as any).start_date), 'dd/MM/yy')} - {format(new Date((item as any).end_date), 'dd/MM/yy')}
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
                    <DialogTitle>{selectedRecord.kpiName}</DialogTitle>
                    <DialogDescription>{selectedRecord.kpiDescription}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        {selectedRecord.assignmentType === 'employee' ? (
                          <>
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={selectedRecord.employeeAvatar} />
                              <AvatarFallback>{selectedRecord.employeeName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{selectedRecord.employeeName}</p>
                              <p className="text-sm text-muted-foreground">Nhân viên thực hiện</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-lg font-semibold text-blue-600">D</span>
                            </div>
                            <div>
                              <p className="font-semibold">{selectedRecord.departmentName}</p>
                              <p className="text-sm text-muted-foreground">Phòng ban thực hiện</p>
                            </div>
                          </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Mục tiêu</p>
                            <p className="text-lg font-semibold">{selectedRecord.target}{selectedRecord.kpiUnit}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Thực tế</p>
                            <p className="text-lg font-semibold">{selectedRecord.actual}{selectedRecord.kpiUnit}</p>
                        </div>
                         <div className="col-span-2">
                             <p className="text-sm font-medium text-muted-foreground mb-1">Tiến độ hoàn thành</p>
                             <div className="flex items-center gap-2">
                                 <Progress value={selectedRecord.completionPercentage} className="h-2" />
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
                            <p>{selectedRecord.period}</p>
                        </div>
                         <div>
                            <p className="font-medium text-muted-foreground">Thời gian</p>
                            <p>{format(new Date((selectedRecord as any).start_date), 'dd/MM/yy')} - {format(new Date((selectedRecord as any).end_date), 'dd/MM/yy')}</p>
                        </div>
                    </div>
                    {selectedRecord.kpiRewardPenalty && (
                        <div>
                             <p className="font-medium text-muted-foreground text-sm">Cấu hình Thưởng/Phạt</p>
                             <p className="text-sm p-2 bg-muted rounded-md mt-1">{selectedRecord.kpiRewardPenalty}</p>
                        </div>
                    )}

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    </>
  );
}
