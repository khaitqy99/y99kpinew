'use client';

import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SessionContext } from '@/contexts/SessionContext';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { useTranslation } from '@/hooks/use-translation';
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
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedBranch } = useContext(SessionContext);
  const { allDepartments, allUsers, branches } = useContext(SupabaseDataContext);
  const [loading, setLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
    selectedBranch?.id || null
  );
  const [activeTab, setActiveTab] = useState<'department' | 'employee' | 'kpi-summary'>('department');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [allDepartmentReports, setAllDepartmentReports] = useState<DepartmentReport[]>([]);
  const [allEmployeeReports, setAllEmployeeReports] = useState<EmployeeReport[]>([]);
  const [kpiSummaries, setKpiSummaries] = useState<any[]>([]);
  const [selectedKpiRecord, setSelectedKpiRecord] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [branchBonusPenaltySummary, setBranchBonusPenaltySummary] = useState<{
    totalBonus: number;
    totalPenalty: number;
  }>({ totalBonus: 0, totalPenalty: 0 });
  
  // Fix hydration mismatch by only rendering Radix UI components after mount
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
        const kpiSummariesData = result.data.kpiSummaries || [];
        setAllDepartmentReports(deptReports);
        setAllEmployeeReports(empReports);
        setKpiSummaries(kpiSummariesData);
        
        // Show helpful message if no data
        if (deptReports.length === 0 && empReports.length === 0) {
          const branchName = safeBranches.find((b: any) => b.id === selectedBranchId)?.name || t('reports.notAvailable');
          toast({
            title: t('common.success'),
            description: t('reports.noDataMessage', { name: branchName }),
            duration: 4000,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: result.error || t('reports.loadError'),
        });
      }

      // Fetch bonus/penalty summary for the branch
      try {
        const summaryParams = new URLSearchParams({
          branchId: selectedBranchId.toString()
        });
        const summaryResponse = await fetch(
          `/api/bonus-penalty/summary?${summaryParams.toString()}`
        );
        const summaryResult = await summaryResponse.json();

        if (summaryResult.success) {
          setBranchBonusPenaltySummary({
            totalBonus: summaryResult.data.totalBonus || 0,
            totalPenalty: summaryResult.data.totalPenalty || 0,
          });
        }
      } catch (summaryError) {
        console.error('Error fetching bonus/penalty summary:', summaryError);
        // Don't show error toast for summary, just use default values
        setBranchBonusPenaltySummary({ totalBonus: 0, totalPenalty: 0 });
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('reports.loadError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      completed: { label: t('reports.status.completed'), variant: 'default' },
      approved: { label: t('reports.status.approved'), variant: 'default' },
      pending_approval: { label: t('reports.status.pendingApproval'), variant: 'secondary' },
      in_progress: { label: t('reports.status.inProgress'), variant: 'outline' },
      not_started: { label: t('reports.status.notStarted'), variant: 'outline' },
      rejected: { label: t('reports.status.rejected'), variant: 'destructive' },
      overdue: { label: t('reports.status.overdue'), variant: 'destructive' },
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
        title: t('common.error'),
        description: t('reports.noDataToExport'),
      });
      return;
    }

    try {
      const selectedBranchName = safeBranches.find((b: any) => b.id === selectedBranchId)?.name || t('reports.notAvailable');
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
      csvRows.push(`${t('reports.csvReportTitle')}: ${selectedBranchName}`);
      if (filterStartDate && filterEndDate) {
        csvRows.push(`${t('reports.csvTime')}: ${format(filterStartDate, 'dd/MM/yyyy')} ${t('common.to')} ${format(filterEndDate, 'dd/MM/yyyy')}`);
      } else if (filterStartDate) {
        csvRows.push(`${t('reports.csvTime')}: ${t('common.from')} ${format(filterStartDate, 'dd/MM/yyyy')}`);
      } else if (filterEndDate) {
        csvRows.push(`${t('reports.csvTime')}: ${t('common.to')} ${format(filterEndDate, 'dd/MM/yyyy')}`);
      } else {
        csvRows.push(`${t('reports.csvTime')}: ${t('reports.allTime')}`);
      }
      csvRows.push(`${t('reports.csvExportDate')}: ${new Date().toLocaleDateString('vi-VN')}`);
      csvRows.push(''); // Empty line
      
      // Export Department Reports
      if (departmentReports.length > 0) {
        csvRows.push(`=== ${t('reports.csvDepartmentReport')} ===`);
        csvRows.push('');
        
        // Department summary header
        csvRows.push([
          t('reports.csvDepartmentCode'),
          t('reports.csvDepartmentName'),
          t('reports.csvTotalKpis'),
          t('reports.csvCompletedKpis'),
          t('reports.csvAverageProgress'),
          t('reports.csvTotalBonus'),
          t('reports.csvTotalPenalty')
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
        csvRows.push(`=== ${t('reports.csvDepartmentDetails')} ===`);
        csvRows.push('');
        
        // Department KPI details header
        csvRows.push([
          t('reports.csvDepartmentCode'),
          t('reports.csvDepartmentName'),
          t('reports.csvKpiName'),
          t('reports.csvPerformer'),
          t('reports.csvEmployeeCode'),
          t('reports.csvTarget'),
          t('reports.csvActual'),
          t('reports.csvUnit'),
          t('reports.csvProgress'),
          t('reports.csvBonus'),
          t('reports.csvPenalty'),
          t('reports.csvStatus'),
          t('reports.csvPeriod')
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
              `"${kpi.name || t('reports.notAvailable')}"`,
              isEmployeeKpi && employeeInfo ? `"${employeeInfo.name}"` : `"${t('reports.departmentType')}"`,
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
        csvRows.push(`=== ${t('reports.csvEmployeeReport')} ===`);
        csvRows.push('');
        
        // Employee summary header
        csvRows.push([
          t('reports.csvEmployeeCode'),
          t('reports.csvEmployeeName'),
          t('reports.csvDepartment'),
          t('reports.csvTotalKpis'),
          t('reports.csvCompletedKpis'),
          t('reports.csvAverageProgress'),
          t('reports.csvTotalBonus'),
          t('reports.csvTotalPenalty')
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
        csvRows.push(`=== ${t('reports.csvEmployeeDetails')} ===`);
        csvRows.push('');
        
        // Employee KPI details header
        csvRows.push([
          t('reports.csvEmployeeCode'),
          t('reports.csvEmployeeName'),
          t('reports.csvDepartment'),
          t('reports.csvKpiName'),
          t('reports.csvTarget'),
          t('reports.csvActual'),
          t('reports.csvUnit'),
          t('reports.csvProgress'),
          t('reports.csvBonus'),
          t('reports.csvPenalty'),
          t('reports.csvStatus'),
          t('reports.csvPeriod')
        ].join(','));
        
        // Employee KPI details rows
        employeeReports.forEach(emp => {
          emp.kpiRecords.forEach((record: any) => {
            const kpi = record.kpis || {};
            csvRows.push([
              emp.employeeCode || '',
              `"${emp.employeeName}"`,
              `"${emp.departmentName}"`,
              `"${kpi.name || t('reports.notAvailable')}"`,
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
        title: t('reports.exportSuccess'),
        description: t('reports.exportSuccessDesc', { name: selectedBranchName }),
      });
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('reports.exportError'),
      });
    }
  };

  if (!selectedBranchId && safeBranches.length > 0) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t('reports.selectBranch')}</CardTitle>
            <CardDescription>
              {t('reports.selectBranchDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <Select
                value={selectedBranchId?.toString() || ''}
                onValueChange={(value) => setSelectedBranchId(parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectBranch')} />
                </SelectTrigger>
                <SelectContent>
                  {safeBranches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {t('reports.selectBranch')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedBranchName = safeBranches.find((b: any) => b.id === selectedBranchId)?.name || t('reports.notAvailable');
  const totalKpis = departmentReports.reduce((sum, d) => sum + d.totalKpis, 0) +
    employeeReports.reduce((sum, e) => sum + e.totalKpis, 0);
  const totalCompleted = departmentReports.reduce((sum, d) => sum + d.completedKpis, 0) +
    employeeReports.reduce((sum, e) => sum + e.completedKpis, 0);
  const overallProgress = totalKpis > 0 
    ? (departmentReports.reduce((sum, d) => sum + (d.averageProgress * d.totalKpis), 0) +
       employeeReports.reduce((sum, e) => sum + (e.averageProgress * e.totalKpis), 0)) / totalKpis
    : 0;
  // Use bonus/penalty summary from bonus-calculation page instead of calculating from KPI records
  const totalBonus = branchBonusPenaltySummary.totalBonus;
  const totalPenalty = branchBonusPenaltySummary.totalPenalty;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4">
        {/* Header with period selector */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('reports.title')}</CardTitle>
            <CardDescription className="mt-1">
              {t('reports.subtitle')}
              {filterStartDate && filterEndDate && (
                <span className="ml-2 text-muted-foreground">
                  - {format(filterStartDate, 'dd/MM/yyyy')} {t('common.to')} {format(filterEndDate, 'dd/MM/yyyy')}
                </span>
              )}
              {filterStartDate && !filterEndDate && (
                <span className="ml-2 text-muted-foreground">
                  - {t('common.from')} {format(filterStartDate, 'dd/MM/yyyy')}
                </span>
              )}
              {!filterStartDate && filterEndDate && (
                <span className="ml-2 text-muted-foreground">
                  - {t('common.to')} {format(filterEndDate, 'dd/MM/yyyy')}
                </span>
              )}
              {!filterStartDate && !filterEndDate && (
                <span className="ml-2 text-muted-foreground">- {t('reports.allTime')}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Branch Selector */}
            {mounted && safeBranches.length > 0 && (
              <Select
                value={selectedBranchId?.toString() || ''}
                onValueChange={(value) => setSelectedBranchId(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('reports.selectBranch')} />
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
            {!mounted && safeBranches.length > 0 && (
              <div className="h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm">
                {t('reports.selectBranch')}
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {mounted ? (
                <>
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
                          <span>{t('reports.fromDate')}</span>
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
                          <span>{t('reports.toDate')}</span>
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
                </>
              ) : (
                <>
                  <div className="h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                    {t('reports.fromDate')}
                  </div>
                  <div className="h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                    {t('reports.toDate')}
                  </div>
                </>
              )}
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
                  {t('reports.clear')}
                </Button>
              )}
            </div>
            <Button 
              onClick={fetchReports} 
              disabled={loading || !selectedBranchId}
              variant="outline"
              size="sm"
              title={t('reports.refreshTooltip')}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {t('reports.refresh')}
            </Button>
            <Button 
              onClick={handleExportReport} 
              disabled={loading || !selectedBranchId || (departmentReports.length === 0 && employeeReports.length === 0)}
              variant="outline"
              size="sm"
              title={t('reports.exportTooltip')}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reports.departments')}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentReports.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reports.departmentsWithKpi')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reports.employees')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeReports.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reports.employeesWithKpi')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reports.totalKpis')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalKpis}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reports.completedCount', { completed: totalCompleted, total: totalKpis })} ({overallProgress.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reports.totalBonus')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 break-words">
                {formatCurrency(totalBonus)} VNĐ
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reports.branchBonus')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reports.totalPenalty')}</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 break-words">
                {formatCurrency(totalPenalty)} VNĐ
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reports.branchPenalty')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'department' | 'employee' | 'kpi-summary')}>
          <TabsList>
            <TabsTrigger value="department">
              <Building2 className="h-4 w-4 mr-2" />
              {t('reports.departmentTab')}
            </TabsTrigger>
            <TabsTrigger value="employee">
              <Users className="h-4 w-4 mr-2" />
              {t('reports.employeeTab')}
            </TabsTrigger>
            <TabsTrigger value="kpi-summary">
              <Target className="h-4 w-4 mr-2" />
              {t('reports.kpiSummaryTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="department" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('reports.departmentReportTitle')}</CardTitle>
                    <CardDescription>
                      {t('reports.departmentReportDesc', { name: selectedBranchName })}
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={(value) => setSelectedDepartmentId(value)}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder={t('reports.selectDepartment')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.allDepartments')}</SelectItem>
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
                      <p className="text-sm font-medium">{t('reports.noDepartmentData')}</p>
                      <p className="text-xs mt-1">
                        {filterStartDate || filterEndDate
                          ? t('reports.noDepartmentDataFiltered')
                          : t('reports.noDepartmentDataDesc')}
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
                          <p className="text-sm">{t('reports.noDepartmentSelected')}</p>
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
                                {t('reports.code', { code: dept.departmentCode })}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {dept.averageProgress.toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t('reports.averageProgress')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {t('reports.total', { count: dept.totalKpis })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                {t('reports.completedCount', { completed: dept.completedKpis, total: dept.totalKpis })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                {t('reports.bonus', { amount: formatCurrency(dept.totalBonus || 0) })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-sm">
                                {t('reports.penalty', { amount: formatCurrency(dept.totalPenalty || 0) })}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{t('reports.generalProgress')}</span>
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
                              <h4 className="font-semibold mb-3">{t('reports.kpiDetails')}</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t('reports.kpiName')}</TableHead>
                                    <TableHead>{t('reports.performer')}</TableHead>
                                    <TableHead>{t('reports.target')}</TableHead>
                                    <TableHead>{t('reports.actual')}</TableHead>
                                    <TableHead>{t('reports.progress')}</TableHead>
                                    <TableHead>{t('bonusCalculation.bonus')}</TableHead>
                                    <TableHead>{t('bonusCalculation.penalty')}</TableHead>
                                    <TableHead>{t('reports.statusColumn')}</TableHead>
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
                                          {kpi.name || t('reports.notAvailable')}
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
                                              {t('reports.departmentType')}
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {formatNumber(kpi.target || 0)} {kpi.unit || ''}
                                        </TableCell>
                                        <TableCell>
                                          {formatNumber(record.actual || 0)} {kpi.unit || ''}
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
                                  {t('reports.totalBonusLabel', { amount: formatCurrency(detailBonusTotal) })}
                                </div>
                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                  <TrendingDown className="h-4 w-4" />
                                  {t('reports.totalPenaltyLabel', { amount: formatCurrency(detailPenaltyTotal) })}
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
                    <CardTitle>{t('reports.employeeReportTitle')}</CardTitle>
                    <CardDescription>
                      {t('reports.employeeReportDesc', { name: selectedBranchName })}
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={(value) => setSelectedEmployeeId(value)}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder={t('reports.selectEmployee')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.allEmployees')}</SelectItem>
                      {branchEmployees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} - {emp.employee_code || t('reports.notAvailable')}
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
                      <p className="text-sm font-medium">{t('reports.noEmployeeData')}</p>
                      <p className="text-xs mt-1">
                        {filterStartDate || filterEndDate
                          ? t('reports.noEmployeeDataFiltered')
                          : t('reports.noEmployeeDataDesc')}
                      </p>
                      <p className="text-xs mt-2 text-muted-foreground/80">
                        💡 {t('reports.noteDepartmentKpis')}
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
                          <p className="text-sm">{t('reports.noEmployeeSelected')}</p>
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
                                {t('reports.employeeCodeLabel', { code: emp.employeeCode, name: emp.departmentName })}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {emp.averageProgress.toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t('reports.averageProgress')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {t('reports.total', { count: emp.totalKpis })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                {t('reports.completedCount', { completed: emp.completedKpis, total: emp.totalKpis })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                {t('reports.bonus', { amount: formatCurrency(emp.totalBonus || 0) })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-sm">
                                {t('reports.penalty', { amount: formatCurrency(emp.totalPenalty || 0) })}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{t('reports.generalProgress')}</span>
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
                              <h4 className="font-semibold mb-3">{t('reports.kpiDetails')}</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t('reports.kpiName')}</TableHead>
                                    <TableHead>{t('reports.target')}</TableHead>
                                    <TableHead>{t('reports.actual')}</TableHead>
                                    <TableHead>{t('reports.progress')}</TableHead>
                                    <TableHead>{t('bonusCalculation.bonus')}</TableHead>
                                    <TableHead>{t('bonusCalculation.penalty')}</TableHead>
                                    <TableHead>{t('reports.statusColumn')}</TableHead>
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
                                          {kpi.name || t('reports.notAvailable')}
                                        </TableCell>
                                        <TableCell>
                                          {formatNumber(kpi.target || 0)} {kpi.unit || ''}
                                        </TableCell>
                                        <TableCell>
                                          {formatNumber(record.actual || 0)} {kpi.unit || ''}
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
                                  {t('reports.totalBonusLabel', { amount: formatCurrency(detailBonusTotal) })}
                                </div>
                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                  <TrendingDown className="h-4 w-4" />
                                  {t('reports.totalPenaltyLabel', { amount: formatCurrency(detailPenaltyTotal) })}
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

          <TabsContent value="kpi-summary" className="mt-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('reports.kpiSummaryTitle')}</CardTitle>
                  <CardDescription>
                    {t('reports.kpiSummaryDesc', { name: selectedBranchName })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : kpiSummaries.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center max-w-md">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">{t('reports.noKpiData')}</p>
                      <p className="text-xs mt-1">
                        {filterStartDate || filterEndDate
                          ? t('reports.noKpiDataFiltered')
                          : t('reports.noKpiDataDesc')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kpiSummaries.map((summary: any) => {
                      // Filter records by date range if needed
                      const filteredRecords = summary.records.filter((record: any) => {
                        if (!filterStartDate && !filterEndDate) return true;
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

                      if (filteredRecords.length === 0) return null;

                      // Recalculate for filtered records
                      const totalAssignments = filteredRecords.length;
                      const totalProgress = filteredRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.progress) || 0), 0);
                      const averageProgress = totalAssignments > 0 ? totalProgress / totalAssignments : 0;
                      const totalBonus = filteredRecords.reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);
                      const totalPenalty = filteredRecords.reduce((sum: number, r: any) => sum + (r.penaltyAmount || 0), 0);
                      const completedCount = filteredRecords.filter((r: any) => 
                        ['completed', 'approved'].includes(r.status)
                      ).length;
                      const departmentAssignments = filteredRecords.filter((r: any) => r.source === 'department').length;
                      const employeeAssignments = filteredRecords.filter((r: any) => r.source === 'employee').length;

                      return (
                        <Card key={summary.kpiId} className="border-l-4 border-l-purple-500">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{summary.kpiName}</CardTitle>
                                {summary.kpiDescription && (
                                  <CardDescription className="mt-1">
                                    {summary.kpiDescription}
                                  </CardDescription>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>{t('reports.unit', { unit: summary.kpiUnit || t('reports.notAvailable') })}</span>
                                  <span>{t('reports.targetWithAmount', { target: (summary.kpiTarget || 0).toLocaleString('vi-VN'), unit: summary.kpiUnit || '' })}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold">
                                  {averageProgress.toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {t('reports.generalProgress')}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {t('reports.peopleWorking', { count: totalAssignments, plural: totalAssignments === 1 ? t('reports.person') : t('reports.people') })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {t('reports.totalAssignments', { count: totalAssignments })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">
                                  {t('reports.departmentAssignments', { count: departmentAssignments })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-green-600" />
                                <span className="text-sm">
                                  {t('reports.employeeAssignments', { count: employeeAssignments })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm">
                                  {t('reports.completedAssignments', { completed: completedCount, total: totalAssignments })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm">
                                  {t('reports.bonus', { amount: formatCurrency(totalBonus) })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-sm">
                                  {t('reports.penalty', { amount: formatCurrency(totalPenalty) })}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="text-sm font-medium">{t('reports.kpiGeneralProgress')}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({t('reports.peopleWorking', { count: totalAssignments, plural: totalAssignments === 1 ? t('reports.person') : t('reports.people') })})
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold">
                                    {averageProgress.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress
                                  value={Math.min(averageProgress, 100)}
                                  className="h-3"
                                />
                                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                  <span>
                                    {t('reports.departmentAssignments', { count: departmentAssignments })} | {t('reports.employeeAssignments', { count: employeeAssignments })}
                                  </span>
                                  <span>
                                    {t('reports.completedAssignments', { completed: completedCount, total: totalAssignments })}
                                  </span>
                                </div>
                              </div>
                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">{t('reports.detailsByDepartmentEmployee')}</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>{t('reports.assignee')}</TableHead>
                                      <TableHead>{t('reports.type')}</TableHead>
                                      <TableHead>{t('reports.target')}</TableHead>
                                      <TableHead>{t('reports.actual')}</TableHead>
                                      <TableHead>{t('reports.progress')}</TableHead>
                                      <TableHead>{t('bonusCalculation.bonus')}</TableHead>
                                      <TableHead>{t('bonusCalculation.penalty')}</TableHead>
                                      <TableHead>{t('reports.statusColumn')}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredRecords.map((record: any) => {
                                      const progress = record.progress || 0;
                                      const isEmployeeKpi = record.source === 'employee';
                                      const isDepartmentKpi = record.source === 'department';
                                      
                                      let assigneeName = t('reports.notAvailable');
                                      let assigneeCode = '';
                                      
                                      if (isEmployeeKpi && record.employees) {
                                        assigneeName = record.employees.name || t('reports.notAvailable');
                                        assigneeCode = record.employees.employee_code || '';
                                      } else if (isDepartmentKpi && record.departments) {
                                        assigneeName = record.departments.name || t('reports.notAvailable');
                                        assigneeCode = record.departments.code || '';
                                      }

                                      return (
                                        <TableRow 
                                          key={record.id}
                                          className="cursor-pointer hover:bg-muted/50"
                                          onClick={() => handleViewKpiDetail(record)}
                                        >
                                          <TableCell>
                                            <div className="flex flex-col">
                                              <span className="font-medium text-sm">{assigneeName}</span>
                                              {assigneeCode && (
                                                <span className="text-xs text-muted-foreground">
                                                  {assigneeCode}
                                                </span>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {isEmployeeKpi ? (
                                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                                {t('reports.employeeType')}
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                {t('reports.departmentType')}
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {summary.kpiTarget || 0} {summary.kpiUnit || ''}
                                          </TableCell>
                                          <TableCell>
                                            {record.actual || 0} {summary.kpiUnit || ''}
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
                                    {t('reports.totalBonusLabel', { amount: formatCurrency(totalBonus) })}
                                  </div>
                                  <div className="flex items-center gap-2 text-red-600 font-medium">
                                    <TrendingDown className="h-4 w-4" />
                                    {t('reports.totalPenaltyLabel', { amount: formatCurrency(totalPenalty) })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
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
