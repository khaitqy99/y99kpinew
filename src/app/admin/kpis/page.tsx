'use client';

import React, { useState, useContext } from 'react';
import {
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const { kpis, addKpi, editKpi, getDepartments, getFrequencies } = useContext(DataContext);
  
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
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Tạo KPI mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{kpiToEdit ? 'Sửa KPI' : 'Tạo KPI mới'}</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết để {kpiToEdit ? 'cập nhật' : 'thiết lập'} một KPI.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên KPI
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Mô tả
            </Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Phòng ban
            </Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger id="department" className="col-span-3">
                <SelectValue placeholder="Chọn phòng ban" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dep => (
                  <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Mục tiêu</Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
              <Input id="target" type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="100"/>
              <Input id="unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="%, VNĐ,..." />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              Tần suất
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="frequency" className="col-span-3">
                <SelectValue placeholder="Chọn tần suất đo lường" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map(freq => (
                  <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Trạng thái
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'paused')}>
              <SelectTrigger id="status" className="col-span-3">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="active">Đang hoạt động</SelectItem>
                 <SelectItem value="paused">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="reward-penalty" className="text-right pt-2">
              Thưởng/Phạt
            </Label>
            <Textarea
              id="reward-penalty"
              value={rewardPenaltyConfig}
              onChange={e => setRewardPenaltyConfig(e.target.value)}
              placeholder="Cấu hình quy tắc thưởng/phạt"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" onClick={handleSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function KpiListPage() {
  const { kpis, deleteKpi } = useContext(DataContext);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [kpiToEdit, setKpiToEdit] = useState<Kpi | null>(null);
  const { toast } = useToast();

  const handleEditClick = (kpi: Kpi) => {
    setKpiToEdit(kpi);
    setDialogOpen(true);
  };

  const handleDeleteClick = (kpiId: string) => {
    deleteKpi(kpiId);
    toast({
      variant: 'destructive',
      title: 'Đã xóa',
      description: 'Đã xóa KPI khỏi hệ thống.',
    });
  };

  const handleOpenDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setKpiToEdit(null);
    }
    setDialogOpen(isOpen);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý KPI</CardTitle>
            <CardDescription>
              Xem, tạo và quản lý các chỉ số hiệu suất chính.
            </CardDescription>
          </div>
          <KpiDialog open={isDialogOpen} onOpenChange={handleOpenDialog} kpiToEdit={kpiToEdit} />
        </div>
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
              <TableRow key={kpi.id}>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditClick(kpi)}>Sửa</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(kpi.id)} className="text-destructive">Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
