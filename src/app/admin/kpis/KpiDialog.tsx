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
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, parseNumber } from '@/lib/utils';

const KpiDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiToEdit?: Kpi | null;
}> = React.memo(({ open, onOpenChange, kpiToEdit }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addKpi, editKpi, getDepartmentNames, getFrequencies } = useContext(SupabaseDataContext);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState('');
  const [rewardPenaltyConfig, setRewardPenaltyConfig] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  // Get translated frequency label
  const getFrequencyLabelTranslated = useCallback((frequency: string) => {
    const key = `kpis.frequency.${frequency?.toLowerCase()}`;
    const translated = t(key);
    return translated !== key ? translated : frequency;
  }, [t]);

  // Get translated status label
  const getStatusLabelTranslated = useCallback((status: string) => {
    const key = `kpis.status.${status?.toLowerCase()}`;
    const translated = t(key);
    return translated !== key ? translated : status;
  }, [t]);

  // Memoize expensive operations
  const departments = useMemo(() => getDepartmentNames(), []);
  const frequencies = useMemo(() => {
    const existing = getFrequencies();
    if (existing && existing.length > 0) return existing;
    return ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
  }, [getFrequencies]);

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
      setTarget(formatNumber(kpiToEdit.target));
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
            title: t('common.error'),
            description: t('kpis.fillRequiredFields')
        });
        return;
    }
    
    const kpiData = {
      name,
      description,
      department,
      departmentId: department, // Add departmentId for database mapping
      target: parseNumber(target),
      unit,
      frequency,
      rewardPenaltyConfig,
      status,
      createdBy: 'admin', // Default creator
      assignedTo: [], // Empty array for assigned employees
    };

    try {
      if (kpiToEdit) {
        await editKpi(kpiToEdit.id, kpiData as any);
        toast({ title: t('common.success'), description: t('kpis.saveSuccess') });
      } else {
        const newKpi: Omit<Kpi, 'id' | 'created_at' | 'updated_at'> = kpiData as any;
        await addKpi(newKpi as any);
        toast({ title: t('common.success'), description: t('kpis.createSuccess') });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('kpis.saveError'),
        description: e?.message || t('kpis.saveErrorDesc')
      })
    }
  }, [name, description, department, target, unit, frequency, rewardPenaltyConfig, status, kpiToEdit, editKpi, addKpi, toast, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-4 w-4" />
          {t('kpis.createNew')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{kpiToEdit ? t('kpis.edit') : t('kpis.createNew')}</DialogTitle>
          <DialogDescription>
            {kpiToEdit ? t('kpis.edit') : t('kpis.createNew')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('kpis.name')}</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Tăng trưởng doanh thu"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">{t('kpis.department')}</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder={t('kpis.selectDepartment')} />
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
            <Label htmlFor="description">{t('kpis.description')}</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả chi tiết mục tiêu, cách đo lường và ý nghĩa của KPI..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">{t('kpis.target')}</Label>
              <Input 
                id="target" 
                type="text" 
                value={target} 
                onChange={e => {
                  // Remove all non-digit characters except comma and dot
                  let value = e.target.value.replace(/[^\d,.]/g, '');
                  // Remove commas to parse, then format
                  const numValue = parseNumber(value);
                  if (value === '') {
                    setTarget('');
                  } else {
                    // Format with commas
                    const formatted = formatNumber(numValue);
                    setTarget(formatted);
                  }
                }} 
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">{t('kpis.unit')}</Label>
              <Input id="unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="%, VNĐ, sản phẩm..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">{t('kpis.frequency')}</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue placeholder={t('kpis.selectFrequency')} />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(freq => (
                    <SelectItem key={freq} value={freq}>{getFrequencyLabelTranslated(freq)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward-penalty">{t('kpis.rewardPenaltyConfig')}</Label>
              <Textarea
                id="reward-penalty"
                value={rewardPenaltyConfig}
                onChange={e => setRewardPenaltyConfig(e.target.value)}
                placeholder="VD: Đạt 100% thưởng 1M, dưới 80% phạt 500k"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('kpis.status')}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'paused')}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('kpis.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{getStatusLabelTranslated('active')}</SelectItem>
                  <SelectItem value="paused">{getStatusLabelTranslated('paused')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button type="submit" onClick={handleSave}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

KpiDialog.displayName = 'KpiDialog';

export default KpiDialog;
