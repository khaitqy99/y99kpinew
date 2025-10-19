'use client';

import React, { useContext, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  FileCheck,
  MessageSquare,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SessionContext } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataContext, KpiRecord as KpiRecordType, Kpi as KpiType } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

type MappedKpi = KpiRecordType & {
    name: string;
    description: string;
    targetFormatted: string;
    actualFormatted: string;
    unit: string;
    completionPercentage: number;
};

const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  not_started: { label: 'Chưa bắt đầu', variant: 'secondary' },
  in_progress: { label: 'Đang thực hiện', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
  overdue: { label: 'Quá hạn', variant: 'destructive' },
};

export default function EmployeeDashboardPage() {
  const { user } = useContext(SessionContext);
  const { kpiRecords, kpis, notifications, updateKpiRecordActual, submitKpiRecord } = useContext(DataContext);
  const { toast } = useToast();
  
  const [selectedKpi, setSelectedKpi] = useState<MappedKpi | null>(null);
  
  // Dialog states
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isSubmitModalOpen, setSubmitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  
  // Form states
  const [actualValue, setActualValue] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);


  const employeeKpiRecords = useMemo(() => 
    kpiRecords.filter(r => r.employeeId === user?.id), 
    [kpiRecords, user?.id]
  );

  const kpiData: MappedKpi[] = useMemo(() => 
    employeeKpiRecords.map(record => {
      const kpi = kpis.find(k => k.id === record.kpiId) || {} as KpiType;
      const progress = record.target > 0 ? Math.round((record.actual / record.target) * 100) : 0;
      return {
          ...record,
          name: kpi.name || 'N/A',
          description: kpi.description || 'Không có mô tả',
          targetFormatted: `${kpi.target}${kpi.unit}`,
          actualFormatted: `${record.actual}${kpi.unit}`,
          unit: kpi.unit || '',
          completionPercentage: progress > 100 ? 100 : progress,
      }
    }),
    [employeeKpiRecords, kpis]
  );

  const completedCount = employeeKpiRecords.filter(r => r.status === 'completed').length;
  const pendingCount = employeeKpiRecords.filter(r => r.status === 'pending_approval').length;
  const overdueCount = employeeKpiRecords.filter(r => r.status === 'overdue').length;
  const totalCount = employeeKpiRecords.length;
  
  const userNotifications = useMemo(() => 
    notifications.filter(n => n.recipientId === user?.id || n.recipientId === 'all'),
    [notifications, user?.id]
  );

  const handleKpiItemClick = (kpi: MappedKpi) => {
    setSelectedKpi(kpi);
    setDetailModalOpen(true);
  }

  // --- DIALOG HANDLERS ---
  const handleUpdateClick = () => {
    if (!selectedKpi) return;
    setActualValue(String(selectedKpi.actual));
    setUpdateModalOpen(true);
  };
  
  const handleSubmitClick = () => {
    if (!selectedKpi) return;
    setActualValue(String(selectedKpi.actual));
    setSubmissionDetails(selectedKpi.submissionDetails);
    setAttachment(null);
    setSubmitModalOpen(true);
  };

  const handleFeedbackClick = () => {
    if (!selectedKpi) return;
    setFeedbackModalOpen(true);
  }

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
  
  const handleSubmitKpi = () => {
    if (!selectedKpi) return;
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

    submitKpiRecord(selectedKpi.id, submissionData);
    
    // Optimistically update local state and close all modals
    setSelectedKpi(prev => prev ? { ...prev, ...submissionData, status: 'pending_approval' } : null);

    toast({
        title: 'Nộp KPI thành công',
        description: `KPI "${selectedKpi.name}" đã được gửi đi để xét duyệt.`,
    });
    setSubmitModalOpen(false);
    setDetailModalOpen(false);
  }

  return (
    <>
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                KPI Hoàn thành
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">
                trong tổng số {totalCount} KPI được giao
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Đang chờ duyệt
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                KPI đã được nộp
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
              <p className="text-xs text-muted-foreground">
                KPI chưa hoàn thành
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>KPI Cá Nhân</CardTitle>
                <CardDescription>
                  Theo dõi tiến độ và quản lý các KPI của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {kpiData.map((kpi) => (
                  <div key={kpi.id} onClick={() => handleKpiItemClick(kpi)} className="cursor-pointer hover:bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{kpi.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        Hạn chót: {format(new Date(kpi.endDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={kpi.completionPercentage} className="h-2" />
                      <span className="text-lg font-bold w-16 text-right">
                        {kpi.completionPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
                {kpiData.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">Bạn chưa được giao KPI nào.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Thông báo</CardTitle>
                <CardDescription>
                  Các cập nhật và phản hồi gần đây.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-8 w-8 border">
                           <AvatarImage src={notification.actor.avatar} alt="Avatar" />
                          <AvatarFallback>
                            {notification.actor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p>
                            <span className="font-semibold">
                              {notification.actor.name}
                            </span>{' '}
                            {notification.action}{' '}
                            <span className="font-medium text-primary">
                              {notification.target}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                      {index < userNotifications.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>

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
                <DialogFooter className='sm:justify-between items-center'>
                    <div className='flex gap-2'>
                        <Button variant="ghost" onClick={handleFeedbackClick}>
                            <MessageSquare className="mr-2 h-4 w-4" /> Xem Feedback
                        </Button>
                    </div>
                    <div className='flex gap-2'>
                         <Button variant="outline" onClick={handleUpdateClick} disabled={selectedKpi.status === 'pending_approval' || selectedKpi.status === 'completed'}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Cập nhật
                        </Button>
                        <Button onClick={handleSubmitClick} disabled={selectedKpi.status === 'pending_approval' || selectedKpi.status === 'completed'}>
                            <FileCheck className="mr-2 h-4 w-4" /> Nộp KPI
                        </Button>
                    </div>
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
                <Input id="actual-update" value={actualValue} onChange={(e) => setActualValue(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
                <Button onClick={handleUpdateActual}>Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Submit KPI Modal */}
      {selectedKpi && (
        <Dialog open={isSubmitModalOpen} onOpenChange={setSubmitModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Nộp Báo cáo KPI</DialogTitle>
              <DialogDescription>{selectedKpi.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="actual-submit" className="text-right">
                  Số liệu cuối cùng
                </Label>
                <Input id="actual-submit" value={actualValue} onChange={(e) => setActualValue(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="comment-submit" className="text-right pt-2">
                  Chi tiết/Ghi chú
                </Label>
                <Textarea id="comment-submit" value={submissionDetails} onChange={(e) => setSubmissionDetails(e.target.value)} placeholder="Bắt buộc: Thêm chi tiết hoặc bằng chứng hoàn thành..." className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="attachment-submit" className="text-right">
                    Tệp đính kèm
                  </Label>
                  <Input 
                    id="attachment-submit" 
                    type="file" 
                    onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)} 
                    className="col-span-3" 
                  />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmitKpi}>Xác nhận Nộp</Button>
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
    </>
  );
}
