'use client';

import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SessionContext } from '@/contexts/SessionContext';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, Target, CheckCircle2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, Download, Eye, RefreshCw } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { getDefaultPeriod, getPeriodLabel } from '@/lib/period-utils';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { KpiDetailDialog } from './KpiDetailDialog';

interface DepartmentReport {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  kpiRecords: any[];
  totalKpis: number;
  completedKpis: number;
  averageProgress: number;
  totalBonus?: number;
  totalPenalty?: number;
}

interface EmployeeReport {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  departmentId: number;
  departmentName: string;
  kpiRecords: any[];
  totalKpis: number;
  completedKpis: number;
  averageProgress: number;
  totalBonus?: number;
  totalPenalty?: number;
}

export default function BranchKpiReportPage() {
  const { toast } = useToast();
  const { selectedBranch } = useContext(SessionContext);
  const { allDepartments, allUsers, branches } = useContext(SupabaseDataContext);
  const [loading, setLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
    selectedBranch?.id || null
  );
  const [activeTab, setActiveTab] = useState<'department' | 'employee'>('department');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [allDepartmentReports, setAllDepartmentReports] = useState<DepartmentReport[]>([]);
  const [allEmployeeReports, setAllEmployeeReports] = useState<EmployeeReport[]>([]);
  const [selectedKpiRecord, setSelectedKpiRecord] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Reset filters when branch or tab changes
  useEffect(() => {
    setSelectedDepartmentId('all');
    setSelectedEmployeeId('all');
  }, [selectedBranchId, activeTab]);

  // Ensure branches is always an array
  const safeBranches = branches || [];
  
  // Filter reports by date range
  const departmentReports = useMemo(() => {
    if (!filterStartDate && !filterEndDate) {
      return allDepartmentReports;
    }
    
    return allDepartmentReports.map(dept => {
      const filteredRecords = dept.kpiRecords.filter((record: any) => {
        if (!record.start_date || !record.end_date) return false;
        
        const recordStartDate = new Date(record.start_date);
        const recordEndDate = new Date(record.end_date);
        
        const filterStart = filterStartDate ? new Date(filterStartDate) : null;
        const filterEnd = filterEndDate ? new Date(filterEndDate) : null;
        
        if (filterStart && filterEnd) {
          return (recordStartDate <= filterEnd && recordEndDate >= filterStart);
        } else if (filterStart) {
          return recordEndDate >= filterStart;
        } else if (filterEnd) {
          return recordStartDate <= filterEnd;
        }
        
        return true;
      });
      
      // Recalculate totals for filtered records
      const totalKpis = filteredRecords.length;
      const completedKpis = filteredRecords.filter((r: any) => 
        ['completed', 'approved'].includes(r.status)
      ).length;
      const averageProgress = totalKpis > 0
        ? filteredRecords.reduce((sum: number, r: any) => sum + (r.progress || 0), 0) / totalKpis
        : 0;
      const totalBonus = filteredRecords.reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);
      const totalPenalty = filteredRecords.reduce((sum: number, r: any) => sum + (r.penaltyAmount || 0), 0);
      
      return {
        ...dept,
        kpiRecords: filteredRecords,
        totalKpis,
        completedKpis,
        averageProgress,
        totalBonus,
        totalPenalty,
      };
    }).filter(dept => dept.kpiRecords.length > 0);
  }, [allDepartmentReports, filterStartDate, filterEndDate]);
  
  const employeeReports = useMemo(() => {
    if (!filterStartDate && !filterEndDate) {
      return allEmployeeReports;
    }
    
    return allEmployeeReports.map(emp => {
      const filteredRecords = emp.kpiRecords.filter((record: any) => {
        if (!record.start_date || !record.end_date) return false;
        
        const recordStartDate = new Date(record.start_date);
        const recordEndDate = new Date(record.end_date);
        
        const filterStart = filterStartDate ? new Date(filterStartDate) : null;
        const filterEnd = filterEndDate ? new Date(filterEndDate) : null;
        
        if (filterStart && filterEnd) {
          return (recordStartDate <= filterEnd && recordEndDate >= filterStart);
        } else if (filterStart) {
          return recordEndDate >= filterStart;
        } else if (filterEnd) {
          return recordStartDate <= filterEnd;
        }
        
        return true;
      });
      
      // Recalculate totals for filtered records
      const totalKpis = filteredRecords.length;
      const completedKpis = filteredRecords.filter((r: any) => 
        ['completed', 'approved'].includes(r.status)
      ).length;
      const averageProgress = totalKpis > 0
        ? filteredRecords.reduce((sum: number, r: any) => sum + (r.progress || 0), 0) / totalKpis
        : 0;
      const totalBonus = filteredRecords.reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);
      const totalPenalty = filteredRecords.reduce((sum: number, r: any) => sum + (r.penaltyAmount || 0), 0);
      
      return {
        ...emp,
        kpiRecords: filteredRecords,
        totalKpis,
        completedKpis,
        averageProgress,
        totalBonus,
        totalPenalty,
      };
    }).filter(emp => emp.kpiRecords.length > 0);
  }, [allEmployeeReports, filterStartDate, filterEndDate]);

  // Get departments and employees for the selected branch
  const branchDepartments = useMemo(() => {
    if (!selectedBranchId || !allDepartments) return [];
    return allDepartments.filter((dept: any) => 
      dept.branch_id === selectedBranchId && dept.is_active
    );
  }, [selectedBranchId, allDepartments]);

  const branchEmployees = useMemo(() => {
    if (!selectedBranchId || !allUsers || !allDepartments) return [];
    const branchDeptIds = branchDepartments.map((d: any) => d.id);
    return allUsers.filter((user: any) => {
      if (!user.is_active) return false;
      // Check if user belongs to any department in this branch
      // Support both old format (department_id) and new format (department_ids, all_departments)
      const userDeptIds = user.department_ids || 
                          (user.all_departments ? user.all_departments.map((d: any) => d.id) : []) ||
                          (user.department_id ? [user.department_id] : []);
      
      // Check if any of user's departments is in the branch
      return userDeptIds.some((deptId: number) => branchDeptIds.includes(deptId));
    });
  }, [selectedBranchId, allUsers, allDepartments, branchDepartments]);

  // Update selected branch when context changes
  useEffect(() => {
    if (selectedBranch?.id) {
      setSelectedBranchId(selectedBranch.id);
    }
  }, [selectedBranch]);

  // Fetch reports when branch changes
  useEffect(() => {
    if (selectedBranchId) {
      fetchReports();
    }
  }, [selectedBranchId]);

  const fetchReports = async () => {
    if (!selectedBranchId) return;

    setLoading(true);
    try {
      // Build query params - fetch all data, filter client-side by date range
      const params = new URLSearchParams({
        branchId: selectedBranchId.toString(),
        includeMetadata: 'true'
      });
      
      const response = await fetch(
        `/api/reports/branch-kpi?${params.toString()}`
      );
      const result = await response.json();

      if (result.success) {
        const deptReports = result.data.departmentReports || [];
        const empReports = result.data.employeeReports || [];
        setAllDepartmentReports(deptReports);
        setAllEmployeeReports(empReports);
        
        // Show helpful message if no data
        if (deptReports.length === 0 && empReports.length === 0) {
          const branchName = safeBranches.find((b: any) => b.id === selectedBranchId)?.name || 'N/A';
          toast({
            title: 'Thông báo',
            description: `Không có dữ liệu KPI cho chi nhánh "${branchName}". Vui lòng kiểm tra xem đã có KPI records được tạo chưa.`,
            duration: 4000,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: result.error || 'Không thể tải báo cáo KPI',
        });
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải báo cáo KPI. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      completed: { label: 'Hoàn thành', variant: 'default' },
      approved: { label: 'Đã duyệt', variant: 'default' },
      pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
      in_progress: { label: 'Đang thực hiện', variant: 'outline' },
      not_started: { label: 'Chưa bắt đầu', variant: 'outline' },
      rejected: { label: 'Từ chối', variant: 'destructive' },
      overdue: { label: 'Quá hạn', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleViewKpiDetail = (record: any) => {
    setSelectedKpiRecord(record);
    setIsDetailDialogOpen(true);
  };

  const handleExportReport = () => {
    if (!selectedBranchId || (departmentReports.length === 0 && employeeReports.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không có dữ liệu để xuất.',
      });
      return;
    }

    try {
      const selectedBranchName = safeBranches.find((b: any) => b.id === selectedBranchId)?.name || 'N/A';
      const dateLabel = filterStartDate && filterEndDate
        ? `${format(filterStartDate, 'yyyy-MM-dd')}_to_${format(filterEndDate, 'yyyy-MM-dd')}`
        : filterStartDate
        ? `from_${format(filterStartDate, 'yyyy-MM-dd')}`
        : filterEndDate
        ? `to_${format(filterEndDate, 'yyyy-MM-dd')}`
        : 'Tat_ca';
      
      // Create CSV content
      const csvRows: string[] = [];
      
      // Add header with metadata
      csvRows.push(`Báo cáo KPI Chi nhánh: ${selectedBranchName}`);
      if (filterStartDate && filterEndDate) {
        csvRows.push(`Thời gian: ${format(filterStartDate, 'dd/MM/yyyy')} đến ${format(filterEndDate, 'dd/MM/yyyy')}`);
      } else if (filterStartDate) {
        csvRows.push(`Thời gian: Từ ${format(filterStartDate, 'dd/MM/yyyy')}`);
      } else if (filterEndDate) {
        csvRows.push(`Thời gian: Đến ${format(filterEndDate, 'dd/MM/yyyy')}`);
      } else {
        csvRows.push(`Thời gian: Tất cả`);
      }
      csvRows.push(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`);
      csvRows.push(''); // Empty line
      
      // Export Department Reports
      if (departmentReports.length > 0) {
        csvRows.push('=== BÁO CÁO KPI THEO PHÒNG BAN ===');
        csvRows.push('');
        
        // Department summary header
        csvRows.push([
          'Mã phòng ban',
          'Tên phòng ban',
          'Tổng KPI',
          'KPI hoàn thành',
          'Tiến độ trung bình (%)',
          'Tổng thưởng (VND)',
          'Tổng phạt (VND)'
        ].join(','));
        
        // Department summary rows
        departmentReports.forEach(dept => {
          csvRows.push([
            dept.departmentCode || '',
            `"${dept.departmentName}"`,
            dept.totalKpis.toString(),
            dept.completedKpis.toString(),
            dept.averageProgress.toFixed(2),
            (dept.totalBonus || 0).toString(),
            (dept.totalPenalty || 0).toString()
          ].join(','));
        });
        
        csvRows.push('');
        csvRows.push('=== CHI TIẾT KPI PHÒNG BAN ===');
        csvRows.push('');
        
        // Department KPI details header
        csvRows.push([
          'Mã phòng ban',
          'Tên phòng ban',
          'Tên KPI',
          'Người thực hiện',
          'Mã nhân viên',
          'Mục tiêu',
          'Thực tế',
          'Đơn vị',
          'Tiến độ (%)',
          'Thưởng (VND)',
          'Phạt (VND)',
          'Trạng thái',
          'Thời kỳ'
        ].join(','));
        
        // Department KPI details rows
        departmentReports.forEach(dept => {
          dept.kpiRecords.forEach((record: any) => {
            const kpi = record.kpis || {};
            const isEmployeeKpi = record.isEmployeeKpi === true;
            const employeeInfo = record.employeeInfo;
            csvRows.push([
              dept.departmentCode || '',
              `"${dept.departmentName}"`,
              `"${kpi.name || 'N/A'}"`,
              isEmployeeKpi && employeeInfo ? `"${employeeInfo.name}"` : '"Phòng ban"',
              isEmployeeKpi && employeeInfo ? (employeeInfo.code || '') : '',
              (kpi.target || 0).toString(),
              (record.actual || 0).toString(),
              kpi.unit || '',
              (record.progress || 0).toFixed(2),
              (record.bonusAmount || 0).toString(),
              (record.penaltyAmount || 0).toString(),
              record.status || '',
              record.period || ''
            ].join(','));
          });
        });
        
        csvRows.push('');
      }
      
      // Export Employee Reports
      if (employeeReports.length > 0) {
        csvRows.push('=== BÁO CÁO KPI THEO CÁ NHÂN ===');
        csvRows.push('');
        
        // Employee summary header
        csvRows.push([
          'Mã nhân viên',
          'Tên nhân viên',
          'Phòng ban',
          'Tổng KPI',
          'KPI hoàn thành',
          'Tiến độ trung bình (%)',
          'Tổng thưởng (VND)',
          'Tổng phạt (VND)'
        ].join(','));
        
        // Employee summary rows
        employeeReports.forEach(emp => {
          csvRows.push([
            emp.employeeCode || '',
            `"${emp.employeeName}"`,
            `"${emp.departmentName}"`,
            emp.totalKpis.toString(),
            emp.completedKpis.toString(),
            emp.averageProgress.toFixed(2),
            (emp.totalBonus || 0).toString(),
            (emp.totalPenalty || 0).toString()
          ].join(','));
        });
        
        csvRows.push('');
        csvRows.push('=== CHI TIẾT KPI CÁ NHÂN ===');
        csvRows.push('');
        
        // Employee KPI details header
        csvRows.push([
          'Mã nhân viên',
          'Tên nhân viên',
          'Phòng ban',
          'Tên KPI',
          'Mục tiêu',
          'Thực tế',
          'Đơn vị',
          'Tiến độ (%)',
          'Thưởng (VND)',
          'Phạt (VND)',
          'Trạng thái',
          'Thời kỳ'
        ].join(','));
        
        // Employee KPI details rows
        employeeReports.forEach(emp => {
          emp.kpiRecords.forEach((record: any) => {
            const kpi = record.kpis || {};
            csvRows.push([
              emp.employeeCode || '',
              `"${emp.employeeName}"`,
              `"${emp.departmentName}"`,
              `"${kpi.name || 'N/A'}"`,
              (kpi.target || 0).toString(),
              (record.actual || 0).toString(),
              kpi.unit || '',
              (record.progress || 0).toFixed(2),
              (record.bonusAmount || 0).toString(),
              (record.penaltyAmount || 0).toString(),
              record.status || '',
              record.period || ''
            ].join(','));
          });
        });
      }
      
      // Create and download CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8 support
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename
      const branchNameSanitized = selectedBranchName.replace(/[^a-zA-Z0-9_]/g, '_');
      const filename = `Bao_cao_KPI_${branchNameSanitized}_${dateLabel}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Xuất dữ liệu thành công',
        description: `Đã xuất báo cáo KPI cho chi nhánh ${selectedBranchName}`,
      });
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xuất báo cáo. Vui lòng thử lại.',
      });
    }
  };

  if (!selectedBranchId && safeBranches.length > 0) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Chọn chi nhánh</CardTitle>
            <CardDescription>
              Vui lòng chọn chi nhánh để xem báo cáo KPI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedBranchId?.toString() || ''}
              onValueChange={(value) => setSelectedBranchId(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {safeBranches.map((branch: any) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedBranchName = safeBranches.find((b: any) => b.id === selectedBranchId)?.name || 'N/A';
  const totalKpis = departmentReports.reduce((sum, d) => sum + d.totalKpis, 0) +
    employeeReports.reduce((sum, e) => sum + e.totalKpis, 0);
  const totalCompleted = departmentReports.reduce((sum, d) => sum + d.completedKpis, 0) +
    employeeReports.reduce((sum, e) => sum + e.completedKpis, 0);
  const overallProgress = totalKpis > 0 
    ? (departmentReports.reduce((sum, d) => sum + (d.averageProgress * d.totalKpis), 0) +
       employeeReports.reduce((sum, e) => sum + (e.averageProgress * e.totalKpis), 0)) / totalKpis
    : 0;
  const totalBonus = departmentReports.reduce((sum, d) => sum + (d.totalBonus || 0), 0) +
    employeeReports.reduce((sum, e) => sum + (e.totalBonus || 0), 0);
  const totalPenalty = departmentReports.reduce((sum, d) => sum + (d.totalPenalty || 0), 0) +
    employeeReports.reduce((sum, e) => sum + (e.totalPenalty || 0), 0);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4">
        {/* Header with period selector */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Báo cáo KPI Chi nhánh</CardTitle>
            <CardDescription className="mt-1">
              Xem báo cáo KPI theo phòng ban và cá nhân
              {filterStartDate && filterEndDate && (
                <span className="ml-2 text-muted-foreground">
                  - {format(filterStartDate, 'dd/MM/yyyy')} đến {format(filterEndDate, 'dd/MM/yyyy')}
                </span>
              )}
              {filterStartDate && !filterEndDate && (
                <span className="ml-2 text-muted-foreground">
                  - Từ {format(filterStartDate, 'dd/MM/yyyy')}
                </span>
              )}
              {!filterStartDate && filterEndDate && (
                <span className="ml-2 text-muted-foreground">
                  - Đến {format(filterEndDate, 'dd/MM/yyyy')}
                </span>
              )}
              {!filterStartDate && !filterEndDate && (
                <span className="ml-2 text-muted-foreground">- Tất cả thời gian</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Branch Selector */}
            {safeBranches.length > 0 && (
              <Select
                value={selectedBranchId?.toString() || ''}
                onValueChange={(value) => setSelectedBranchId(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {safeBranches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
            <Button 
              onClick={fetchReports} 
              disabled={loading || !selectedBranchId}
              variant="outline"
              size="sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Làm mới
            </Button>
            <Button 
              onClick={handleExportReport} 
              disabled={loading || !selectedBranchId || (departmentReports.length === 0 && employeeReports.length === 0)}
              variant="outline"
              size="sm"
              title="Xuất báo cáo ra file CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phòng ban</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentReports.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Phòng ban có KPI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeReports.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Nhân viên có KPI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng KPI</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalKpis}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalCompleted}/{totalKpis} hoàn thành ({overallProgress.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng thưởng</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 break-words">
                {formatCurrency(totalBonus)} VNĐ
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Thưởng của chi nhánh
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng phạt</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 break-words">
                {formatCurrency(totalPenalty)} VNĐ
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Phạt của chi nhánh
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'department' | 'employee')}>
          <TabsList>
            <TabsTrigger value="department">
              <Building2 className="h-4 w-4 mr-2" />
              KPI Phòng ban
            </TabsTrigger>
            <TabsTrigger value="employee">
              <Users className="h-4 w-4 mr-2" />
              KPI Cá nhân
            </TabsTrigger>
          </TabsList>

          <TabsContent value="department" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Báo cáo KPI theo Phòng ban</CardTitle>
                    <CardDescription>
                      Tổng hợp KPI của các phòng ban và nhân viên trong chi nhánh {selectedBranchName}
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={(value) => setSelectedDepartmentId(value)}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả phòng ban</SelectItem>
                      {branchDepartments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : departmentReports.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center max-w-md">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Chưa có dữ liệu KPI phòng ban</p>
                      <p className="text-xs mt-1">
                        {filterStartDate || filterEndDate
                          ? 'Không có dữ liệu KPI cho phòng ban nào trong khoảng thời gian đã chọn'
                          : 'Chưa có dữ liệu KPI cho phòng ban. Báo cáo này bao gồm KPI được gán trực tiếp cho phòng ban và KPI của các nhân viên trong phòng ban.'}
                      </p>
                    </div>
                  </div>
                ) : (() => {
                  const filteredDepts = departmentReports.filter((dept) => 
                    selectedDepartmentId === 'all' || 
                    dept.departmentId.toString() === selectedDepartmentId
                  );
                  
                  if (filteredDepts.length === 0) {
                    return (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <div className="text-center">
                          <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Không có dữ liệu KPI cho phòng ban đã chọn</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      {filteredDepts.map((dept) => {
                        const detailBonusTotal =
                          dept.kpiRecords?.reduce((sum: number, record: any) => sum + (record.bonusAmount || 0), 0) || 0;
                        const detailPenaltyTotal =
                          dept.kpiRecords?.reduce((sum: number, record: any) => sum + (record.penaltyAmount || 0), 0) || 0;

                        return (
                          <Card key={dept.departmentId} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{dept.departmentName}</CardTitle>
                              <CardDescription className="mt-1">
                                Mã: {dept.departmentCode}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {dept.averageProgress.toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Tiến độ trung bình
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Tổng: {dept.totalKpis} KPI
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                Hoàn thành: {dept.completedKpis}/{dept.totalKpis}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                Thưởng: {formatCurrency(dept.totalBonus || 0)} VNĐ
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-sm">
                                Phạt: {formatCurrency(dept.totalPenalty || 0)} VNĐ
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Tiến độ chung</span>
                                <span className="text-sm text-muted-foreground">
                                  {dept.averageProgress.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={Math.min(dept.averageProgress, 100)}
                                className="h-2"
                              />
                            </div>
                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-3">Chi tiết KPI</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tên KPI</TableHead>
                                    <TableHead>Người thực hiện</TableHead>
                                    <TableHead>Mục tiêu</TableHead>
                                    <TableHead>Thực tế</TableHead>
                                    <TableHead>Tiến độ</TableHead>
                                    <TableHead>Thưởng</TableHead>
                                    <TableHead>Phạt</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dept.kpiRecords.map((record: any) => {
                                    const kpi = record.kpis || {};
                                    const progress = record.progress || 0;
                                    const isEmployeeKpi = record.isEmployeeKpi === true;
                                    const employeeInfo = record.employeeInfo;
                                    return (
                                      <TableRow 
                                        key={`${record.id}-${isEmployeeKpi ? employeeInfo?.id : 'dept'}`}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleViewKpiDetail(record)}
                                      >
                                        <TableCell className="font-medium">
                                          {kpi.name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                          {isEmployeeKpi && employeeInfo ? (
                                            <div className="flex flex-col">
                                              <span className="font-medium text-sm">{employeeInfo.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {employeeInfo.code}
                                              </span>
                                            </div>
                                          ) : (
                                            <Badge variant="outline" className="text-xs">
                                              Phòng ban
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {kpi.target || 0} {kpi.unit || ''}
                                        </TableCell>
                                        <TableCell>
                                          {record.actual || 0} {kpi.unit || ''}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <Progress
                                              value={Math.min(progress, 100)}
                                              className="h-2 flex-1"
                                            />
                                            <span className="text-sm w-16 text-right">
                                              {progress.toFixed(1)}%
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {record.bonusAmount > 0 ? (
                                            <span className="text-green-600 font-medium">
                                              {formatCurrency(record.bonusAmount)} VNĐ
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {record.penaltyAmount > 0 ? (
                                            <span className="text-red-600 font-medium">
                                              {formatCurrency(record.penaltyAmount)} VNĐ
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                              <div className="flex items-center justify-end gap-6 mt-4 text-sm">
                                <div className="flex items-center gap-2 text-green-600 font-medium">
                                  <TrendingUp className="h-4 w-4" />
                                  Tổng thưởng: {formatCurrency(detailBonusTotal)} VNĐ
                                </div>
                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                  <TrendingDown className="h-4 w-4" />
                                  Tổng phạt: {formatCurrency(detailPenaltyTotal)} VNĐ
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Báo cáo KPI theo Cá nhân</CardTitle>
                    <CardDescription>
                      Tổng hợp KPI của các nhân viên trong chi nhánh {selectedBranchName}
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={(value) => setSelectedEmployeeId(value)}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả nhân viên</SelectItem>
                      {branchEmployees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} - {emp.employee_code || 'N/A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : employeeReports.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center max-w-md">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Chưa có dữ liệu KPI cá nhân</p>
                      <p className="text-xs mt-1">
                        {filterStartDate || filterEndDate
                          ? 'Không có dữ liệu KPI cho nhân viên nào trong khoảng thời gian đã chọn'
                          : 'Chưa có dữ liệu KPI được gán trực tiếp cho nhân viên. KPI cá nhân là các KPI records có employee_id và department_id = null.'}
                      </p>
                      <p className="text-xs mt-2 text-muted-foreground/80">
                        💡 Lưu ý: KPI được gán cho phòng ban sẽ hiển thị ở tab "KPI Phòng ban"
                      </p>
                    </div>
                  </div>
                ) : (() => {
                  const filteredEmps = employeeReports.filter((emp) => 
                    selectedEmployeeId === 'all' || 
                    emp.employeeId.toString() === selectedEmployeeId
                  );
                  
                  if (filteredEmps.length === 0) {
                    return (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <div className="text-center">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Không có dữ liệu KPI cho nhân viên đã chọn</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      {filteredEmps.map((emp) => {
                        const detailBonusTotal =
                          emp.kpiRecords?.reduce((sum: number, record: any) => sum + (record.bonusAmount || 0), 0) || 0;
                        const detailPenaltyTotal =
                          emp.kpiRecords?.reduce((sum: number, record: any) => sum + (record.penaltyAmount || 0), 0) || 0;

                        return (
                          <Card key={emp.employeeId} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{emp.employeeName}</CardTitle>
                              <CardDescription className="mt-1">
                                Mã NV: {emp.employeeCode} | Phòng ban: {emp.departmentName}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {emp.averageProgress.toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Tiến độ trung bình
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Tổng: {emp.totalKpis} KPI
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                Hoàn thành: {emp.completedKpis}/{emp.totalKpis}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                Thưởng: {formatCurrency(emp.totalBonus || 0)} VNĐ
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-sm">
                                Phạt: {formatCurrency(emp.totalPenalty || 0)} VNĐ
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Tiến độ chung</span>
                                <span className="text-sm text-muted-foreground">
                                  {emp.averageProgress.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={Math.min(emp.averageProgress, 100)}
                                className="h-2"
                              />
                            </div>
                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-3">Chi tiết KPI</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tên KPI</TableHead>
                                    <TableHead>Mục tiêu</TableHead>
                                    <TableHead>Thực tế</TableHead>
                                    <TableHead>Tiến độ</TableHead>
                                    <TableHead>Thưởng</TableHead>
                                    <TableHead>Phạt</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {emp.kpiRecords.map((record: any) => {
                                    const kpi = record.kpis || {};
                                    const progress = record.progress || 0;
                                    return (
                                      <TableRow 
                                        key={record.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleViewKpiDetail(record)}
                                      >
                                        <TableCell className="font-medium">
                                          {kpi.name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                          {kpi.target || 0} {kpi.unit || ''}
                                        </TableCell>
                                        <TableCell>
                                          {record.actual || 0} {kpi.unit || ''}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <Progress
                                              value={Math.min(progress, 100)}
                                              className="h-2 flex-1"
                                            />
                                            <span className="text-sm w-16 text-right">
                                              {progress.toFixed(1)}%
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {record.bonusAmount > 0 ? (
                                            <span className="text-green-600 font-medium">
                                              {formatCurrency(record.bonusAmount)} VNĐ
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {record.penaltyAmount > 0 ? (
                                            <span className="text-red-600 font-medium">
                                              {formatCurrency(record.penaltyAmount)} VNĐ
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                              <div className="flex items-center justify-end gap-6 mt-4 text-sm">
                                <div className="flex items-center gap-2 text-green-600 font-medium">
                                  <TrendingUp className="h-4 w-4" />
                                  Tổng thưởng: {formatCurrency(detailBonusTotal)} VNĐ
                                </div>
                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                  <TrendingDown className="h-4 w-4" />
                                  Tổng phạt: {formatCurrency(detailPenaltyTotal)} VNĐ
                                </div>
                              </div>
                            </div>
                          </div>
                          </CardContent>
                        </Card>
                      );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* KPI Detail Dialog */}
      <KpiDetailDialog
        record={selectedKpiRecord}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}
