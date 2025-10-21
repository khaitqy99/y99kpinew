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
import { Paperclip, CheckCircle } from 'lucide-react';

type MappedApproval = {
    id: string;
    employeeName: string;
    kpiName: string;
    targetFormatted: string;
    actualFormatted: string;
    completion: number;
    submissionDetails: string;
    attachment: string | null;
};

export default function ApprovalPage() {
  const { toast } = useToast();
  const { kpiRecords, users, kpis, updateKpiRecordStatus, loading } = useContext(SupabaseDataContext);
  
  const [selectedApproval, setSelectedApproval] = useState<MappedApproval | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');

  // Show loading state while data is being fetched
  if (loading.kpiRecords || loading.users || loading.kpis) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  // Ensure arrays are defined before using filter
  const safeKpiRecords = kpiRecords || [];
  const safeUsers = users || [];
  const safeKpis = kpis || [];

  const getPendingApprovals = () => {
    return safeKpiRecords.filter(r => r.status === 'pending_approval').map(record => {
        const employee = safeUsers.find(e => e.id === record.employee_id); // Fixed: employeeId -> employee_id
        const kpi = safeKpis.find(k => k.id === record.kpi_id); // Fixed: kpiId -> kpi_id
        const completion = record.target > 0 ? Math.round((record.actual / record.target) * 100) : 100;
        return {
            id: record.id,
            employeeName: employee?.name || 'N/A',
            kpiName: kpi?.name || 'N/A',
            targetFormatted: `${record.target}${kpi?.unit || ''}`,
            actualFormatted: `${record.actual || 0}${kpi?.unit || ''}`,
            completion: completion > 100 ? 100 : completion,
            submissionDetails: record.submission_details || '', // Fixed: submissionDetails -> submission_details
            attachment: record.attachment || null,
        }
    });
  }

  const pendingApprovals = getPendingApprovals();

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
    
    const newStatus = actionType === 'approve' ? 'completed' : 'in_progress';
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
  
  const handleViewAttachment = () => {
    if (selectedApproval?.attachment) {
      window.open(selectedApproval.attachment, '_blank');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Duyệt KPI</CardTitle>
          <CardDescription>
            Xem xét và phê duyệt các KPI đã được nhân viên nộp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Tên KPI</TableHead>
                <TableHead>Mục tiêu</TableHead>
                <TableHead>Thực tế</TableHead>
                <TableHead className="w-[150px]">% Hoàn thành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.length > 0 ? pendingApprovals.map((item) => (
                <TableRow key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{item.employeeName}</TableCell>
                  <TableCell>{item.kpiName}</TableCell>
                  <TableCell>{item.targetFormatted}</TableCell>
                  <TableCell>{item.actualFormatted}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={item.completion} className="h-2" />
                        <span>{item.completion}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Không có KPI nào chờ duyệt</p>
                        <p className="text-sm text-muted-foreground">Tất cả KPI đã được xử lý</p>
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
                  <h4 className='text-sm font-semibold'>Tệp đính kèm:</h4>
                  <Button variant="outline" size="sm" onClick={handleViewAttachment}>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Xem tệp trên Google Drive
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-end">
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleActionClick(selectedApproval, 'reject')}
                >
                  Từ chối
                </Button>
                <Button onClick={() => handleActionClick(selectedApproval, 'approve')}>
                  Duyệt
                </Button>
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
                  <h4 className='text-sm font-semibold'>Tệp đính kèm:</h4>
                  <Button variant="outline" size="sm" onClick={handleViewAttachment}>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Xem tệp trên Google Drive
                  </Button>
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
