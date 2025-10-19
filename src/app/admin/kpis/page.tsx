'use client';

import React, { useState, useContext } from 'react';
import {
  PlusCircle,
} from 'lucide-react';

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
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { DataContext, Kpi } from '@/contexts/DataContext';

const KpiDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiToEdit?: Kpi | null;
}> = ({ open, onOpenChange, kpiToEdit }) => {
  const { toast } = useToast();
  const { addKpi, editKpi, getDepartments, getFrequencies } = useContext(DataContext);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState('');
  const [rewardPenaltyConfig, setRewardPenaltyConfig] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  const departments = getDepartments();
  const frequencies = getFrequencies();

  React.useEffect(() => {
    if (kpiToEdit && open) {
      setName(kpiToEdit.name);
      setDescription(kpiToEdit.description);
      setDepartment(kpiToEdit.department);
      setTarget(String(kpiToEdit.target));
      setUnit(kpiToEdit.unit);
      setFrequency(kpiToEdit.frequency);
      setRewardPenaltyConfig(kpiToEdit.rewardPenaltyConfig);
      setStatus(kpiToEdit.status);
    } else if (!open) {
      // Reset form when dialog closes
      setName('');
      setDescription('');
      setDepartment('');
      setTarget('');
      setUnit('');
      setFrequency('');
      setRewardPenaltyConfig('');
      setStatus('active');
    }
  }, [kpiToEdit, open]);

  const handleSave = () => {
    if (!name || !department || !target || !unit || !frequency) {
        toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Vui lòng điền đầy đủ các trường bắt buộc."
        });
        return;
    }
    
    const kpiData = {
      name,
      description,
      department,
      target: Number(target),
      unit,
      frequency,
      rewardPenaltyConfig,
      status,
    };

    if (kpiToEdit) {
      editKpi(kpiToEdit.id, kpiData);
      toast({ title: 'Thành công', description: 'Đã cập nhật KPI.' });
    } else {
      const newKpi: Omit<Kpi, 'id'> = kpiData;
      addKpi(newKpi);
      toast({ title: 'Thành công', description: 'Đã tạo KPI mới.' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-4 w-4" />
          Tạo KPI mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{kpiToEdit ? 'Sửa KPI' : 'Tạo KPI mới'}</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết để {kpiToEdit ? 'cập nhật' : 'thiết lập'} một KPI.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên KPI</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Tăng trưởng doanh thu"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Phòng ban</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả chi tiết mục tiêu, cách đo lường và ý nghĩa của KPI..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Mục tiêu</Label>
              <Input id="target" type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="100"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Input id="unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="%, VNĐ, sản phẩm..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Tần suất</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Chọn tần suất đo lường" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(freq => (
                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward-penalty">Cấu hình Thưởng/Phạt</Label>
              <Textarea
                id="reward-penalty"
                value={rewardPenaltyConfig}
                onChange={e => setRewardPenaltyConfig(e.target.value)}
                placeholder="VD: Đạt 100% thưởng 1M, dưới 80% phạt 500k"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'paused')}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="paused">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" onClick={handleSave}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const KpiDetailDialog: React.FC<{
    kpi: Kpi | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ kpi, open, onOpenChange, onEdit, onDelete }) => {
    if (!kpi) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{kpi.name}</DialogTitle>
                    <DialogDescription>{kpi.description || "Không có mô tả chi tiết."}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">Phòng ban</p>
                            <p className='font-semibold'>{kpi.department}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Mục tiêu</p>
                            <p className='font-semibold'>{kpi.target}{kpi.unit}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Tần suất</p>
                            <p className='font-semibold'>{kpi.frequency}</p>
                        </div>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground text-sm">Trạng thái</p>
                        <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
                            {kpi.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                        </Badge>
                    </div>
                    {kpi.rewardPenaltyConfig && (
                        <div className="space-y-1">
                            <p className="font-medium text-muted-foreground text-sm">Cấu hình Thưởng/Phạt</p>
                            <p className="text-sm p-3 bg-muted rounded-md">{kpi.rewardPenaltyConfig}</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
                    <Button variant="destructive" onClick={onDelete}>Xóa</Button>
                    <Button onClick={onEdit}>Sửa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function KpiListPage() {
  const { kpis, deleteKpi } = useContext(DataContext);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [kpiToEdit, setKpiToEdit] = useState<Kpi | null>(null);
  const [kpiToView, setKpiToView] = useState<Kpi | null>(null);
  const { toast } = useToast();

  const handleRowClick = (kpi: Kpi) => {
    setKpiToView(kpi);
    setDetailDialogOpen(true);
  };

  const handleEditClick = (kpi: Kpi) => {
    setDetailDialogOpen(false); // Close detail dialog
    setKpiToEdit(kpi);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (kpiId: string) => {
    setDetailDialogOpen(false); // Close detail dialog
    deleteKpi(kpiId);
    toast({
      variant: 'destructive',
      title: 'Đã xóa',
      description: 'Đã xóa KPI khỏi hệ thống.',
    });
  };

  const handleOpenEditDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setKpiToEdit(null);
    }
    setEditDialogOpen(isOpen);
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle>Quản lý KPI</CardTitle>
          <CardDescription>
            Xem, tạo và quản lý các chỉ số hiệu suất chính.
          </CardDescription>
        </div>
        <KpiDialog open={isEditDialogOpen} onOpenChange={handleOpenEditDialog} kpiToEdit={kpiToEdit} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên KPI</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Mục tiêu</TableHead>
              <TableHead>Tần suất</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((kpi) => (
              <TableRow key={kpi.id} onClick={() => handleRowClick(kpi)} className="cursor-pointer">
                <TableCell className="font-medium">{kpi.name}</TableCell>
                <TableCell>{kpi.department}</TableCell>
                <TableCell>{`${kpi.target}${kpi.unit}`}</TableCell>
                <TableCell>{kpi.frequency}</TableCell>
                <TableCell>
                  <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
                    {kpi.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {/* Actions are now in the detail dialog */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <KpiDetailDialog 
        kpi={kpiToView} 
        open={isDetailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
        onEdit={() => kpiToView && handleEditClick(kpiToView)}
        onDelete={() => kpiToView && handleDeleteClick(kpiToView.id)}
    />
    </>
  );
}
