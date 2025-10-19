'use client';

import React, { useState, useContext, useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
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
import { FileCheck, MessageSquare, RefreshCw } from 'lucide-react';
import { SessionContext } from '@/contexts/SessionContext';
import { DataContext, KpiRecord } from '@/contexts/DataContext';

type MappedKpi = KpiRecord & {
    name: string;
    targetFormatted: string;
    actualFormatted: string;
};

const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  not_started: { label: 'Chưa bắt đầu', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
  overdue: { label: 'Quá hạn', variant: 'destructive' },
};

export default function EmployeeKpisPage() {
  const { toast } = useToast();
  const { user } = useContext(SessionContext);
  const { kpiRecords, kpis, updateKpiRecord, updateKpiRecordStatus } = useContext(DataContext);
  
  const [selectedKpi, setSelectedKpi] = useState<MappedKpi | null>(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [actualValue, setActualValue] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState('');

  const kpiData = useMemo(() => {
    if (!user?.id) return [];
    return kpiRecords
        .filter(record => record.employeeId === user.id)
        .map(record => {
            const kpi = kpis.find(k => k.id === record.kpiId);
            return {
                ...record,
                name: kpi?.name || 'N/A',
                targetFormatted: `${kpi?.target}${kpi?.unit}`,
                actualFormatted: `${record.actual}${kpi?.unit}`,
            }
        })
        .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [user?.id, kpiRecords, kpis]);

  const handleUpdateClick = (kpi: MappedKpi) => {
    setSelectedKpi(kpi);
    setActualValue(String(kpi.actual));
    setSubmissionDetails(kpi.submissionDetails);
    setUpdateModalOpen(true);
  };
  
  const handleFeedbackClick = (kpi: MappedKpi) => {
    setSelectedKpi(kpi);
    setFeedbackModalOpen(true);
  }

  const handleSaveChanges = () => {
    if (!selectedKpi) return;
    
    updateKpiRecord(selectedKpi.id, {
        actual: Number(actualValue),
        submissionDetails: submissionDetails,
    });

    toast({
      title: 'Cập nhật thành công',
      description: `Tiến độ cho KPI "${selectedKpi?.name}" đã được lưu.`,
    });
    setUpdateModalOpen(false);
  };
  
  const handleSubmit = (kpi: MappedKpi) => {
    if (kpi.status === 'pending_approval') {
        toast({
            variant: 'destructive',
            title: 'Đã nộp',
            description: `KPI này đã được nộp và đang chờ duyệt.`
        });
        return;
    }
    
    updateKpiRecordStatus(kpi.id, 'pending_approval');

    toast({
        title: 'Nộp KPI thành công',
        description: `KPI "${kpi.name}" đã được gửi đi để xét duyệt.`,
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>KPI của tôi</CardTitle>
          <CardDescription>
            Danh sách tất cả các chỉ số hiệu suất (KPI) được giao cho bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">Tên KPI</TableHead>
                <TableHead>Mục tiêu</TableHead>
                <TableHead>Thực tế</TableHead>
                <TableHead>Hạn chót</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiData.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell className="font-medium">{kpi.name}</TableCell>
                  <TableCell>{kpi.targetFormatted}</TableCell>
                  <TableCell>{kpi.actual > 0 ? kpi.actualFormatted : 'Chưa cập nhật'}</TableCell>
                  <TableCell>{format(new Date(kpi.endDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[kpi.status]?.variant || 'default'}>
                      {statusConfig[kpi.status]?.label || 'Không xác định'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleUpdateClick(kpi)}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                     <Button variant="secondary" size="sm" onClick={() => handleSubmit(kpi)} disabled={kpi.status === 'pending_approval'}>
                        <FileCheck className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleFeedbackClick(kpi)}>
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Progress Modal */}
      {selectedKpi && (
        <Dialog open={isUpdateModalOpen} onOpenChange={setUpdateModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Cập nhật tiến độ KPI</DialogTitle>
              <DialogDescription>{selectedKpi.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="actual" className="text-right">
                  Thực tế đạt được
                </Label>
                <Input id="actual" value={actualValue} onChange={(e) => setActualValue(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="comment" className="text-right pt-2">
                  Chi tiết/Ghi chú
                </Label>
                <Textarea id="comment" value={submissionDetails} onChange={(e) => setSubmissionDetails(e.target.value)} placeholder="Thêm chi tiết hoặc bằng chứng hoàn thành (VD: link báo cáo, file đính kèm...)" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
              <Button onClick={handleSaveChanges}>Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Feedback Modal */}
      {selectedKpi && (
        <Dialog open={isFeedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Feedback cho KPI</DialogTitle>
              <DialogDescription>{selectedKpi.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
              {selectedKpi.feedback.length > 0 ? (
                selectedKpi.feedback.map((fb, index) => (
                  <div key={index} className="space-y-1 rounded-md bg-muted p-3">
                    <p className="text-sm font-semibold">{fb.author}</p>
                    <p className="text-sm text-muted-foreground">{fb.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Chưa có feedback nào.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setFeedbackModalOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
