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
import { kpiRecords } from '@/data/kpiRecords';
import { employees } from '@/data/employees';
import { kpis } from '@/data/kpis';

const pendingApprovals = kpiRecords.filter(r => r.status === 'pending_approval').map(record => {
    const employee = employees.find(e => e.id === record.employeeId);
    const kpi = kpis.find(k => k.id === record.kpiId);
    const completion = record.target > 0 ? Math.round((record.actual / record.target) * 100) : 100;
    return {
        ...record,
        employeeName: employee?.name || 'N/A',
        kpiName: kpi?.name || 'N/A',
        targetFormatted: `${kpi?.target}${kpi?.unit}`,
        actualFormatted: `${record.actual}${kpi?.unit}`,
        completion: completion > 100 ? 100 : completion,
    }
});


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
