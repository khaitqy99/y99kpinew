'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  Target,
  MessageSquare,
  FileCheck,
  Loader2,
  Upload,
} from 'lucide-react';

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
import { EmployeeNotificationSummary } from '@/components/EmployeeNotificationSummary';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/ai/flows/upload-file';

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
  const [isKpiDetailModalOpen, setKpiDetailModalOpen] = useState(false);
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


  // Event handlers
  const handleKpiRowClick = useCallback((kpi: KpiRecord) => {
    setSelectedKpi(kpi);
    setKpiDetailModalOpen(true);
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
            let errorMessage = 'Unknown error';
            if (uploadError instanceof Error) {
              if (uploadError.message.includes('Transient failure')) {
                errorMessage = 'Lỗi tạm thời từ Google Drive. Vui lòng thử lại sau.';
              } else if (uploadError.message.includes('timeout')) {
                errorMessage = 'Upload quá lâu. Vui lòng kiểm tra kết nối mạng.';
              } else if (uploadError.message.includes('too large')) {
                errorMessage = 'File quá lớn. Kích thước tối đa là 100MB.';
              } else if (uploadError.message.includes('permission')) {
                errorMessage = 'Không có quyền truy cập Google Drive.';
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
          {/* KPI Overview & Bonus Penalty Section */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {/* KPI Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tổng quan KPI
                </CardTitle>
                <CardDescription>
                  Thống kê hiệu suất và tiến độ của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Overview */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tỷ lệ hoàn thành trung bình</span>
                    <span className="text-lg font-bold">
                      {kpiData.length > 0 
                        ? Math.round(kpiData.reduce((sum, kpi) => sum + kpi.completionPercentage, 0) / kpiData.length)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={kpiData.length > 0 
                      ? kpiData.reduce((sum, kpi) => sum + kpi.completionPercentage, 0) / kpiData.length
                      : 0
                    } 
                    className="h-3" 
                  />
                </div>
                
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                    <div className="text-sm text-green-700 font-medium">Hoàn thành</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                    <div className="text-sm text-orange-700 font-medium">Chờ duyệt</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                    <div className="text-sm text-red-700 font-medium">Quá hạn</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bonus & Penalty */}
            <EmployeeBonusPenaltySummary />
          </div>

          {/* Notifications Section */}
          <div className="grid gap-4 md:grid-cols-1">
            <EmployeeNotificationSummary />
          </div>

          {/* KPI Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quản lý KPI
              </CardTitle>
              <CardDescription>
                Xem chi tiết và nộp báo cáo KPI của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kpiData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">KPI</TableHead>
                      <TableHead className="w-[120px]">Mục tiêu</TableHead>
                      <TableHead className="w-[120px]">Thực tế</TableHead>
                      <TableHead className="w-[100px]">Tiến độ</TableHead>
                      <TableHead className="w-[100px]">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpiData.map((kpi) => (
                      <TableRow 
                        key={kpi.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleKpiRowClick(kpi)}
                      >
                        <TableCell className="font-medium">
                          {kpi.kpis?.name || 'KPI'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {kpi.targetFormatted}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {kpi.actualFormatted}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={kpi.completionPercentage} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {kpi.completionPercentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={kpi.status === 'completed' ? 'default' : kpi.status === 'pending_approval' ? 'secondary' : 'outline'} className="text-xs">
                            {kpi.status === 'completed' ? 'Hoàn thành' : 
                             kpi.status === 'pending_approval' ? 'Chờ duyệt' : 
                             kpi.status === 'overdue' ? 'Quá hạn' : 'Đang thực hiện'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có KPI nào được giao</p>
                </div>
              )}
            </CardContent>
          </Card>

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

      {/* KPI Detail Modal */}
      <Dialog open={isKpiDetailModalOpen && !!selectedKpi} onOpenChange={setKpiDetailModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Chi tiết KPI
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedKpi?.kpis?.name || 'KPI'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* KPI Basic Information */}
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tên KPI</Label>
                    <p className="text-base font-semibold text-foreground mt-1">
                      {selectedKpi?.kpis?.name || 'Chưa có tên'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Đơn vị</Label>
                    <p className="text-base font-semibold text-foreground mt-1">
                      {selectedKpi?.kpis?.unit || 'Chưa có đơn vị'}
                    </p>
                  </div>
                </div>
                {selectedKpi?.kpis?.description && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-muted-foreground">Mô tả</Label>
                    <p className="text-sm text-foreground mt-1 leading-relaxed">
                      {selectedKpi.kpis.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="p-4 bg-muted/30 rounded-lg border">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Chỉ số hiệu suất
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Mục tiêu</Label>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {selectedKpi?.targetFormatted || 'Chưa có'}
                    </p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Thực tế</Label>
                    <p className="text-xl font-bold text-primary mt-1">
                      {selectedKpi?.actualFormatted || 'Chưa có'}
                    </p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Tiến độ</Label>
                    <p className="text-xl font-bold text-primary mt-1">
                      {selectedKpi?.completionPercentage || 0}%
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={selectedKpi?.completionPercentage || 0} className="h-3" />
                </div>
              </div>

              {/* Status and Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <Label className="text-sm font-medium text-muted-foreground">Trạng thái</Label>
                  <div className="mt-2">
                    <Badge 
                      variant={selectedKpi?.status === 'completed' ? 'default' : 
                               selectedKpi?.status === 'pending_approval' ? 'secondary' : 'outline'} 
                      className="text-sm"
                    >
                      {selectedKpi?.status === 'completed' ? 'Hoàn thành' : 
                     selectedKpi?.status === 'pending_approval' ? 'Chờ duyệt' : 
                     selectedKpi?.status === 'overdue' ? 'Quá hạn' : 'Đang thực hiện'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <Label className="text-sm font-medium text-muted-foreground">Kỳ đánh giá</Label>
                  <p className="text-sm font-semibold text-foreground mt-2">
                    {selectedKpi?.period || 'Chưa có'}
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="pt-4 border-t border-border">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">Feedback</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-3">
                {selectedKpi?.feedback && selectedKpi.feedback.length > 0 ? (
                  selectedKpi.feedback.map((fb: any, index: number) => (
                    <div key={index} className="space-y-1 rounded-md bg-muted/50 p-3 border">
                      <p className="text-sm font-semibold text-foreground">{fb.author}</p>
                      <p className="text-sm text-muted-foreground">{fb.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có feedback nào</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setKpiDetailModalOpen(false);
                  handleSubmitClick(selectedKpi!);
                }}
                disabled={selectedKpi?.status === 'pending_approval' || selectedKpi?.status === 'completed'}
                className="flex-1"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Nộp
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKpiDetailModalOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}