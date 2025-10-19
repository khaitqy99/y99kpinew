'use client';

import React, { useState } from 'react';
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
  DialogTrigger,
  DialogClose,
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

const kpiData = [
  {
    id: 'KPI-004',
    name: 'Hoàn thành báo cáo phân tích đối thủ cạnh tranh',
    target: '1 báo cáo',
    actual: '0.75 báo cáo',
    status: 'in_progress',
    deadline: '2024-07-30',
  },
  {
    id: 'KPI-005',
    name: 'Tăng 15% lượng khách hàng tiềm năng',
    target: '15%',
    actual: '6%',
    status: 'in_progress',
    deadline: '2024-07-15',
  },
  {
    id: 'KPI-006',
    name: 'Đạt chứng chỉ chuyên môn mới',
    target: '1 chứng chỉ',
    actual: '1 chứng chỉ',
    status: 'pending_approval',
    deadline: '2024-06-20',
  },
  {
    id: 'KPI-007',
    name: 'Giảm 5% thời gian xử lý yêu cầu khách hàng',
    target: 'Giảm 5%',
    actual: 'Giảm 5.2%',
    status: 'completed',
    deadline: '2024-05-31',
  },
  {
    id: 'KPI-008',
    name: 'Triển khai chiến dịch marketing hè',
    target: '1 chiến dịch',
    actual: 'Chưa cập nhật',
    status: 'not_started',
    deadline: '2024-08-15',
  },
];

type Kpi = (typeof kpiData)[0];

const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  not_started: { label: 'Chưa bắt đầu', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
  overdue: { label: 'Quá hạn', variant: 'destructive' },
};


export default function EmployeeKpisPage() {
  const { toast } = useToast();
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);

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
                  <TableCell>{kpi.target}</TableCell>
                  <TableCell>{kpi.actual}</TableCell>
                  <TableCell>{format(new Date(kpi.deadline), 'dd/MM/yyyy')}</TableCell>
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
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button onClick={handleSaveChanges}>Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
