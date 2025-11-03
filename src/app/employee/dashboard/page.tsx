'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  Target,
  MessageSquare,
  FileCheck,
  Loader2,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  X,
  File,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { SessionContext } from '@/contexts/SessionContext';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { EmployeeBonusPenaltySummary } from '@/components/EmployeeBonusPenaltySummary';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/ai/flows/upload-file';
import Link from 'next/link';

interface KpiRecord {
  id: string;
  kpi_id: string;
  employee_id: string;
  period: string;
  target: number;
  actual: number;
  progress: number;
  status: 'pending' | 'pending_approval' | 'completed' | 'overdue';
  feedback?: Array<{
    author: string;
    comment: string;
    created_at: string;
  }>;
  kpis?: {
    id: string;
    name: string;
    description: string;
    unit: string;
    target: number;
  };
  // Computed properties
  completionPercentage: number;
  targetFormatted: string;
  actualFormatted: string;
}

export default function EmployeeDashboardPage() {
  const { user } = useContext(SessionContext);
  const { kpiRecords, users, submitKpiRecord } = useContext(SupabaseDataContext);
  const { toast } = useToast();
  
  // State for modals
  const [isSubmitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<KpiRecord | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [actualValue, setActualValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedActual, setUpdatedActual] = useState<number | null>(null);
  const [updatedProgress, setUpdatedProgress] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter KPI records for current user
  const kpiData = useMemo(() => {
    if (!user?.id || !kpiRecords) return [];
    
    const filtered = kpiRecords
      .filter(record => record.employee_id === user.id)
      .map(record => ({
        ...record,
        completionPercentage: record.progress || 0,
        targetFormatted: `${record.target || 0} ${record.kpis?.unit || ''}`,
        actualFormatted: `${record.actual || 0} ${record.kpis?.unit || ''}`,
      }));
    
    console.log('KPI Data updated:', filtered.map(k => ({ id: k.id, status: k.status, name: k.kpis?.name })));
    return filtered;
  }, [user?.id, kpiRecords]);

  // Calculate summary statistics
  const completedCount = kpiData.filter(kpi => kpi.status === 'completed' || kpi.status === 'approved').length;
  const pendingCount = kpiData.filter(kpi => kpi.status === 'pending_approval').length;
  const overdueCount = kpiData.filter(kpi => kpi.status === 'overdue').length;
  const inProgressCount = kpiData.filter(kpi => kpi.status === 'pending').length;
  const totalKpis = kpiData.length;
  const averageCompletionRate = kpiData.length > 0 
    ? Math.round(kpiData.reduce((sum, kpi) => sum + kpi.completionPercentage, 0) / kpiData.length)
    : 0;

  // Helper function to get month name in Vietnamese
  const getMonthName = (monthIndex: number) => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months[monthIndex];
  };

  // Calculate chart data from KPI records
  const kpiChartData = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Get last 6 months
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      // Filter KPI records for this month
      const monthRecords = kpiData.filter(record => {
        const recordDate = new Date(record.created_at || record.createdAt || record.submission_date || record.submissionDate);
        if (isNaN(recordDate.getTime())) return false;
        return recordDate.getMonth() === targetMonth && recordDate.getFullYear() === targetYear;
      });

      const avgCompletion = monthRecords.length > 0
        ? Math.round(monthRecords.reduce((sum, r) => sum + (r.completionPercentage || 0), 0) / monthRecords.length)
        : 0;
      
      chartData.push({
        name: getMonthName(targetMonth),
        completed: avgCompletion,
        month: targetMonth,
        year: targetYear,
        totalRecords: monthRecords.length
      });
    }
    
    return chartData;
  }, [kpiData]);

  // Get pending KPIs for table
  const pendingKpis = kpiData
    .filter(kpi => kpi.status === 'pending_approval')
    .slice(0, 3)
    .map(kpi => ({
      id: kpi.id,
      title: kpi.kpis?.name || 'N/A',
      progress: kpi.completionPercentage,
      status: 'Chờ duyệt',
    }));


  // Event handlers
  const handleKpiRowClick = useCallback((kpi: KpiRecord) => {
    setSelectedKpi(kpi);
  }, []);

  const handleSubmitClick = useCallback((kpi: KpiRecord) => {
    setSelectedKpi(kpi);
    setSubmissionDetails('');
    setAttachments([]);
    setActualValue(kpi.actual?.toString() || '');
    setUpdatedActual(null);
    setUpdatedProgress(null);
    setSubmitModalOpen(true);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Files selected:', files);
    setAttachments(prev => [...prev, ...files]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', files);
    setAttachments(prev => [...prev, ...files]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleUpdateActual = useCallback(async () => {
    if (!selectedKpi || !actualValue.trim()) return;
    
    try {
      setIsUpdating(true);
      const newActual = parseFloat(actualValue);
      const target = selectedKpi.target || 0;
      const newProgress = target > 0 ? Math.min((newActual / target) * 100, 100) : 0;
      
      // Update local state
      setUpdatedActual(newActual);
      setUpdatedProgress(newProgress);
      
      // Here you would implement the actual update logic to save to database
      console.log('Updating KPI:', selectedKpi.id);
      console.log('New actual value:', newActual);
      console.log('New progress:', newProgress);
      
    } catch (error) {
      console.error('Error updating actual value:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedKpi, actualValue]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!selectedKpi) return;
    
    try {
      setIsSubmitting(true);
      
      // Upload files to Google Drive if there are attachments
      let uploadedFileUrls: string[] = [];
      if (attachments.length > 0) {
        console.log(`Uploading ${attachments.length} file(s) to Google Drive...`);
        
        // Upload files one by one to avoid overwhelming the API
        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64Content = result.split(',')[1];
                resolve(base64Content);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Upload to Drive using the uploadFile function
            const result = await uploadFile({
              fileName: file.name,
              fileContent: base64,
              mimeType: file.type,
            });
            
            uploadedFileUrls.push(result.fileUrl);
            console.log(`File ${i + 1}/${attachments.length} (${file.name}) uploaded successfully:`, result.fileUrl);
            
            // Small delay between uploads to avoid rate limiting
            if (i < attachments.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
          } catch (uploadError) {
            console.error(`Error uploading file ${file.name}:`, uploadError);
            
            // Provide more specific error messages
            let errorMessage = 'Lỗi không xác định';
            if (uploadError instanceof Error) {
              const msg = uploadError.message.toLowerCase();
              if (msg.includes('transient failure') || msg.includes('network')) {
                errorMessage = 'Lỗi kết nối tạm thời. Vui lòng kiểm tra mạng và thử lại.';
              } else if (msg.includes('timeout')) {
                errorMessage = 'Upload quá lâu. Vui lòng kiểm tra kết nối mạng hoặc thử lại với file nhỏ hơn.';
              } else if (msg.includes('too large')) {
                errorMessage = 'File quá lớn. Kích thước tối đa là 100MB.';
              } else if (msg.includes('permission') || msg.includes('401') || msg.includes('403')) {
                errorMessage = 'Lỗi xác thực Google Drive. Vui lòng liên hệ admin.';
              } else if (msg.includes('unexpected response')) {
                errorMessage = 'Lỗi phản hồi từ server. Có thể do token Google Drive hết hạn hoặc lỗi cấu hình.';
              } else if (msg.includes('404') || msg.includes('không tìm thấy')) {
                errorMessage = 'Không tìm thấy thư mục trên Google Drive. Vui lòng liên hệ admin.';
              } else {
                errorMessage = uploadError.message;
              }
            }
            
            throw new Error(`Không thể upload file ${file.name}: ${errorMessage}`);
          }
        }
      }
      
      // Submit KPI record to database
      console.log('Submitting KPI to database:', selectedKpi.id);
      console.log('Actual value:', actualValue);
      console.log('Submission details:', submissionDetails);
      console.log('Uploaded file URLs:', uploadedFileUrls);
      
      // Submit to database with uploaded file URLs
      await submitKpiRecord(selectedKpi.id, {
        actual: parseFloat(actualValue),
        submissionDetails: submissionDetails,
        attachment: uploadedFileUrls.length > 0 ? uploadedFileUrls.join(', ') : null
      });
      
      console.log('KPI submitted successfully to database');
      
      // Reset form state
      setSubmissionDetails('');
      setAttachments([]);
      setActualValue('');
      
      // Close modal only after successful submission
      setSubmitModalOpen(false);
      
      // Show success message
      toast({
        title: "Nộp báo cáo thành công!",
        description: uploadedFileUrls.length > 0 
          ? `Đã upload ${uploadedFileUrls.length} file(s) và nộp báo cáo.`
          : "Báo cáo đã được nộp thành công.",
      });
      
    } catch (error) {
      console.error('Error submitting KPI:', error);
      
      // Show error message
      toast({
        title: "Lỗi khi nộp báo cáo",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi nộp báo cáo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedKpi, actualValue, submissionDetails, attachments]);

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex flex-1 flex-col gap-4">
          {/* Statistics Cards - Similar to Admin */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng KPI</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalKpis}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  KPI được giao cho bạn
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedCount > 0 ? 'KPI đã hoàn thành' : 'Chưa có KPI hoàn thành'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingCount > 0 ? 'Đang chờ admin duyệt' : 'Không có KPI chờ duyệt'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageCompletionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedCount}/{totalKpis} KPI hoàn thành
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* KPI Progress Chart */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Tiến độ KPI</CardTitle>
                <CardDescription>
                  Biểu đồ tiến độ KPI trong 6 tháng gần nhất.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {kpiChartData.length > 0 && kpiChartData.some(item => item.totalRecords > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={kpiChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        unit="%" 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          const totalRecords = props.payload.totalRecords;
                          return [
                            `${value}%`,
                            `Tiến độ trung bình (${totalRecords} KPI)`
                          ];
                        }}
                        labelFormatter={(label: string, payload: any[]) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${label} ${data.year}`;
                          }
                          return label;
                        }}
                      />
                      <Bar
                        dataKey="completed"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có dữ liệu KPI</p>
                      <p className="text-xs">Dữ liệu sẽ hiển thị khi có KPI được giao</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions & Bonus/Penalty */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2 justify-between">
                    <Button asChild variant="default" size="sm" className="flex-1 min-w-[140px]">
                      <Link href="/employee/kpis">Xem tất cả KPI</Link>
                    </Button>
                    <Button asChild variant="default" size="sm" className="flex-1 min-w-[140px]">
                      <Link href="/employee/kpi-bonus-penalty">Xem thưởng phạt</Link>
                    </Button>
                    <Button asChild variant="default" size="sm" className="flex-1 min-w-[140px]">
                      <Link href="/employee/account">Tài khoản</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bonus & Penalty Summary */}
              <EmployeeBonusPenaltySummary />
            </div>
          </div>

          {/* Pending Approvals Table */}
          {pendingKpis.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>KPI chờ duyệt</CardTitle>
                  <CardDescription>
                    Danh sách các KPI đang chờ được phê duyệt.
                  </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/employee/kpis">
                    Xem tất cả
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên KPI</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingKpis.map((kpi) => (
                      <TableRow key={kpi.id}>
                        <TableCell className="font-medium">{kpi.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={kpi.progress} className="h-2 w-24" />
                            <span className="text-xs text-muted-foreground">{kpi.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{kpi.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Submit Modal */}
      <Dialog open={isSubmitModalOpen && !!selectedKpi} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nộp báo cáo KPI</DialogTitle>
                <DialogDescription className="text-base font-medium text-foreground">
                  {selectedKpi?.kpis?.name || 'KPI'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Actual Value Input */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary/10 rounded">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <Label className="text-base font-semibold">
                  Cập nhật số liệu thực tế
                </Label>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground font-medium">Mục tiêu</p>
                    <p className="text-lg font-bold text-foreground">{selectedKpi?.targetFormatted}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground font-medium">Hiện tại</p>
                    <p className="text-lg font-bold text-primary">
                      {updatedActual !== null 
                        ? `${updatedActual} ${selectedKpi?.kpis?.unit || ''}` 
                        : selectedKpi?.actualFormatted}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground font-medium">Tiến độ</p>
                    <p className="text-lg font-bold text-primary">
                      {updatedProgress !== null ? `${Math.round(updatedProgress)}%` : `${selectedKpi?.completionPercentage}%`}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="actual-value" className="text-sm font-medium text-muted-foreground min-w-[100px]">
                      Số liệu mới:
                    </Label>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        id="actual-value"
                        type="number"
                        placeholder="Nhập số liệu thực tế..."
                        value={actualValue}
                        onChange={(e) => setActualValue(e.target.value)}
                        className="flex-1"
                        step="any"
                      />
                      <span className="text-sm text-muted-foreground font-medium min-w-[40px]">
                        {selectedKpi?.kpis?.unit ? ` ${selectedKpi.kpis.unit}` : ''}
                      </span>
                    </div>
                    <Button
                      onClick={handleUpdateActual}
                      disabled={isUpdating || !actualValue.trim()}
                      size="sm"
                      className="px-4"
                    >
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground ml-[108px]">
                    Nhập số liệu thực tế đã đạt được để cập nhật tiến độ KPI
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary/10 rounded">
                  <FileCheck className="h-4 w-4 text-primary" />
                </div>
                <Label htmlFor="submission-details" className="text-base font-semibold">
                  Chi tiết báo cáo
                </Label>
              </div>
              <div className="space-y-2">
                <Textarea
                  id="submission-details"
                  placeholder="Mô tả chi tiết về tiến độ và kết quả đạt được..."
                  value={submissionDetails}
                  onChange={(e) => setSubmissionDetails(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Hãy mô tả chi tiết về quá trình thực hiện, kết quả đạt được và những khó khăn gặp phải (nếu có)
                </p>
              </div>
            </div>

            {/* File Attachments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <Label htmlFor="attachment" className="text-sm font-semibold">
                  Tệp đính kèm
                </Label>
                <Badge variant="secondary" className="text-xs">Tùy chọn</Badge>
              </div>
              
              <div className="space-y-3">
                {/* Compact File Upload Area */}
                <div className="relative">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 group ${
                      isDragOver 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Upload className="h-5 w-5 text-primary" />
                      <div className="flex items-center gap-2">
                        <Input
                          id="attachment"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          className="px-3 py-1 text-xs"
                          onClick={() => {
                            console.log('Button clicked');
                            const input = document.getElementById('attachment') as HTMLInputElement;
                            if (input) {
                              console.log('Input found, clicking...');
                              input.click();
                            } else {
                              console.log('Input not found');
                            }
                          }}
                        >
                          Chọn tệp
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {attachments.length === 0 ? 'hoặc kéo thả tệp vào đây' : `${attachments.length} tệp đã chọn`}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF, DOC, XLS, PPT, TXT, JPG, PNG, ZIP, RAR
                    </p>
                  </div>
                </div>
                
                {/* Compact File List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Đã chọn {attachments.length} tệp
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachments([])}
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-6 px-2"
                      >
                        Xóa tất cả
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {attachments.map((file, index) => (
                        <div key={index} className="group flex items-center justify-between p-2 bg-muted/30 rounded-md border text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileCheck className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="truncate font-medium">{file.name}</span>
                            <span className="text-muted-foreground flex-shrink-0">({formatFileSize(file.size)})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)} className="flex-1">
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmSubmit} 
              disabled={isSubmitting || !submissionDetails.trim() || !actualValue.trim()}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Đang nộp...' : 'Nộp báo cáo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}