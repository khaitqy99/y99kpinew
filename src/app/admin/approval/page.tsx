'use client';

import React, { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { Paperclip, CheckCircle, File, ExternalLink, CalendarIcon, Calendar, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { getPeriodLabel } from '@/lib/period-utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type MappedApproval = {
    id: string;
    employeeName: string;
    kpiName: string;
    targetFormatted: string;
    actualFormatted: string;
    completion: number;
    submissionDetails: string;
    attachment: string | null;
    period: string;
    status: string;
    submissionDate: string | null;
    startDate: string | null;
    endDate: string | null;
};

export default function ApprovalPage() {
  const { toast } = useToast();
  const { kpiRecords, users, kpis, kpiSubmissions, updateKpiRecordStatus, loading } = useContext(SupabaseDataContext);
  
  const [selectedApproval, setSelectedApproval] = useState<MappedApproval | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  
  // Date range filter states (similar to assign dialog)
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);

  // Ensure arrays are defined before using filter
  const safeKpiRecords = kpiRecords || [];
  const safeUsers = users || [];
  const safeKpis = kpis || [];
  const safeKpiSubmissions = kpiSubmissions || [];

  // Helper function to find submission attachment for a KPI record
  // When KPI is submitted via multi-KPI submission, attachment is stored in kpi_submissions
  const getSubmissionAttachment = (kpiRecordId: number): string | null => {
    const submission = getSubmissionForRecord(kpiRecordId);
    if (submission && submission.attachment && typeof submission.attachment === 'string' && submission.attachment.trim() !== '') {
      return submission.attachment;
    }
    return null;
  };

  // Helper function to find submission for a KPI record
  // Supports multiple ways to access kpi_record_id in items (direct, nested in kpi_records, etc.)
  const getSubmissionForRecord = (kpiRecordId: number): any | null => {
    const targetRecordId = Number(kpiRecordId);
    
    // Find submission that contains this KPI record
    const submission = safeKpiSubmissions.find(sub => {
      if (!sub.items || !Array.isArray(sub.items)) return false;
      
      return sub.items.some((item: any) => {
        // Try multiple ways to get the record ID from item
        let itemRecordId: number | null = null;
        
        // Method 1: Direct field (kpi_record_id or kpiRecordId)
        if (item.kpi_record_id !== undefined && item.kpi_record_id !== null) {
          itemRecordId = Number(item.kpi_record_id);
        } else if (item.kpiRecordId !== undefined && item.kpiRecordId !== null) {
          itemRecordId = Number(item.kpiRecordId);
        }
        // Method 2: Nested in kpi_records object (when loaded with details)
        else if (item.kpi_records && typeof item.kpi_records === 'object') {
          if (item.kpi_records.id !== undefined && item.kpi_records.id !== null) {
            itemRecordId = Number(item.kpi_records.id);
          } else if (item.kpi_records.kpi_record_id !== undefined && item.kpi_records.kpi_record_id !== null) {
            itemRecordId = Number(item.kpi_records.kpi_record_id);
          }
        }
        
        // Compare if we found a valid ID
        if (itemRecordId !== null && !isNaN(itemRecordId)) {
          return itemRecordId === targetRecordId;
        }
        
        return false;
      });
    });
    
    return submission || null;
  };

  const getAllApprovals = () => {
    // Filter by status: show relevant statuses (pending, completed, approved, rejected)
    // Also include 'in_progress' with submission_details (submitted but not yet pending approval)
    let filteredRecords = safeKpiRecords.filter(r => {
      const relevantStatuses = ['pending_approval', 'completed', 'approved', 'rejected', 'in_progress'];
      // Include in_progress only if it has submission details (submitted)
      // Check both record submission_details and submission submission_details (for multi-KPI submissions)
      if (r.status === 'in_progress') {
        const hasRecordSubmissionDetails = r.submission_details && r.submission_details.trim() !== '';
        const submission = getSubmissionForRecord(r.id);
        const hasSubmissionDetails = submission?.submission_details && submission.submission_details.trim() !== '';
        if (!hasRecordSubmissionDetails && !hasSubmissionDetails) {
          return false;
        }
      }
      return relevantStatuses.includes(r.status);
    });
    
    // Filter by status if selected
    if (selectedStatus && selectedStatus !== 'all') {
      filteredRecords = filteredRecords.filter(r => r.status === selectedStatus);
    }
    
    // Filter by date range if selected
    if (filterStartDate || filterEndDate) {
      filteredRecords = filteredRecords.filter(r => {
        if (!r.start_date || !r.end_date) return false;
        
        const recordStartDate = new Date(r.start_date);
        const recordEndDate = new Date(r.end_date);
        
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
    
    // Filter by employee if selected
    if (selectedEmployee && selectedEmployee !== 'all') {
      filteredRecords = filteredRecords.filter(r => String(r.employee_id) === selectedEmployee);
    }
    
    return filteredRecords.map(record => {
        const employee = safeUsers.find(e => e.id === record.employee_id);
        const kpi = safeKpis.find(k => k.id === record.kpi_id);
        // Use progress from record if available, otherwise calculate from actual/target
        const completion = record.progress !== undefined && record.progress !== null
          ? Math.min(100, Math.max(0, Math.round(record.progress)))
          : (record.target > 0 ? Math.round((record.actual || 0) / record.target) * 100 : 100);
        
        // Get attachment: priority to submission attachment (multi-KPI), fallback to record attachment (single KPI)
        const submissionAttachment = getSubmissionAttachment(record.id);
        const recordAttachment = (record.attachment && typeof record.attachment === 'string' && record.attachment.trim() !== '') ? record.attachment : null;
        const finalAttachment = submissionAttachment || recordAttachment;
        
        // Get submission details: priority to submission details (multi-KPI), fallback to record details (single KPI)
        const submission = getSubmissionForRecord(record.id);
        const submissionDetails = submission?.submission_details || record.submission_details || '';
        const submissionDate = submission?.submission_date || record.submission_date || null;
        
        return {
            id: String(record.id), // Ensure id is string for consistency
            employeeName: employee?.name || 'N/A',
            kpiName: kpi?.name || 'N/A',
            targetFormatted: `${record.target} ${kpi?.unit || ''}`,
            actualFormatted: `${record.actual || 0} ${kpi?.unit || ''}`,
            completion: completion > 100 ? 100 : completion,
            submissionDetails: submissionDetails,
            attachment: finalAttachment,
            period: record.period || 'N/A',
            status: record.status,
            submissionDate: submissionDate,
            startDate: record.start_date || null,
            endDate: record.end_date || null,
        }
    });
  }

  const approvals = getAllApprovals();

  // Debug: Log to see what records we have
  React.useEffect(() => {
    const approvalsCount = getAllApprovals().length;
    console.log('KPI Records:', safeKpiRecords.length);
    console.log('KPI Submissions:', safeKpiSubmissions.length);
    console.log('Approvals filtered:', approvalsCount);
    console.log('Records by status:', {
      pending_approval: safeKpiRecords.filter(r => r.status === 'pending_approval').length,
      approved: safeKpiRecords.filter(r => r.status === 'approved').length,
      completed: safeKpiRecords.filter(r => r.status === 'completed').length,
      rejected: safeKpiRecords.filter(r => r.status === 'rejected').length,
      in_progress: safeKpiRecords.filter(r => r.status === 'in_progress').length,
    });
    // Log submissions with attachments
    const submissionsWithAttachments = safeKpiSubmissions.filter(sub => sub.attachment);
    if (submissionsWithAttachments.length > 0) {
      console.log('Submissions with attachments:', submissionsWithAttachments.map(sub => ({
        id: sub.id,
        attachment: sub.attachment,
        submission_details: sub.submission_details,
        submission_date: sub.submission_date,
        itemsCount: sub.items?.length || 0,
        kpiRecordIds: sub.items?.map((item: any) => {
          const recordId = item.kpi_record_id || item.kpiRecordId;
          return { raw: recordId, number: Number(recordId), type: typeof recordId };
        }) || []
      })));
    }
    // Log all submissions structure
    if (safeKpiSubmissions.length > 0) {
      console.log('All submissions structure sample:', safeKpiSubmissions.slice(0, 1).map(sub => ({
        id: sub.id,
        hasItems: !!sub.items,
        itemsType: Array.isArray(sub.items) ? 'array' : typeof sub.items,
        itemsLength: Array.isArray(sub.items) ? sub.items.length : 0,
        firstItemSample: Array.isArray(sub.items) && sub.items.length > 0 ? {
          keys: Object.keys(sub.items[0]),
          kpi_record_id: sub.items[0].kpi_record_id,
          kpiRecordId: sub.items[0].kpiRecordId,
        } : null
      })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeKpiRecords.length, safeKpiSubmissions.length, selectedStatus, selectedEmployee, filterStartDate?.getTime(), filterEndDate?.getTime()]);

  // Show loading state while data is being fetched - AFTER all hooks
  if (loading.kpiRecords || loading.users || loading.kpis) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending_approval': 'Chờ duyệt',
      'completed': 'Đã hoàn thành',
      'approved': 'Đã duyệt',
      'rejected': 'Đã từ chối',
      'in_progress': 'Đang thực hiện',
      'not_started': 'Chưa bắt đầu',
      'overdue': 'Quá hạn',
    };
    return labels[status] || status;
  };

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending_approval':
        return 'outline';
      case 'completed':
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get unique employees from relevant records
  const getUniqueEmployees = () => {
    const employeeMap = new Map<number, string>();
    safeKpiRecords
      .filter(r => {
        const relevantStatuses = ['pending_approval', 'completed', 'approved', 'rejected', 'in_progress'];
        if (r.status === 'in_progress' && !r.submission_details) {
          return false;
        }
        return relevantStatuses.includes(r.status);
      })
      .forEach(r => {
        const employee = safeUsers.find(e => e.id === r.employee_id);
        if (employee && !employeeMap.has(employee.id)) {
          employeeMap.set(employee.id, employee.name || 'N/A');
        }
      });
    return Array.from(employeeMap.entries())
      .map(([id, name]) => ({ id: String(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const uniqueEmployees = getUniqueEmployees();

  const handleRowClick = (approval: MappedApproval) => {
    // Debug: Log attachment data
    const recordId = Number(approval.id);
    const submission = getSubmissionForRecord(recordId);
    console.log('Selected approval data:', {
      id: approval.id,
      recordId: recordId,
      attachment: approval.attachment,
      submissionDetails: approval.submissionDetails,
      submissionDate: approval.submissionDate,
      foundSubmission: submission ? {
        id: submission.id,
        attachment: submission.attachment,
        submission_details: submission.submission_details,
        submission_date: submission.submission_date,
        itemsCount: submission.items?.length || 0
      } : null,
      allSubmissions: safeKpiSubmissions.map(sub => ({
        id: sub.id,
        attachment: sub.attachment,
        submission_details: sub.submission_details,
        items: sub.items?.map((item: any) => ({
          kpi_record_id: item.kpi_record_id || item.kpiRecordId,
          type: typeof (item.kpi_record_id || item.kpiRecordId)
        })) || []
      }))
    });
    setSelectedApproval(approval);
    setIsDetailModalOpen(true);
  };

  const handleActionClick = (approval: MappedApproval, type: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(type);
    setFeedback('');
    setIsActionModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedApproval || !actionType) return;
    
    // For approve: set to 'approved', for reject: set to 'rejected'
    const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
    const feedbackComment = { author: 'Admin User', comment: feedback };

    updateKpiRecordStatus(selectedApproval.id, newStatus, feedback ? feedbackComment : undefined);
    
    setIsActionModalOpen(false);
    setIsDetailModalOpen(false);
    toast({
      title: actionType === 'approve' ? 'Đã duyệt thành công' : 'Đã từ chối KPI',
      description: `KPI "${selectedApproval.kpiName}" của ${selectedApproval.employeeName} đã được xử lý.`,
    });
    setSelectedApproval(null);
    setActionType(null);
    setFeedback('');
  };
  
  // Parse attachment URLs from comma-separated string
  const getAttachmentUrls = (attachment: string | null): string[] => {
    if (!attachment || typeof attachment !== 'string' || attachment.trim() === '') return [];
    return attachment.split(',').map(url => url.trim()).filter(url => url.length > 0);
  };

  // Extract file name from Google Drive URL or use a default name
  const getFileNameFromUrl = (url: string, index: number): string => {
    try {
      // Try to extract file name from Google Drive URL
      // Google Drive URLs can have different formats
      const urlObj = new URL(url);
      
      // Check if it's a Google Drive URL
      if (urlObj.hostname.includes('drive.google.com') || urlObj.hostname.includes('docs.google.com')) {
        // Try to get file name from URL parameters or path
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch) {
          // For Google Drive, we can't easily get the file name from URL alone
          // So we'll use a generic name with the file ID
          return `File đính kèm ${index + 1}`;
        }
      }
      
      // For other URLs, try to extract from path
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length > 0) {
        const lastPart = decodeURIComponent(pathParts[pathParts.length - 1]);
        if (lastPart && lastPart.includes('.')) {
          return lastPart;
        }
      }
      
      return `File đính kèm ${index + 1}`;
    } catch (error) {
      return `File đính kèm ${index + 1}`;
    }
  };

  const handleViewAttachment = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Format date for display
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Duyệt KPI</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhân viên</SelectItem>
                  {uniqueEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending_approval">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                  <SelectItem value="rejected">Đã từ chối</SelectItem>
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
              {(filterStartDate || filterEndDate || selectedStatus !== 'all' || selectedEmployee !== 'all') && (
                <div className="text-sm text-muted-foreground">
                  Hiển thị {approvals.length} KPI
                  {selectedEmployee !== 'all' && (() => {
                    const employeeName = uniqueEmployees.find(e => e.id === selectedEmployee)?.name || '';
                    return ` của ${employeeName}`;
                  })()}
                  {filterStartDate && filterEndDate && ` - ${format(filterStartDate, 'dd/MM/yyyy')} đến ${format(filterEndDate, 'dd/MM/yyyy')}`}
                  {filterStartDate && !filterEndDate && ` - Từ ${format(filterStartDate, 'dd/MM/yyyy')}`}
                  {!filterStartDate && filterEndDate && ` - Đến ${format(filterEndDate, 'dd/MM/yyyy')}`}
                  {selectedStatus !== 'all' && ` - ${getStatusLabel(selectedStatus)}`}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Tên KPI</TableHead>
                <TableHead>Tháng/Chu kỳ</TableHead>
                <TableHead>Mục tiêu</TableHead>
                <TableHead>Thực tế</TableHead>
                <TableHead className="w-[150px]">% Hoàn thành</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.length > 0 ? approvals.map((item) => (
                <TableRow key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{item.employeeName}</TableCell>
                  <TableCell>{item.kpiName}</TableCell>
                  <TableCell>{getPeriodLabel(item.period)}</TableCell>
                  <TableCell>{item.targetFormatted}</TableCell>
                  <TableCell>{item.actualFormatted}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={item.completion} className="h-2" />
                        <span>{item.completion}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Không có KPI nào</p>
                        <p className="text-sm text-muted-foreground">Hãy thử thay đổi bộ lọc</p>
                      </div>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedApproval && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Chi tiết KPI: {selectedApproval.kpiName}</DialogTitle>
              <DialogDescription>
                Nhân viên: <strong>{selectedApproval.employeeName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mục tiêu</p>
                  <p className="text-lg font-semibold">{selectedApproval.targetFormatted}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thực tế</p>
                  <p className="text-lg font-semibold">{selectedApproval.actualFormatted}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tiến độ hoàn thành</p>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedApproval.completion} className="h-2" />
                    <span className="font-semibold text-sm">{selectedApproval.completion}%</span>
                  </div>
                </div>
                {(selectedApproval.startDate || selectedApproval.endDate) && (
                  <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ngày bắt đầu</p>
                      <p className="text-sm font-semibold">{formatDate(selectedApproval.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ngày kết thúc</p>
                      <p className="text-sm font-semibold">{formatDate(selectedApproval.endDate)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submission Information Section */}
              <div className="space-y-3 border-t pt-4">
                <h4 className='text-sm font-semibold flex items-center gap-2'>
                  <Clock className="h-4 w-4" />
                  Thông tin nộp báo cáo
                </h4>
                
                {selectedApproval.submissionDate && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm text-muted-foreground">Ngày nộp:</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedApproval.submissionDate)}</span>
                  </div>
                )}
                
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>Chi tiết nhân viên nộp:</p>
                  <p className='text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-words'>
                    {selectedApproval.submissionDetails || 'Không có chi tiết.'}
                  </p>
                </div>
                
                {(() => {
                  const attachmentUrls = getAttachmentUrls(selectedApproval.attachment);
                  if (attachmentUrls.length > 0) {
                    return (
                      <div className="space-y-2">
                        <p className='text-sm font-medium text-muted-foreground'>
                          Tệp đính kèm ({attachmentUrls.length}):
                        </p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {attachmentUrls.map((url, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium truncate" title={url}>
                                  {getFileNameFromUrl(url, index)}
                                </span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewAttachment(url)}
                                className="flex-shrink-0"
                              >
                                <ExternalLink className="mr-2 h-3 w-3" />
                                Mở file
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <p className='text-sm font-medium text-muted-foreground'>Tệp đính kèm:</p>
                      <p className='text-sm p-3 bg-muted rounded-md text-muted-foreground'>
                        Không có file đính kèm
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
            <DialogFooter className="flex justify-end">
              <div className="space-x-2">
                {selectedApproval.status !== 'rejected' && (
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick(selectedApproval, 'reject')}
                  >
                    {selectedApproval.status === 'approved' || selectedApproval.status === 'completed' ? 'Từ chối lại' : 'Từ chối'}
                  </Button>
                )}
                {selectedApproval.status !== 'approved' && (
                  <Button onClick={() => handleActionClick(selectedApproval, 'approve')}>
                    {selectedApproval.status === 'rejected' ? 'Duyệt lại' : 'Duyệt'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Modal */}
      {selectedApproval && (
        <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Duyệt' : 'Từ chối'} KPI: {selectedApproval.kpiName}
              </DialogTitle>
              <DialogDescription>
                Nhân viên: <strong>{selectedApproval.employeeName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Submission Information Section */}
              <div className="space-y-3 border-t pt-4">
                <h4 className='text-sm font-semibold flex items-center gap-2'>
                  <Clock className="h-4 w-4" />
                  Thông tin nộp báo cáo
                </h4>
                
                {selectedApproval.submissionDate && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm text-muted-foreground">Ngày nộp:</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedApproval.submissionDate)}</span>
                  </div>
                )}
                
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>Chi tiết nhân viên nộp:</p>
                  <p className='text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-words'>
                    {selectedApproval.submissionDetails || 'Không có chi tiết.'}
                  </p>
                </div>
                
                {(() => {
                  const attachmentUrls = getAttachmentUrls(selectedApproval.attachment);
                  if (attachmentUrls.length > 0) {
                    return (
                      <div className="space-y-2">
                        <p className='text-sm font-medium text-muted-foreground'>
                          Tệp đính kèm ({attachmentUrls.length}):
                        </p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {attachmentUrls.map((url, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium truncate" title={url}>
                                  {getFileNameFromUrl(url, index)}
                                </span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewAttachment(url)}
                                className="flex-shrink-0"
                              >
                                <ExternalLink className="mr-2 h-3 w-3" />
                                Mở file
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <p className='text-sm font-medium text-muted-foreground'>Tệp đính kèm:</p>
                      <p className='text-sm p-3 bg-muted rounded-md text-muted-foreground'>
                        Không có file đính kèm
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="feedback">
                  Phản hồi (tùy chọn)
                </Label>
                <Textarea 
                  placeholder="Nhập phản hồi của bạn cho nhân viên..." 
                  id="feedback" 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleConfirm}
                variant={actionType === 'reject' ? 'destructive' : 'default'}
              >
                {actionType === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
