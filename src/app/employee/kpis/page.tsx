'use client';

import React, { useState, useContext } from 'react';
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
import { kpis } from '@/data/kpis';
import { kpiRecords } from '@/data/kpiRecords';
import { SessionContext } from '@/contexts/SessionContext';

type Kpi = ReturnType<typeof getEmployeeKpis>[0];

const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  not_started: { label: 'Chưa bắt đầu', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
  overdue: { label: 'Quá hạn', variant: 'destructive' },
};

const getEmployeeKpis = (employeeId: string | undefined) => {
    if (!employeeId) return [];
    return kpiRecords
        .filter(record => record.employeeId === employeeId)
        .map(record => {
            const kpi = kpis.find(k => k.id === record.kpiId);
            return {
                ...record,
                name: kpi?.name || 'N/A',
                targetFormatted: `${kpi?.target}${kpi?.unit}`,
                actualFormatted: `${record.actual}${kpi?.unit}`,
            }
        });
}


export default function EmployeeKpisPage() {
  const { toast } = useToast();
  const { user } = useContext(SessionContext);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);

  const kpiData = getEmployeeKpis(user?.id);

  const handleUpdateClick = (kpi: Kpi) => {
    setSelectedKpi(kpi);
    setUpdateModalOpen(true);
  };

  const handleSaveChanges = () => {
    // Logic to save changes would go here
    toast({
      title: 'Cập nhật thành công',
      description: `Tiến độ cho KPI "${selectedKpi?.name}" đã được lưu.`,
    });
    setUpdateModalOpen(false);
  };
  
  const handleSubmit = (kpi: Kpi) => {
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
                     <Button variant="secondary" size="sm" onClick={() => handleSubmit(kpi)}>
                        <FileCheck className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                  Thực tế
                </Label>
                <Input id="actual" defaultValue={selectedKpi.actual} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="comment" className="text-right pt-2">
                  Ghi chú
                </Label>
                <Textarea id="comment" placeholder="Thêm ghi chú về tiến độ của bạn..." className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
              <Button onClick={handleSaveChanges}>Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
