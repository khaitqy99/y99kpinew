'use client';

import React, { useState, useContext, useCallback } from 'react';
import { Calendar, Target, TrendingUp, Save, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import type { Kpi, KpiRecord } from '@/services/supabase-service';

interface KpiProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: Kpi | null;
  recordToEdit?: KpiRecord | null;
}

const KpiProgressDialog: React.FC<KpiProgressDialogProps> = ({ 
  open, 
  onOpenChange, 
  kpi, 
  recordToEdit 
}) => {
  const { toast } = useToast();
  const { addKpiRecord, editKpiRecord } = useContext(SupabaseDataContext);
  
  const [actual, setActual] = useState('');
  const [period, setPeriod] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState('');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'pending_approval'>('in_progress');
  const [loading, setLoading] = useState(false);

  // Calculate progress percentage
  const progress = kpi && actual ? Math.round((Number(actual) / kpi.target) * 100) : 0;

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (recordToEdit) {
        setActual(String(recordToEdit.actual));
        setPeriod(recordToEdit.period);
        setSubmissionDetails(recordToEdit.submission_details);
        setStatus(recordToEdit.status as any);
      } else {
        // Set default period to current month
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setPeriod(currentPeriod);
        setActual('');
        setSubmissionDetails('');
        setStatus('in_progress');
      }
    }
  }, [open, recordToEdit]);

  const handleSave = useCallback(async () => {
    if (!kpi || !actual || !period) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ các trường bắt buộc."
      });
      return;
    }

    setLoading(true);
    try {
      const recordData = {
        kpi_id: kpi.id,
        employee_id: 'admin', // TODO: Get from context
        department_id: kpi.department_id,
        period,
        target: kpi.target,
        actual: Number(actual),
        progress,
        status,
        start_date: `${period}-01`,
        end_date: `${period}-31`, // Simplified - should calculate actual end date
        submission_date: new Date().toISOString(),
        submission_details: submissionDetails,
        feedback: [],
        bonus_amount: progress >= 100 ? 500000 : 0, // Simple bonus calculation
        penalty_amount: progress < 80 ? 200000 : 0, // Simple penalty calculation
        score: progress,
      };

      if (recordToEdit) {
        await editKpiRecord(recordToEdit.id, recordData as any);
        toast({ title: 'Thành công', description: 'Đã cập nhật tiến độ KPI.' });
      } else {
        await addKpiRecord(recordData as any);
        toast({ title: 'Thành công', description: 'Đã thêm tiến độ KPI mới.' });
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Không thể lưu tiến độ',
        description: error?.message || 'Đã xảy ra lỗi khi lưu tiến độ KPI'
      });
    } finally {
      setLoading(false);
    }
  }, [kpi, actual, period, submissionDetails, status, recordToEdit, addKpiRecord, editKpiRecord, toast, onOpenChange]);

  if (!kpi) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {recordToEdit ? 'Cập nhật tiến độ KPI' : 'Thêm tiến độ KPI'}
          </DialogTitle>
          <DialogDescription>
            Cập nhật tiến độ thực hiện cho KPI: <strong>{kpi.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* KPI Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{kpi.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Phòng ban: {kpi.department}</p>
              <p>Mục tiêu: {kpi.target}{kpi.unit}</p>
              <p>Tần suất: {kpi.frequency}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Kỳ báo cáo</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2024-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Chưa bắt đầu</SelectItem>
                  <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="pending_approval">Chờ duyệt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual">Kết quả thực tế</Label>
            <div className="flex items-center gap-2">
              <Input
                id="actual"
                type="number"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="Nhập kết quả thực tế"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">{kpi.unit}</span>
            </div>
          </div>

          {/* Progress Display */}
          {actual && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tiến độ:</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Mục tiêu: {kpi.target}{kpi.unit}</span>
                <span>Thực tế: {actual}{kpi.unit}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="submission-details">Chi tiết báo cáo</Label>
            <Textarea
              id="submission-details"
              value={submissionDetails}
              onChange={(e) => setSubmissionDetails(e.target.value)}
              placeholder="Mô tả chi tiết về tiến độ thực hiện, các khó khăn gặp phải, kế hoạch tiếp theo..."
              rows={4}
            />
          </div>

          {/* Bonus/Penalty Preview */}
          {actual && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Dự kiến thưởng/phạt:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Thưởng:</span>
                  <span className={`font-medium ${progress >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {progress >= 100 ? '500,000 VNĐ' : '0 VNĐ'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phạt:</span>
                  <span className={`font-medium ${progress < 80 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {progress < 80 ? '200,000 VNĐ' : '0 VNĐ'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {recordToEdit ? 'Cập nhật' : 'Lưu'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KpiProgressDialog;
