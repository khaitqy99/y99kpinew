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
import { useToast } from '@/hooks/use-toast';
import { FileCheck, MessageSquare, RefreshCw, Loader2 } from 'lucide-react';
import { SessionContext } from '@/contexts/SessionContext';
import { DataContext, KpiRecord as KpiRecordType, Kpi as KpiType } from '@/contexts/DataContext';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { uploadFile } from '@/ai/flows/upload-file';


type MappedKpi = KpiRecordType & {
    name: string;
    description: string;
    targetFormatted: string;
    actualFormatted: string;
    unit: string;
    completionPercentage: number;
};

// Helper function to convert file to base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

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
  const { kpiRecords, kpis, updateKpiRecordActual, submitKpiRecord } = useContext(DataContext);
  
  const [selectedKpi, setSelectedKpi] = useState<MappedKpi | null>(null);
  
  // Dialog states
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isSubmitModalOpen, setSubmitModalOpen] = useState(false);
  
  // Form states
  const [actualValue, setActualValue] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const kpiData: MappedKpi[] = useMemo(() => {
    if (!user?.id) return [];
    return kpiRecords
        .filter(record => record.employeeId === user.id)
        .map(record => {
            const kpi = kpis.find(k => k.id === record.kpiId) || {} as KpiType;
            const completion = record.target > 0 ? Math.max(0, Math.min(100, Math.round((record.actual / record.target) * 100))) : 0;
            return {
                ...record,
                name: kpi.name || 'N/A',
                description: kpi.description || '',
                targetFormatted: `${kpi.target}${kpi.unit}`,
                actualFormatted: `${record.actual}${kpi.unit}`,
                unit: kpi.unit || '',
                completionPercentage: completion,
            }
        })
        .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [user?.id, kpiRecords, kpis]);

  const handleRowClick = (kpi: MappedKpi) => {
    setSelectedKpi(kpi);
    setDetailModalOpen(true);
  }

  // --- DIALOG HANDLERS ---
  const handleUpdateClick = () => {
    if (!selectedKpi) return;
    setActualValue(String(selectedKpi.actual));
    setUpdateModalOpen(true);
  };
  
  const handleFeedbackClick = () => {
    if (!selectedKpi) return;
    setFeedbackModalOpen(true);
  }

  const handleSubmitClick = () => {
    if (!selectedKpi) return;
    setActualValue(String(selectedKpi.actual));
    setSubmissionDetails('');
    setAttachment(null);
    setSubmitModalOpen(true);
  };

  // --- ACTION HANDLERS ---
  const handleUpdateActual = () => {
    if (!selectedKpi) return;
    
    const newActual = Number(actualValue);
    updateKpiRecordActual(selectedKpi.id, newActual);
    
    // Optimistically update local state
    setSelectedKpi(prev => prev ? { 
        ...prev, 
        actual: newActual, 
        actualFormatted: `${newActual}${prev.unit}`,
        completionPercentage: prev.target > 0 ? Math.max(0, Math.min(100, Math.round((newActual / prev.target) * 100))) : 0,
        status: prev.status === 'not_started' ? 'in_progress' : prev.status
    } : null);

    toast({
      title: 'Cập nhật thành công',
      description: `Tiến độ cho KPI "${selectedKpi?.name}" đã được lưu.`,
    });
    setUpdateModalOpen(false);
  };
  
  const handleConfirmSubmit = async () => {
    if (!selectedKpi) return;
    if (!submissionDetails.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập chi tiết/ghi chú trước khi nộp.',
      });
      return;
    }
  
    setIsSubmitting(true);
    let attachmentUrl: string | null = null;
  
    try {
      if (attachment) {
        toast({ title: 'Đang tải tệp lên...', description: 'Vui lòng chờ trong giây lát.' });
        const fileContent = await toBase64(attachment);
        const response = await uploadFile({
          fileName: attachment.name,
          fileContent: fileContent,
          mimeType: attachment.type,
        });
        attachmentUrl = response.fileUrl;
      }
  
      const submissionData = {
        actual: Number(actualValue),
        submissionDetails,
        attachment: attachmentUrl,
      };
  
      submitKpiRecord(selectedKpi.id, submissionData);
  
      toast({
        title: 'Nộp KPI thành công',
        description: `KPI "${selectedKpi.name}" đã được gửi đi để xét duyệt.`,
      });
  
      setSubmitModalOpen(false);
      setDetailModalOpen(false); // Close detail modal as well
  
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        variant: 'destructive',
        title: 'Đã xảy ra lỗi',
        description: 'Không thể nộp KPI. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>KPI của tôi</CardTitle>
          <CardDescription>
            Danh sách tất cả các chỉ số hiệu suất (KPI) được giao cho bạn. Nhấp vào một hàng để xem chi tiết.
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
                <TableHead className='text-right'>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiData.map((kpi) => (
                <TableRow key={kpi.id} onClick={() => handleRowClick(kpi)} className="cursor-pointer">
                  <TableCell className="font-medium">{kpi.name}</TableCell>
                  <TableCell>{kpi.targetFormatted}</TableCell>
                  <TableCell>{kpi.actual > 0 ? kpi.actualFormatted : 'Chưa cập nhật'}</TableCell>
                  <TableCell>{format(new Date(kpi.endDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusConfig[kpi.status]?.variant || 'default'}>
                      {statusConfig[kpi.status]?.label || 'Không xác định'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Detail Modal */}
      {selectedKpi && (
        <Dialog open={isDetailModalOpen} onOpenChange={setDetailModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedKpi.name}</DialogTitle>
                    <DialogDescription>{selectedKpi.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Mục tiêu</p>
                            <p className="text-lg font-semibold">{selectedKpi.targetFormatted}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Thực tế</p>
                            <p className="text-lg font-semibold">{selectedKpi.actual > 0 ? selectedKpi.actualFormatted : 'Chưa có'}</p>
                        </div>
                         <div className="col-span-2">
                             <p className="text-sm font-medium text-muted-foreground mb-1">Tiến độ hoàn thành</p>
                             <div className="flex items-center gap-2">
                                 <Progress value={selectedKpi.completionPercentage} className="h-2" />
                                 <span className="font-semibold text-sm">{selectedKpi.completionPercentage}%</span>
                             </div>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">Trạng thái</p>
                            <Badge variant={statusConfig[selectedKpi.status]?.variant || 'default'}>
                              {statusConfig[selectedKpi.status]?.label || 'Không xác định'}
                            </Badge>
                        </div>
                         <div>
                            <p className="font-medium text-muted-foreground">Kỳ</p>
                            <p>{selectedKpi.period}</p>
                        </div>
                         <div>
                            <p className="font-medium text-muted-foreground">Thời gian</p>
                            <p>{format(new Date(selectedKpi.startDate), 'dd/MM/yy')} - {format(new Date(selectedKpi.endDate), 'dd/MM/yy')}</p>
                        </div>
                    </div>
                    
                    {selectedKpi.submissionDetails && (
                        <div>
                             <p className="font-medium text-muted-foreground text-sm">Chi tiết/Ghi chú đã nộp</p>
                             <p className="text-sm p-3 bg-muted rounded-md mt-1">{selectedKpi.submissionDetails}</p>
                        </div>
                    )}

                    {selectedKpi.attachment && (
                      <div>
                        <p className="font-medium text-muted-foreground text-sm">Tệp đính kèm</p>
                        <p className="text-sm p-3 bg-muted rounded-md mt-1">{selectedKpi.attachment}</p>
                      </div>
                    )}
                    
                    <div>
                        <p className="font-medium text-muted-foreground text-sm">Phản hồi từ quản lý</p>
                        <div className="grid gap-2 py-2 max-h-[150px] overflow-y-auto">
                            {selectedKpi.feedback.length > 0 ? (
                                selectedKpi.feedback.map((fb, index) => (
                                <div key={index} className="space-y-1 rounded-md bg-muted p-3 text-sm">
                                    <p className="font-semibold">{fb.author}</p>
                                    <p className="text-muted-foreground">{fb.comment}</p>
                                </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Chưa có feedback nào.</p>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className='justify-end flex sm:justify-end gap-2'>
                    <Button variant="outline" onClick={handleFeedbackClick}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Xem Feedback
                    </Button>
                    <Button variant="outline" onClick={handleUpdateClick} disabled={selectedKpi.status === 'pending_approval' || selectedKpi.status === 'completed'}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Cập nhật
                    </Button>
                    <Button onClick={handleSubmitClick} disabled={selectedKpi.status === 'pending_approval' || selectedKpi.status === 'completed'}>
                       <FileCheck className="mr-2 h-4 w-4" /> Nộp KPI
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}


      {/* Update Progress Modal */}
      {selectedKpi && (
        <Dialog open={isUpdateModalOpen} onOpenChange={setUpdateModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cập nhật tiến độ</DialogTitle>
              <DialogDescription>{selectedKpi.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="actual-update" className="text-right">
                  Thực tế đạt được
                </Label>
                 <div className='col-span-3 flex items-center gap-2'>
                    <Input id="actual-update" value={actualValue} onChange={(e) => setActualValue(e.target.value)} />
                    <span>{selectedKpi.unit}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
                <Button onClick={handleUpdateActual}>Lưu thay đổi</Button>
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

      {/* Submit KPI Modal */}
      {selectedKpi && (
        <Dialog open={isSubmitModalOpen} onOpenChange={setSubmitModalOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Nộp Báo cáo KPI: {selectedKpi.name}</DialogTitle>
              <DialogDescription>{selectedKpi.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <div className="grid w-full items-center gap-2">
                    <Label htmlFor="actual-submit-kpi-page">Số liệu cuối cùng</Label>
                    <div className="flex items-center gap-2">
                        <Input id="actual-submit-kpi-page" type="number" value={actualValue} onChange={(e) => setActualValue(e.target.value)} className="max-w-xs" />
                        <span className="text-muted-foreground">{selectedKpi.unit}</span>
                    </div>
                </div>
                <div className="grid w-full gap-2">
                    <Label htmlFor="comment-submit-kpi-page">Chi tiết/Ghi chú (Bắt buộc)</Label>
                    <Textarea 
                        id="comment-submit-kpi-page" 
                        value={submissionDetails} 
                        onChange={(e) => setSubmissionDetails(e.target.value)} 
                        placeholder="Thêm chi tiết, bằng chứng hoàn thành, hoặc giải trình kết quả..." 
                        rows={5}
                    />
                </div>
                <div className="grid w-full items-center gap-2">
                    <Label htmlFor="attachment-submit-kpi-page">Tệp đính kèm (Tùy chọn)</Label>
                    <Input 
                        id="attachment-submit-kpi-page" 
                        type="file" 
                        onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)} 
                        className="max-w-md" 
                    />
                </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmitModalOpen(false)} disabled={isSubmitting}>Hủy</Button>
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Đang nộp...' : 'Xác nhận Nộp'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
