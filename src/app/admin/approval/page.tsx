'use client';

import React, { useState } from 'react';
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

const pendingApprovals = [
  {
    id: 'approval-001',
    employeeName: 'Nguyễn Văn A',
    kpiName: 'Hoàn thành báo cáo phân tích đối thủ cạnh tranh',
    target: '1 báo cáo',
    actual: '1 báo cáo',
    completion: 100,
    submissionDetails: 'Đã hoàn thành báo cáo chi tiết theo đúng yêu cầu, bao gồm phân tích SWOT và 5-forces của 3 đối thủ chính. Báo cáo đã được đính kèm trong email.',
  },
  {
    id: 'approval-002',
    employeeName: 'Trần Thị B',
    kpiName: 'Đạt chứng chỉ chuyên môn mới',
    target: '1 chứng chỉ',
    actual: '1 chứng chỉ (Google Analytics IQ)',
    completion: 100,
    submissionDetails: 'Đã thi và đạt chứng chỉ Google Analytics Individual Qualification. File PDF của chứng chỉ đã được upload lên hệ thống nội bộ.',
  },
    {
    id: 'approval-003',
    employeeName: 'Lê Văn C',
    kpiName: 'Giảm 5% thời gian xử lý yêu cầu khách hàng',
    target: '5%',
    actual: '5.2%',
    completion: 104,
    submissionDetails: 'Dựa trên số liệu từ hệ thống Zendesk, thời gian xử lý trung bình đã giảm từ 25 phút xuống còn 23.7 phút, tương đương giảm 5.2%. Chi tiết có trong file excel đính kèm.',
  },
];

type Approval = (typeof pendingApprovals)[0];

export default function ApprovalPage() {
  const { toast } = useToast();
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handleActionClick = (approval: Approval, type: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(type);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedApproval || !actionType) return;

    // Logic for approve/reject would go here
    
    setIsModalOpen(false);
    toast({
      title: actionType === 'approve' ? 'Đã duyệt thành công' : 'Đã từ chối KPI',
      description: `KPI "${selectedApproval.kpiName}" của ${selectedApproval.employeeName} đã được xử lý.`,
    });
    setSelectedApproval(null);
    setActionType(null);
  };

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
              {pendingApprovals.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.employeeName}</TableCell>
                  <TableCell>{item.kpiName}</TableCell>
                  <TableCell>{item.target}</TableCell>
                  <TableCell>{item.actual}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={item.completion > 100 ? 100 : item.completion} className="h-2" />
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
              ))}
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
                 <p className='text-sm p-3 bg-muted rounded-md'>{selectedApproval.submissionDetails}</p>
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="feedback">
                  Phản hồi (tùy chọn)
                </Label>
                <Textarea placeholder="Nhập phản hồi của bạn cho nhân viên..." id="feedback" />
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
