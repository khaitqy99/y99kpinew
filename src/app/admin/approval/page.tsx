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
import { DataContext } from '@/contexts/DataContext';
import { Paperclip } from 'lucide-react';

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
  const { kpiRecords, users, kpis, updateKpiRecordStatus } = useContext(DataContext);
  
  const [selectedApproval, setSelectedApproval] = useState<MappedApproval | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');

  const getPendingApprovals = () => {
    return kpiRecords.filter(r => r.status === 'pending_approval').map(record => {
        const employee = users.find(e => e.id === record.employeeId);
        const kpi = kpis.find(k => k.id === record.kpiId);
        const completion = record.target > 0 ? Math.round((record.actual / record.target) * 100) : 100;
        return {
            id: record.id,
            employeeName: employee?.name || 'N/A',
            kpiName: kpi?.name || 'N/A',
            targetFormatted: `${kpi?.target}${kpi?.unit}`,
            actualFormatted: `${record.actual}${kpi?.unit}`,
            completion: completion > 100 ? 100 : completion,
            submissionDetails: record.submissionDetails,
            attachment: record.attachment || null,
        }
    });
  }

  const pendingApprovals = getPendingApprovals();

  const handleActionClick = (approval: MappedApproval, type: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(type);
    setFeedback('');
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedApproval || !actionType) return;
    
    const newStatus = actionType === 'approve' ? 'completed' : 'in_progress';
    const feedbackComment = { author: 'Admin User', comment: feedback };

    updateKpiRecordStatus(selectedApproval.id, newStatus, feedback ? feedbackComment : undefined);
    
    setIsModalOpen(false);
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
      toast({
        title: 'Xem Tệp đính kèm',
        description: `Đang mở tệp "${selectedApproval.attachment}"... (Đây là chức năng giả lập)`,
      });
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
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.length > 0 ? pendingApprovals.map((item) => (
                <TableRow key={item.id}>
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
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(item, 'reject')}
                    >
                      Từ chối
                    </Button>
                    <Button size="sm" onClick={() => handleActionClick(item, 'approve')}>
                      Duyệt
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Không có KPI nào chờ duyệt.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedApproval && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                    {selectedApproval.attachment}
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
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
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
