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
import { useTranslation } from '@/hooks/use-translation';
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
  const { t, language } = useTranslation();
  const { kpiRecords, users, kpis, kpiSubmissions, updateKpiRecordStatus, loading } = useContext(SupabaseDataContext);
  
  // Fix hydration mismatch by only rendering Select/Popover after mount
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [selectedApproval, setSelectedApproval] = useState<MappedApproval | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
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
    if (isNaN(targetRecordId)) return null;
    
    // Find submission that contains this KPI record
    const submission = safeKpiSubmissions.find(sub => {
      if (!sub) return false;
      // Check is_active if it exists, but don't require it (for backward compatibility)
      if (sub.is_active === false) return false;
      if (!sub.items || !Array.isArray(sub.items)) return false;
      
      return sub.items.some((item: any) => {
        if (!item) return false;
        
        // Try multiple ways to get the record ID from item
        // Priority: direct kpi_record_id field (always present in database)
        if (item.kpi_record_id !== undefined && item.kpi_record_id !== null) {
          const itemRecordId = Number(item.kpi_record_id);
          if (!isNaN(itemRecordId) && itemRecordId === targetRecordId) {
            return true;
          }
        }
        
        // Fallback: kpiRecordId (camelCase)
        if (item.kpiRecordId !== undefined && item.kpiRecordId !== null) {
          const itemRecordId = Number(item.kpiRecordId);
          if (!isNaN(itemRecordId) && itemRecordId === targetRecordId) {
            return true;
          }
        }
        
        // Fallback: Nested in kpi_records object (when loaded with details)
        if (item.kpi_records && typeof item.kpi_records === 'object') {
          if (item.kpi_records.id !== undefined && item.kpi_records.id !== null) {
            const itemRecordId = Number(item.kpi_records.id);
            if (!isNaN(itemRecordId) && itemRecordId === targetRecordId) {
              return true;
            }
          }
          if (item.kpi_records.kpi_record_id !== undefined && item.kpi_records.kpi_record_id !== null) {
            const itemRecordId = Number(item.kpi_records.kpi_record_id);
            if (!isNaN(itemRecordId) && itemRecordId === targetRecordId) {
              return true;
            }
          }
        }
        
        return false;
      });
    });
    
    return submission || null;
  };

  const getAllApprovals = () => {
    // Filter to show ALL KPI records that have been submitted by employees, regardless of status
    // This ensures we catch all submissions even if status hasn't been updated correctly
    // Criteria for "submitted":
    // 1. Records with status: pending_approval, completed, approved, rejected (always shown)
    // 2. Records with submission_date (definitive proof of submission)
    // 3. Records with submission_details (text submission)
    // 4. Records with attachment (file submission)
    // 5. Records that have a submission in kpi_submissions table (multi-KPI submissions)
    // 6. Records with any status (not_started, in_progress, overdue) that have submission indicators
    
    let filteredRecords = safeKpiRecords.filter(r => {
      if (!r || !r.is_active) return false;
      
      const alwaysShowStatuses = ['pending_approval', 'completed', 'approved', 'rejected'];
      
      // Check if this record has a submission (for multi-KPI submissions)
      const submission = getSubmissionForRecord(r.id);
      const hasSubmission = submission !== null;
      
      // Always include records with these statuses (they are definitely submitted)
      if (alwaysShowStatuses.includes(r.status)) {
        return true;
      }
      
      // Check for submission indicators
      const hasRecordSubmissionDetails = r.submission_details && typeof r.submission_details === 'string' && r.submission_details.trim() !== '';
      const hasSubmissionDetails = submission?.submission_details && typeof submission.submission_details === 'string' && submission.submission_details.trim() !== '';
      const hasSubmissionDate = r.submission_date !== null && r.submission_date !== undefined;
      const hasRecordAttachment = r.attachment && typeof r.attachment === 'string' && r.attachment.trim() !== '';
      const hasSubmissionAttachment = submission?.attachment && typeof submission.attachment === 'string' && submission.attachment.trim() !== '';
      
      // Include if it has ANY indication of submission (regardless of status)
      // This catches cases where status might be 'not_started', 'in_progress', or 'overdue' 
      // but the record was actually submitted
      if (hasSubmission || hasSubmissionDate || hasRecordSubmissionDetails || hasSubmissionDetails || hasRecordAttachment || hasSubmissionAttachment) {
        return true;
      }
      
      return false;
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
    
    // Sort by submission_date (newest first), then by created_at if no submission_date
    filteredRecords.sort((a, b) => {
      const dateA = a.submission_date || a.created_at || '';
      const dateB = b.submission_date || b.created_at || '';
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Put records without submission_date at the end
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime(); // Newest first
    });
    
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
            employeeName: employee?.name || t('approval.notAvailable'),
            kpiName: kpi?.name || t('approval.notAvailable'),
            targetFormatted: `${record.target} ${kpi?.unit || ''}`,
            actualFormatted: `${record.actual || 0} ${kpi?.unit || ''}`,
            completion: completion > 100 ? 100 : completion,
            submissionDetails: submissionDetails,
            attachment: finalAttachment,
            period: record.period || t('approval.notAvailable'),
            status: record.status,
            submissionDate: submissionDate,
            startDate: record.start_date || null,
            endDate: record.end_date || null,
        }
    });
  }

  const approvals = getAllApprovals();

  // Debug: Log to see what records we have
  useEffect(() => {
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
        <div className="text-lg">{t('approval.loadingData')}</div>
      </div>
    );
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending_approval': t('approval.pendingApproval'),
      'completed': t('approval.completed'),
      'approved': t('approval.approved'),
      'rejected': t('approval.rejected'),
      'in_progress': t('approval.inProgress'),
      'not_started': t('approval.notStarted'),
      'overdue': t('approval.overdue'),
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

  // Get unique employees from relevant records and submissions (same logic as getAllApprovals)
  const getUniqueEmployees = () => {
    const employeeMap = new Map<number, string>();
    
    // Get employees from KPI records using the same filtering logic as getAllApprovals
    safeKpiRecords
      .filter(r => {
        const alwaysShowStatuses = ['pending_approval', 'completed', 'approved', 'rejected'];
        
        const submission = getSubmissionForRecord(r.id);
        const hasSubmission = submission !== null;
        
        if (alwaysShowStatuses.includes(r.status)) {
          return true;
        }
        
        const hasRecordSubmissionDetails = r.submission_details && r.submission_details.trim() !== '';
        const hasSubmissionDetails = submission?.submission_details && submission.submission_details.trim() !== '';
        const hasSubmissionDate = r.submission_date !== null && r.submission_date !== undefined;
        const hasSubmissionAttachment = r.attachment && typeof r.attachment === 'string' && r.attachment.trim() !== '';
        const hasSubmissionAttachmentInSubmission = submission?.attachment && typeof submission.attachment === 'string' && submission.attachment.trim() !== '';
        
        if (hasSubmission || hasSubmissionDate || hasRecordSubmissionDetails || hasSubmissionDetails || hasSubmissionAttachment || hasSubmissionAttachmentInSubmission) {
          return true;
        }
        
        return false;
      })
      .forEach(r => {
        const employee = safeUsers.find(e => e.id === r.employee_id);
        if (employee && !employeeMap.has(employee.id)) {
          employeeMap.set(employee.id, employee.name || 'N/A');
        }
      });
    
    // Also get employees from kpi_submissions directly (to catch new submissions)
    safeKpiSubmissions
      .filter(sub => {
        if (!sub.is_active) return false;
        // Include all submissions that have been submitted
        const alwaysShowStatuses = ['pending_approval', 'completed', 'approved', 'rejected'];
        return alwaysShowStatuses.includes(sub.status) || 
               (sub.submission_details && sub.submission_details.trim() !== '') ||
               (sub.attachment && typeof sub.attachment === 'string' && sub.attachment.trim() !== '') ||
               sub.submission_date;
      })
      .forEach(sub => {
        if (sub.employee_id) {
          const employee = safeUsers.find(e => e.id === sub.employee_id);
          if (employee && !employeeMap.has(employee.id)) {
            employeeMap.set(employee.id, employee.name || t('approval.notAvailable'));
          }
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

  const handleActionClick = (approval: MappedApproval, type: 'approve' | 'reject' | 'complete') => {
    setSelectedApproval(approval);
    setActionType(type);
    setFeedback('');
    setIsActionModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedApproval || !actionType) return;
    
    // For approve: set to 'approved', for reject: set to 'rejected', for complete: set to 'completed'
    const newStatus = actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'completed';
    const feedbackComment = feedback ? { author: 'Admin User', comment: feedback } : undefined;

    updateKpiRecordStatus(selectedApproval.id, newStatus, feedbackComment);
    
    setIsActionModalOpen(false);
    setIsDetailModalOpen(false);
    let toastTitle = '';
    if (actionType === 'approve') {
      toastTitle = t('approval.approveSuccess');
    } else if (actionType === 'reject') {
      toastTitle = t('approval.rejectSuccess');
    } else {
      toastTitle = t('approval.completeSuccess');
    }
    toast({
      title: toastTitle,
      description: t('approval.actionSuccessDesc', {
        kpiName: selectedApproval.kpiName,
        employeeName: selectedApproval.employeeName,
        action: actionType === 'complete' ? t('approval.markComplete') : t('approval.processed')
      }),
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
          return t('approval.attachmentFile', { index: index + 1 });
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
      
      return t('approval.attachmentFile', { index: index + 1 });
    } catch (error) {
      return t('approval.attachmentFile', { index: index + 1 });
    }
  };

  const handleViewAttachment = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Format date for display
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return t('approval.notAvailable');
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return t('approval.notAvailable');
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
              <CardTitle>{t('approval.title')}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {mounted ? (
                <>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('approval.allEmployees')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('approval.allEmployees')}</SelectItem>
                      {uniqueEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('approval.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('approval.allStatuses')}</SelectItem>
                      <SelectItem value="pending_approval">{t('approval.pendingApproval')}</SelectItem>
                      <SelectItem value="approved">{t('approval.approved')}</SelectItem>
                      <SelectItem value="completed">{t('approval.completed')}</SelectItem>
                      <SelectItem value="rejected">{t('approval.rejected')}</SelectItem>
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
                            <span>{t('approval.fromDate')}</span>
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
                            <span>{t('approval.toDate')}</span>
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
                        {t('common.clear')}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-[180px] h-10 rounded-md border bg-muted animate-pulse" />
                  <div className="w-[180px] h-10 rounded-md border bg-muted animate-pulse" />
                  <div className="w-[140px] h-10 rounded-md border bg-muted animate-pulse" />
                  <div className="w-[140px] h-10 rounded-md border bg-muted animate-pulse" />
                </div>
              )}
              {(filterStartDate || filterEndDate || selectedStatus !== 'all' || selectedEmployee !== 'all') && (
                <div className="text-sm text-muted-foreground">
                  {t('approval.showingKpis', { count: approvals.length })}
                  {selectedEmployee !== 'all' && (() => {
                    const employeeName = uniqueEmployees.find(e => e.id === selectedEmployee)?.name || '';
                    return ` ${t('approval.of')} ${employeeName}`;
                  })()}
                  {filterStartDate && filterEndDate && ` - ${format(filterStartDate, 'dd/MM/yyyy')} ${t('common.to')} ${format(filterEndDate, 'dd/MM/yyyy')}`}
                  {filterStartDate && !filterEndDate && ` - ${t('common.from')} ${format(filterStartDate, 'dd/MM/yyyy')}`}
                  {!filterStartDate && filterEndDate && ` - ${t('common.to')} ${format(filterEndDate, 'dd/MM/yyyy')}`}
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
                <TableHead>{t('approval.employee')}</TableHead>
                <TableHead>{t('approval.kpiName')}</TableHead>
                <TableHead>{t('approval.monthCycle')}</TableHead>
                <TableHead>{t('approval.target')}</TableHead>
                <TableHead>{t('approval.actual')}</TableHead>
                <TableHead className="w-[150px]">{t('approval.completion')}</TableHead>
                <TableHead>{t('approval.status')}</TableHead>
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
                        <p className="text-muted-foreground">{t('approval.noKpis')}</p>
                        <p className="text-sm text-muted-foreground">{t('approval.noKpisDesc')}</p>
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
          <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="break-words pr-8">{t('approval.detailTitle', { name: selectedApproval.kpiName })}</DialogTitle>
              <DialogDescription className="break-words">
                {t('approval.employeeLabel')} <strong>{selectedApproval.employeeName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('approval.target')}</p>
                  <p className="text-lg font-semibold">{selectedApproval.targetFormatted}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('approval.actual')}</p>
                  <p className="text-lg font-semibold">{selectedApproval.actualFormatted}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('approval.completionProgress')}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedApproval.completion} className="h-2" />
                    <span className="font-semibold text-sm">{selectedApproval.completion}%</span>
                  </div>
                </div>
                {(selectedApproval.startDate || selectedApproval.endDate) && (
                  <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('approval.startDate')}</p>
                      <p className="text-sm font-semibold">{formatDate(selectedApproval.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('approval.endDate')}</p>
                      <p className="text-sm font-semibold">{formatDate(selectedApproval.endDate)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submission Information Section */}
              <div className="space-y-3 border-t pt-4">
                <h4 className='text-sm font-semibold flex items-center gap-2'>
                  <Clock className="h-4 w-4" />
                  {t('approval.submissionInfo')}
                </h4>
                
                {selectedApproval.submissionDate && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm text-muted-foreground">{t('approval.submissionDate')}</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedApproval.submissionDate)}</span>
                  </div>
                )}
                
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>{t('approval.submissionDetails')}</p>
                  <p className='text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-all'>
                    {selectedApproval.submissionDetails || t('approval.noDetails')}
                  </p>
                </div>
                
                {(() => {
                  const attachmentUrls = getAttachmentUrls(selectedApproval.attachment);
                  if (attachmentUrls.length > 0) {
                    return (
                      <div className="space-y-2">
                        <p className='text-sm font-medium text-muted-foreground'>
                          {t('approval.attachments', { count: attachmentUrls.length })}
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
                                {t('approval.openFile')}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <p className='text-sm font-medium text-muted-foreground'>{t('approval.attachmentsLabel')}</p>
                      <p className='text-sm p-3 bg-muted rounded-md text-muted-foreground'>
                        {t('approval.noAttachments')}
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
                    {selectedApproval.status === 'approved' || selectedApproval.status === 'completed' ? t('approval.rejectAgain') : t('approval.reject')}
                  </Button>
                )}
                {selectedApproval.status !== 'approved' && (
                  <Button onClick={() => handleActionClick(selectedApproval, 'approve')}>
                    {selectedApproval.status === 'rejected' ? t('approval.approveAgain') : t('approval.approve')}
                  </Button>
                )}
                {selectedApproval.status !== 'completed' && (
                  <Button 
                    variant="outline"
                    onClick={() => handleActionClick(selectedApproval, 'complete')}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    {t('approval.markComplete')}
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
          <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="break-words pr-8">
                {t('approval.actionTitle', { 
                  action: actionType === 'approve' ? t('approval.approve') : actionType === 'reject' ? t('approval.reject') : t('approval.markComplete'),
                  name: selectedApproval.kpiName 
                })}
              </DialogTitle>
              <DialogDescription className="break-words">
                {t('approval.employeeLabel')} <strong>{selectedApproval.employeeName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Submission Information Section */}
              <div className="space-y-3 border-t pt-4">
                <h4 className='text-sm font-semibold flex items-center gap-2'>
                  <Clock className="h-4 w-4" />
                  {t('approval.submissionInfo')}
                </h4>
                
                {selectedApproval.submissionDate && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm text-muted-foreground">{t('approval.submissionDate')}</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedApproval.submissionDate)}</span>
                  </div>
                )}
                
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>{t('approval.submissionDetails')}</p>
                  <p className='text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-all'>
                    {selectedApproval.submissionDetails || t('approval.noDetails')}
                  </p>
                </div>
                
                {(() => {
                  const attachmentUrls = getAttachmentUrls(selectedApproval.attachment);
                  if (attachmentUrls.length > 0) {
                    return (
                      <div className="space-y-2">
                        <p className='text-sm font-medium text-muted-foreground'>
                          {t('approval.attachments', { count: attachmentUrls.length })}
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
                                {t('approval.openFile')}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <p className='text-sm font-medium text-muted-foreground'>{t('approval.attachmentsLabel')}</p>
                      <p className='text-sm p-3 bg-muted rounded-md text-muted-foreground'>
                        {t('approval.noAttachments')}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="feedback">
                  {t('approval.feedback')}
                </Label>
                <Textarea 
                  placeholder={t('approval.feedbackPlaceholder')} 
                  id="feedback" 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleConfirm}
                variant={actionType === 'reject' ? 'destructive' : actionType === 'complete' ? 'default' : 'default'}
                className={actionType === 'complete' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {actionType === 'approve' ? t('approval.confirmApprove') : actionType === 'reject' ? t('approval.confirmReject') : t('approval.confirmComplete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
