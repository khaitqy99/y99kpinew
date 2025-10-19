'use client';

import React, { useState, useContext, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DataContext, KpiRecord as KpiRecordType, Kpi as KpiType } from '@/contexts/DataContext';
import { Progress } from '@/components/ui/progress';

export default function SubmitKpiPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { kpiRecords, kpis, submitKpiRecord } = useContext(DataContext);
  
  const recordId = params.id as string;

  const [kpiRecord, setKpiRecord] = useState<KpiRecordType | null>(null);
  const [kpi, setKpi] = useState<KpiType | null>(null);

  // Form state
  const [actualValue, setActualValue] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const record = kpiRecords.find(r => r.id === recordId);
    if (record) {
      const relatedKpi = kpis.find(k => k.id === record.kpiId);
      setKpiRecord(record);
      setKpi(relatedKpi || null);
      setActualValue(String(record.actual));
      setSubmissionDetails(record.submissionDetails);
    }
    setIsLoading(false);
  }, [recordId, kpiRecords, kpis]);

  const handleSubmit = () => {
    if (!kpiRecord) return;
    if (!submissionDetails.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập chi tiết/ghi chú trước khi nộp.',
      });
      return;
    }
    
    const submissionData = {
      actual: Number(actualValue),
      submissionDetails: submissionDetails,
      attachment: attachment ? attachment.name : null,
    };

    submitKpiRecord(kpiRecord.id, submissionData);
    
    toast({
      title: 'Nộp KPI thành công',
      description: `KPI "${kpi?.name}" đã được gửi đi để xét duyệt.`,
    });
    
    router.push('/employee/dashboard');
  };

  if (isLoading) {
      return <div>Đang tải...</div>
  }
  
  if (!kpiRecord || !kpi) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Không tìm thấy KPI</h2>
        <p className="text-muted-foreground">Không thể tìm thấy bản ghi KPI với ID này.</p>
        <Button asChild variant="link" className="mt-4">
            <Link href="/employee/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại Dashboard
            </Link>
        </Button>
      </div>
    );
  }
  
  const completionPercentage = kpi.target > 0 ? Math.round((Number(actualValue) / kpi.target) * 100) : 0;


  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-4">
            <Button asChild variant="ghost" size="sm">
                <Link href="/employee/kpis">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại danh sách KPI
                </Link>
            </Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Nộp Báo cáo KPI: {kpi.name}</CardTitle>
          <CardDescription>{kpi.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Mục tiêu</p>
                    <p className="text-lg font-semibold">{kpi.target}{kpi.unit}</p>
                </div>
                <div className="col-span-2">
                     <p className="text-sm font-medium text-muted-foreground mb-1">Tiến độ hoàn thành dự kiến</p>
                     <div className="flex items-center gap-2">
                         <Progress value={completionPercentage > 100 ? 100 : completionPercentage} className="h-2" />
                         <span className="font-semibold text-sm">{completionPercentage > 100 ? 100 : completionPercentage}%</span>
                     </div>
                </div>
            </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="actual-submit">Số liệu cuối cùng</Label>
            <div className="flex items-center gap-2">
                 <Input id="actual-submit" type="number" value={actualValue} onChange={(e) => setActualValue(e.target.value)} className="max-w-xs" />
                 <span className="text-muted-foreground">{kpi.unit}</span>
            </div>
          </div>
          <div className="grid w-full gap-2">
            <Label htmlFor="comment-submit">Chi tiết/Ghi chú (Bắt buộc)</Label>
            <Textarea 
              id="comment-submit" 
              value={submissionDetails} 
              onChange={(e) => setSubmissionDetails(e.target.value)} 
              placeholder="Thêm chi tiết, bằng chứng hoàn thành, hoặc giải trình kết quả..." 
              rows={5}
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="attachment-submit">Tệp đính kèm (Tùy chọn)</Label>
            <Input 
              id="attachment-submit" 
              type="file" 
              onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)} 
              className="max-w-md" 
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/employee/kpis">Hủy</Link>
          </Button>
          <Button onClick={handleSubmit}>Xác nhận Nộp</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
