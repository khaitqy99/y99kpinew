'use client';

import React, { useState, useContext } from 'react';
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
import { Paperclip, CheckCircle, File, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getPeriodLabel } from '@/lib/period-utils';

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
};

export default function ApprovalPage() {
  const { toast } = useToast();
  const { kpiRecords, users, kpis, updateKpiRecordStatus, loading } = useContext(SupabaseDataContext);
  
  const [selectedApproval, setSelectedApproval] = useState<MappedApproval | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Ensure arrays are defined before using filter
  const safeKpiRecords = kpiRecords || [];
  const safeUsers = users || [];
  const safeKpis = kpis || [];

  const getAllApprovals = () => {
    // Filter by status: show relevant statuses (pending, completed, approved, rejected)
    // Also include 'in_progress' with submission_details (submitted but not yet pending approval)
    let filteredRecords = safeKpiRecords.filter(r => {
      const relevantStatuses = ['pending_approval', 'completed', 'approved', 'rejected', 'in_progress'];
      // Include in_progress only if it has submission details (submitted)
      if (r.status === 'in_progress' && !r.submission_details) {
        return false;
      }
      return relevantStatuses.includes(r.status);
    });
    
    // Filter by status if selected
    if (selectedStatus && selectedStatus !== 'all') {
      filteredRecords = filteredRecords.filter(r => r.status === selectedStatus);
    }
    
    // Filter by period if selected
    if (selectedPeriod && selectedPeriod !== 'all') {
      filteredRecords = filteredRecords.filter(r => r.period === selectedPeriod);
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
        return {
            id: String(record.id), // Ensure id is string for consistency
            employeeName: employee?.name || 'N/A',
            kpiName: kpi?.name || 'N/A',
            targetFormatted: `${record.target} ${kpi?.unit || ''}`,
            actualFormatted: `${record.actual || 0} ${kpi?.unit || ''}`,
            completion: completion > 100 ? 100 : completion,
            submissionDetails: record.submission_details || '',
            attachment: record.attachment || null,
            period: record.period || 'N/A',
            status: record.status,
        }
    });
  }

  const approvals = getAllApprovals();

  // Debug: Log to see what records we have
  React.useEffect(() => {
    console.log('KPI Records:', safeKpiRecords.length);
    console.log('Approvals filtered:', approvals.length);
    console.log('Records by status:', {
      pending_approval: safeKpiRecords.filter(r => r.status === 'pending_approval').length,
      approved: safeKpiRecords.filter(r => r.status === 'approved').length,
      completed: safeKpiRecords.filter(r => r.status === 'completed').length,
      rejected: safeKpiRecords.filter(r => r.status === 'rejected').length,
      in_progress: safeKpiRecords.filter(r => r.status === 'in_progress').length,
    });
  }, [safeKpiRecords, approvals]);

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

  // Get unique periods from relevant records
  const getUniquePeriods = () => {
    const periods = new Set<string>();
    safeKpiRecords
      .filter(r => ['pending_approval', 'completed', 'approved', 'rejected'].includes(r.status))
      .forEach(r => {
        if (r.period) {
          periods.add(r.period);
        }
      });
    return Array.from(periods).sort((a, b) => {
      // Sort periods: months first, then quarters, then by value
      const aIsMonth = a.startsWith('M');
      const bIsMonth = b.startsWith('M');
      if (aIsMonth && !bIsMonth) return -1;
      if (!aIsMonth && bIsMonth) return 1;
      return a.localeCompare(b);
    });
  };

  const uniquePeriods = getUniquePeriods();

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
    if (!attachment) return [];
    return attachment.split(',').map(url => url.trim()).filter(url => url.length > 0);
  };

  const handleViewAttachment = (url: string) => {
    if (url) {
      window.open(url, '_blank');
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
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tất cả các chu kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả các chu kỳ</SelectItem>
                  {uniquePeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {getPeriodLabel(period)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(selectedPeriod !== 'all' || selectedStatus !== 'all' || selectedEmployee !== 'all') && (
                <div className="text-sm text-muted-foreground">
                  Hiển thị {approvals.length} KPI
                  {selectedEmployee !== 'all' && (() => {
                    const employeeName = uniqueEmployees.find(e => e.id === selectedEmployee)?.name || '';
                    return ` của ${employeeName}`;
                  })()}
                  {selectedPeriod !== 'all' && ` - ${getPeriodLabel(selectedPeriod)}`}
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
              </div>
              
              <div className='space-y-1'>
                <h4 className='text-sm font-semibold'>Chi tiết nhân viên nộp:</h4>
                <p className='text-sm p-3 bg-muted rounded-md'>{selectedApproval.submissionDetails || 'Không có chi tiết.'}</p>
              </div>
              
              {selectedApproval.attachment && (
                <div className="space-y-2">
                  <h4 className='text-sm font-semibold'>Tệp đính kèm ({getAttachmentUrls(selectedApproval.attachment).length}):</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {getAttachmentUrls(selectedApproval.attachment).map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            File {index + 1}
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
              )}
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
              <div className='space-y-1'>
                 <h4 className='text-sm font-semibold'>Chi tiết nhân viên nộp:</h4>
                 <p className='text-sm p-3 bg-muted rounded-md'>{selectedApproval.submissionDetails || 'Không có chi tiết.'}</p>
              </div>
              {selectedApproval.attachment && (
                <div className="space-y-2">
                  <h4 className='text-sm font-semibold'>Tệp đính kèm ({getAttachmentUrls(selectedApproval.attachment).length}):</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {getAttachmentUrls(selectedApproval.attachment).map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            File {index + 1}
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
              )}
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
