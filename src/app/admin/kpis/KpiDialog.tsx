'use client';

import React, { useState, useContext, useMemo, useCallback } from 'react';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import type { Kpi } from '@/services/supabase-service';

const KpiDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiToEdit?: Kpi | null;
}> = React.memo(({ open, onOpenChange, kpiToEdit }) => {
  const { toast } = useToast();
  const { addKpi, editKpi, getDepartmentNames, getFrequencies } = useContext(SupabaseDataContext);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState('');
  const [rewardPenaltyConfig, setRewardPenaltyConfig] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  // Memoize expensive operations
  const departments = useMemo(() => getDepartmentNames(), []);
  const frequencies = useMemo(() => {
    const existing = getFrequencies();
    if (existing && existing.length > 0) return existing;
    return ['monthly', 'quarterly', 'annually'];
  }, []);

  // Optimize form reset
  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setDepartment('');
    setTarget('');
    setUnit('');
    setFrequency('');
    setRewardPenaltyConfig('');
    setStatus('active');
  }, []);

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
      resetForm();
    }
  }, [kpiToEdit, open]);

  const handleSave = useCallback(async () => {
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
      departmentId: department, // Add departmentId for database mapping
      target: Number(target),
      unit,
      frequency,
      category: 'performance', // Default category
      weight: 1, // Default weight
      rewardPenaltyConfig,
      status,
      createdBy: 'admin', // Default creator
      assignedTo: [], // Empty array for assigned employees
    };

    try {
      if (kpiToEdit) {
        await editKpi(kpiToEdit.id, kpiData as any);
        toast({ title: 'Thành công', description: 'Đã cập nhật KPI.' });
      } else {
        const newKpi: Omit<Kpi, 'id' | 'created_at' | 'updated_at'> = kpiData as any;
        await addKpi(newKpi as any);
        toast({ title: 'Thành công', description: 'Đã tạo KPI mới.' });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Không thể lưu KPI',
        description: e?.message || 'Đã xảy ra lỗi khi lưu KPI'
      })
    }
  }, [name, description, department, target, unit, frequency, rewardPenaltyConfig, status, kpiToEdit, editKpi, addKpi, toast, onOpenChange]);

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
});

KpiDialog.displayName = 'KpiDialog';

export default KpiDialog;
