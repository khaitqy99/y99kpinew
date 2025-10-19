'use client';

import React, { useContext, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SessionContext } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataContext, KpiRecord as KpiRecordType, Kpi as KpiType } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

type MappedKpi = KpiRecordType & {
    name: string;
    description: string;
    targetFormatted: string;
    actualFormatted: string;
    unit: string;
    completionPercentage: number;
};

export default function EmployeeDashboardPage() {
  const { user } = useContext(SessionContext);
  const { kpiRecords, kpis, notifications, updateKpiRecordActual } = useContext(DataContext);
  const { toast } = useToast();
  
  const [selectedKpi, setSelectedKpi] = useState<MappedKpi | null>(null);

  // Dialog states
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  
  // Form states
  const [actualValue, setActualValue] = useState('');

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

  // --- DIALOG HANDLERS ---
  const handleUpdateClick = (kpi: MappedKpi) => {
    setSelectedKpi(kpi);
    setActualValue(String(kpi.actual));
    setUpdateModalOpen(true);
  };
  
  const handleFeedbackClick = (kpi: MappedKpi) => {
    setSelectedKpi(kpi);
    setFeedbackModalOpen(true);
  }

  // --- ACTION HANDLERS ---
  const handleUpdateActual = () => {
    if (!selectedKpi) return;
    
    const newActual = Number(actualValue);
    updateKpiRecordActual(selectedKpi.id, newActual);
    
    toast({
      title: 'Cập nhật thành công',
      description: `Tiến độ cho KPI "${selectedKpi?.name}" đã được lưu.`,
    });
    setUpdateModalOpen(false);
  };

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
              <CardContent className="space-y-4">
                {kpiData.map((kpi) => (
                  <div key={kpi.id} className="p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{kpi.name}</h3>
                        <p className="text-sm text-muted-foreground">{kpi.description}</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Hạn chót: {format(new Date(kpi.endDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <Progress value={kpi.completionPercentage} className="h-2" />
                      <span className="text-lg font-bold w-16 text-right">
                        {kpi.completionPercentage}%
                      </span>
                    </div>
                     <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleFeedbackClick(kpi)}>
                            <MessageSquare className="mr-2 h-4 w-4" /> Xem Feedback
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleUpdateClick(kpi)} disabled={kpi.status === 'pending_approval' || kpi.status === 'completed'}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Cập nhật
                        </Button>
                        <Button asChild size="sm" onClick={() => setSelectedKpi(null)} disabled={kpi.status === 'pending_approval' || kpi.status === 'completed'}>
                            <Link href={`/employee/submit/${kpi.id}`}>
                               <FileCheck className="mr-2 h-4 w-4" /> Nộp KPI
                            </Link>
                        </Button>
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
