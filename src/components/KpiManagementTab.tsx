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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import type { Kpi } from '@/services/supabase-service';
import { getFrequencyLabel } from '@/lib/utils';

export function KpiManagementTab() {
  const { toast } = useToast();
  const { 
      departments, addKpi,
  } = useContext(SupabaseDataContext);

  // Define frequencies manually since getFrequencies might not be available
  const kpiFrequencies = ['monthly', 'quarterly', 'annually'];

  // State for KPI Creation
  const [kpiName, setKpiName] = useState('');
  const [kpiDescription, setKpiDescription] = useState('');
  const [kpiDepartment, setKpiDepartment] = useState('');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiFrequency, setKpiFrequency] = useState('');
  const [kpiRewardPenalty, setKpiRewardPenalty] = useState('');

  const handleCreateKpi = () => {
    if (!kpiName || !kpiDepartment || !kpiTarget || !kpiUnit || !kpiFrequency) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ các trường bắt buộc.' });
        return;
    }
    const selectedDept = departments.find(d => d.name === kpiDepartment);
    if (!selectedDept) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Phòng ban không hợp lệ.' });
        return;
    }
    const newKpi: Omit<Kpi, 'id' | 'created_at' | 'updated_at'> = {
        name: kpiName,
        description: kpiDescription,
        department: kpiDepartment,
        department_id: selectedDept.id,
        target: Number(kpiTarget),
        unit: kpiUnit,
        frequency: kpiFrequency as 'monthly' | 'quarterly' | 'annually',
        status: 'active',
        reward_penalty_config: kpiRewardPenalty,
        created_by: 'admin', // This should be the current user ID
        assigned_to: [],
        is_active: true,
    } as any;
    addKpi(newKpi);
    // Reset form
    setKpiName('');
    setKpiDescription('');
    setKpiDepartment('');
    setKpiTarget('');
    setKpiUnit('');
    setKpiFrequency('');
    setKpiRewardPenalty('');
    toast({
        title: 'Thành công!',
        description: 'Đã tạo KPI mới.'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo KPI mới</CardTitle>
        <CardDescription>
          Điền thông tin chi tiết để thiết lập một KPI mới cho toàn công ty.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kpi-name">Tên KPI</Label>
          <Input id="kpi-name" value={kpiName} onChange={e => setKpiName(e.target.value)} placeholder="VD: Tăng trưởng doanh thu" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kpi-description">Mô tả</Label>
          <Textarea id="kpi-description" value={kpiDescription} onChange={e => setKpiDescription(e.target.value)} placeholder="Mô tả chi tiết về KPI..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kpi-department">Phòng ban chịu trách nhiệm</Label>
          <Select value={kpiDepartment} onValueChange={setKpiDepartment}>
            <SelectTrigger id="kpi-department">
            <SelectValue placeholder="Chọn phòng ban" />
            </SelectTrigger>
            <SelectContent>
            {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kpi-target">Mục tiêu</Label>
            <Input id="kpi-target" type="number" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} placeholder="VD: 15" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kpi-unit">Đơn vị</Label>
            <Input id="kpi-unit" value={kpiUnit} onChange={e => setKpiUnit(e.target.value)} placeholder="%, VNĐ, sản phẩm,..." />
          </div>
           <div className="space-y-2">
            <Label htmlFor="kpi-frequency">Tần suất đo lường</Label>
             <Select value={kpiFrequency} onValueChange={setKpiFrequency}>
              <SelectTrigger id="kpi-frequency">
                <SelectValue placeholder="Chọn tần suất" />
              </SelectTrigger>
              <SelectContent>
              {kpiFrequencies.map(freq => (
                <SelectItem key={freq} value={freq}>{getFrequencyLabel(freq)}</SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kpi-reward-penalty">Cấu hình Thưởng/Phạt</Label>
          <Textarea id="kpi-reward-penalty" value={kpiRewardPenalty} onChange={e => setKpiRewardPenalty(e.target.value)} placeholder="VD: Đạt 100% target thưởng 1M, dưới 80% phạt 500k..." />
        </div>
         <div className='flex justify-end'>
          <Button onClick={handleCreateKpi}>
            <PlusCircle className='h-4 w-4 mr-2' /> Lưu KPI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
