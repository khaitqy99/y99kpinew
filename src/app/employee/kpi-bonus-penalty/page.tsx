'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  Target,
  RefreshCw,
  MessageSquare,
  FileCheck,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  Eye,
  Filter,
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { SessionContext } from '@/contexts/SessionContext';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import type { KpiRecord as KpiRecordType, Kpi as KpiType } from '@/services/supabase-service';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/ai/flows/upload-file';
import { getCurrentQuarterLabel, generatePeriodOptions, getPeriodLabel, getDefaultPeriod } from '@/lib/period-utils';
import { bonusPenaltyService, BonusPenaltyRecord } from '@/services/bonus-penalty-service';

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

// Helper function to safely format dates
const safeFormatDate = (dateValue: any, formatString: string = 'dd/MM/yyyy'): string => {
  if (!dateValue) return 'Chưa có';
  
  let date: Date;
  
  if (typeof dateValue === 'string') {
    if (dateValue.includes('T') || dateValue.includes('Z')) {
      date = parseISO(dateValue);
    } else {
      date = new Date(dateValue);
    }
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return 'Chưa có';
  }
  
  if (!isValid(date)) {
    return 'Chưa có';
  }
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Chưa có';
  }
};

// Bonus/Penalty Detail Dialog
const BonusPenaltyDetailDialog: React.FC<{
  record: BonusPenaltyRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ record, open, onOpenChange }) => {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {record.type === 'bonus' ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            Chi tiết {record.type === 'bonus' ? 'thưởng' : 'phạt'}
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về {record.type === 'bonus' ? 'thưởng' : 'phạt'} của bạn
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Loại</Label>
              <div className="mt-1">
                <Badge variant={record.type === 'bonus' ? 'default' : 'destructive'}>
                  {record.type === 'bonus' ? 'Thưởng' : 'Phạt'}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Số tiền</Label>
              <div className={`mt-1 text-lg font-bold ${record.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                {record.amount.toLocaleString('vi-VN')} VND
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">KPI liên quan</Label>
            <div className="mt-1">
              {record.kpis?.name ? (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium">{record.kpis.name}</div>
                  {record.kpis.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {record.kpis.description}
                    </div>
                  )}
                  {record.kpis.unit && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Đơn vị: {record.kpis.unit}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Không liên quan đến KPI cụ thể</div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Lý do</Label>
            <div className="mt-1 p-3 rounded-lg bg-muted">
              {record.reason}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Thời kỳ</Label>
              <div className="mt-1 text-sm">{getPeriodLabel(record.period)}</div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Ngày tạo</Label>
              <div className="mt-1 text-sm">
                {new Date(record.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function EmployeeKpiBonusPenaltyPage() {
  const { user } = useContext(SessionContext);
  const { kpiRecords, kpis, loading } = useContext(SupabaseDataContext);
  const { toast } = useToast();
  
  // All hooks must be called before any early returns
  const [selectedKpi, setSelectedKpi] = useState<MappedKpi | null>(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isSubmitModalOpen, setSubmitModalOpen] = useState(false);
  const [actualValue, setActualValue] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bonus/Penalty states
  const [bonusPenaltyRecords, setBonusPenaltyRecords] = useState<BonusPenaltyRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentQuarterLabel());
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BonusPenaltyRecord | null>(null);
  const [isLoadingBonus, setIsLoadingBonus] = useState(false);

  // Ensure arrays are defined before using filter
  const safeKpiRecords = kpiRecords || [];
  const safeKpis = kpis || [];

  const employeeKpiRecords = useMemo(() => 
    safeKpiRecords.filter(r => String(r.employee_id) === String(user?.id)), 
    [safeKpiRecords, user?.id]
  );

  const kpiData: MappedKpi[] = useMemo(() => 
    employeeKpiRecords.map(record => {
      const kpi = safeKpis.find(k => k.id === record.kpi_id) || {} as KpiType;
      const progress = record.target > 0 ? Math.round((record.actual / record.target) * 100) : 0;
      return {
          ...record,
          name: kpi.name || 'N/A',
          description: kpi.description || 'Không có mô tả',
          targetFormatted: `${kpi.target} ${kpi.unit}`,
          actualFormatted: `${record.actual} ${kpi.unit}`,
          unit: kpi.unit || '',
          completionPercentage: progress > 100 ? 100 : progress,
      }
    }),
    [employeeKpiRecords, safeKpis]
  );

  // Generate periods dynamically
  const periods = generatePeriodOptions();

  // Load bonus/penalty records for current user
  const loadBonusPenaltyRecords = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingBonus(true);
      const records = await bonusPenaltyService.getRecordsByEmployee(user.id, selectedPeriod);
      setBonusPenaltyRecords(records);
    } catch (error) {
      console.error('Error loading bonus/penalty records:', error);
    } finally {
      setIsLoadingBonus(false);
    }
  }, [user?.id, selectedPeriod]);

  // Load records when component mounts or period changes
  React.useEffect(() => {
    loadBonusPenaltyRecords();
  }, [loadBonusPenaltyRecords]);

  // Calculate bonus/penalty summary statistics
  const bonusPenaltySummary = useMemo(() => {
    const totalBonus = bonusPenaltyRecords
      .filter(record => record.type === 'bonus')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const totalPenalty = bonusPenaltyRecords
      .filter(record => record.type === 'penalty')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const netAmount = totalBonus - totalPenalty;
    
    return {
      totalBonus,
      totalPenalty,
      netAmount,
      totalRecords: bonusPenaltyRecords.length,
      bonusCount: bonusPenaltyRecords.filter(r => r.type === 'bonus').length,
      penaltyCount: bonusPenaltyRecords.filter(r => r.type === 'penalty').length,
    };
  }, [bonusPenaltyRecords]);

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
  
  const handleSubmitClick = (kpi: MappedKpi) => {
    setSelectedKpi(kpi);
    setActualValue(String(kpi.actual));
    setSubmissionDetails('');
    setAttachment(null);
    setSubmitModalOpen(true);
  }

  const handleViewBonusPenaltyDetails = (record: BonusPenaltyRecord) => {
    setSelectedRecord(record);
    setDetailDialogOpen(true);
  };

  // --- ACTION HANDLERS ---
  const handleUpdateActual = () => {
    if (!selectedKpi) return;
    
    const newActual = Number(actualValue);
    // updateKpiRecordActual(selectedKpi.id, newActual);
    
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

    const actualValueNum = Number(actualValue);
    if (isNaN(actualValueNum) || actualValueNum < 0) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập số liệu hợp lệ.',
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
        actual: actualValueNum,
        submissionDetails,
        attachment: attachmentUrl,
      };

      // await submitKpiRecord(selectedKpi.id, submissionData);

      toast({
        title: 'Nộp KPI thành công',
        description: `KPI "${selectedKpi.name}" đã được gửi đi để xét duyệt.`,
      });

      setSubmitModalOpen(false);
    } catch (error) {
      console.error('Submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể nộp KPI. Vui lòng thử lại.';
      toast({
        variant: 'destructive',
        title: 'Đã xảy ra lỗi',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while data is being fetched
  if (loading.kpiRecords || loading.kpis) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Thưởng & Phạt</CardTitle>
            <CardDescription>
              Theo dõi các khoản thưởng và phạt dựa trên hiệu suất KPI của bạn
            </CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn thời kỳ" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(period => (
                <SelectItem key={period.value} value={period.label}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoadingBonus ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <div className="text-sm">Đang tải dữ liệu...</div>
            </div>
          ) : bonusPenaltyRecords.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-muted-foreground">Tổng thưởng</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {bonusPenaltySummary.totalBonus.toLocaleString('vi-VN')} VND
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bonusPenaltySummary.bonusCount} khoản
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-muted-foreground">Tổng phạt</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {bonusPenaltySummary.totalPenalty.toLocaleString('vi-VN')} VND
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bonusPenaltySummary.penaltyCount} khoản
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Số dư ròng</span>
                  </div>
                  <div className={`text-2xl font-bold ${bonusPenaltySummary.netAmount >= 0 ? 'text-primary' : 'text-red-600'}`}>
                    {bonusPenaltySummary.netAmount.toLocaleString('vi-VN')} VND
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Thưởng - Phạt
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Tổng bản ghi</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {bonusPenaltySummary.totalRecords}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedPeriod}
                  </div>
                </div>
              </div>
              
              {/* Records Table */}
              <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>KPI</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Lý do</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonusPenaltyRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">
                            {record.kpis?.name ? (
                              <div>
                                <div className="font-medium">{record.kpis.name}</div>
                                {record.kpis.unit && (
                                  <div className="text-xs text-muted-foreground">
                                    {record.kpis.unit}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Không có KPI</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.type === 'bonus' ? 'default' : 'destructive'}>
                              {record.type === 'bonus' ? 'Thưởng' : 'Phạt'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-medium ${record.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.amount.toLocaleString('vi-VN')} VND
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.reason}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewBonusPenaltyDetails(record)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {bonusPenaltyRecords.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground text-center">
                      Hiển thị {bonusPenaltyRecords.length} bản ghi trong {selectedPeriod}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Chưa có dữ liệu thưởng/phạt nào</p>
                  <p className="text-sm text-muted-foreground mt-1">Dữ liệu sẽ hiển thị khi admin thêm thưởng/phạt</p>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Update Progress Modal */}
      <Dialog open={isUpdateModalOpen && !!selectedKpi} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cập nhật tiến độ</DialogTitle>
            <DialogDescription>{selectedKpi?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="actual-update" className="text-right">
                Thực tế đạt được
              </Label>
              <div className='col-span-3 flex items-center gap-2'>
                  <Input id="actual-update" value={actualValue} onChange={(e) => setActualValue(e.target.value)} />
                  <span>{selectedKpi?.unit}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
              <Button onClick={handleUpdateActual}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        
      {/* View Feedback Modal */}
      <Dialog open={isFeedbackModalOpen && !!selectedKpi} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Feedback cho KPI</DialogTitle>
            <DialogDescription>{selectedKpi?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {selectedKpi?.feedback && selectedKpi.feedback.length > 0 ? (
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
      
      {/* Submit KPI Modal */}
      <Dialog open={isSubmitModalOpen && !!selectedKpi} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Nộp Báo cáo KPI: {selectedKpi?.name}</DialogTitle>
            <DialogDescription>{selectedKpi?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
              <div className="grid w-full items-center gap-2">
                  <Label htmlFor="actual-submit">Số liệu cuối cùng</Label>
                  <div className="flex items-center gap-2">
                      <Input id="actual-submit" type="number" value={actualValue} onChange={(e) => setActualValue(e.target.value)} className="max-w-xs" />
                      <span className="text-muted-foreground">{selectedKpi?.unit}</span>
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

      {/* Bonus/Penalty Detail Dialog */}
      <BonusPenaltyDetailDialog 
        record={selectedRecord}
        open={isDetailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}
