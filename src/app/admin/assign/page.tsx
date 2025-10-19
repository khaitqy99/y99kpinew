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
import { useToast } from '@/hooks/use-toast';
import { DataContext, KpiRecord } from '@/contexts/DataContext';

const periods = [
  'Quý 3 2024',
  'Quý 4 2024',
  'Tháng 7 2024',
  'Tháng 8 2024',
];

const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  not_started: { label: 'Chưa bắt đầu', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  overdue: { label: 'Quá hạn', variant: 'destructive' },
  pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
};


export default function AssignKpiPage() {
  const { toast } = useToast();
  const { employees, kpis, kpiRecords, assignKpi } = React.useContext(DataContext);

  const [selectedEmployee, setSelectedEmployee] = React.useState(employees[0]);
  const [selectedKpi, setSelectedKpi] = React.useState(kpis[0]);
  const [selectedPeriod, setSelectedPeriod] = React.useState(periods[0]);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 30)),
  });
  
  const getAssignedKpis = (records: KpiRecord[]) => {
    return records.map(record => {
        const employee = employees.find(e => e.id === record.employeeId);
        const kpi = kpis.find(k => k.id === record.kpiId);
        return {
            ...record,
            employeeName: employee?.name || 'N/A',
            kpiName: kpi?.name || 'N/A',
        };
    }).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  };

  const assignedKpis = getAssignedKpis(kpiRecords);
  
  const handleAssignKpi = () => {
    if (!selectedEmployee || !selectedKpi || !date?.from || !date?.to) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: 'Vui lòng điền đầy đủ thông tin để giao KPI.'
        });
        return;
    }

    const newRecord: Omit<KpiRecord, 'id'> = {
        kpiId: selectedKpi.id,
        employeeId: selectedEmployee.id,
        period: selectedPeriod,
        target: selectedKpi.target,
        actual: 0,
        status: 'not_started',
        startDate: date.from.toISOString(),
        endDate: date.to.toISOString(),
        submissionDetails: '',
        feedback: [],
    };
    
    assignKpi(newRecord);

    toast({
        title: 'Thành công!',
        description: `Đã giao KPI "${selectedKpi.name}" cho ${selectedEmployee.name}.`
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Giao KPI cho nhân viên</CardTitle>
          <CardDescription>
            Chọn nhân viên, KPI và thời gian để giao việc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Employee Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nhân viên</label>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="w-full justify-between">
                    <div className='flex items-center gap-2'>
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedEmployee.avatar} />
                            <AvatarFallback>{selectedEmployee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{selectedEmployee.name}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                    {employees.map(emp => (
                        <DropdownMenuItem key={emp.id} onSelect={() => setSelectedEmployee(emp)}>
                            {emp.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
             {/* KPI Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn KPI</label>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="w-full justify-between">
                    <span className='truncate'>{selectedKpi.name}</span>
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
                    <span>{selectedPeriod}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                    {periods.map(p => (
                        <DropdownMenuItem key={p} onSelect={() => setSelectedPeriod(p)}>
                            {p}
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
          </div>
           <div className="mt-6 flex justify-end">
            <Button onClick={handleAssignKpi}>Giao KPI</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KPI đã giao</CardTitle>
          <CardDescription>Danh sách các KPI đã được giao cho nhân viên.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Tên KPI</TableHead>
                <TableHead>Kỳ</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedKpis.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.employeeName}</TableCell>
                  <TableCell>{item.kpiName}</TableCell>
                  <TableCell>{item.period}</TableCell>
                  <TableCell>
                    {format(new Date(item.startDate), 'dd/MM/yy')} - {format(new Date(item.endDate), 'dd/MM/yy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[item.status as keyof typeof statusConfig]?.variant || 'default'}>
                      {statusConfig[item.status as keyof typeof statusConfig]?.label || 'Không xác định'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
