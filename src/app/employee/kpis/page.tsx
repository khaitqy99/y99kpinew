'use client';

import React, { useState, useContext, useMemo, useCallback, Suspense } from 'react';
import {
  Target,
  Loader2,
  Calendar,
  TrendingUp,
  Save,
  Send,
  Upload,
  X,
  File,
  CheckSquare,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { SessionContext } from '@/contexts/SessionContext';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import type { Kpi, KpiRecord } from '@/services/supabase-service';
import { getFrequencyLabel } from '@/lib/utils';
import { uploadFile } from '@/ai/flows/upload-file';

// Interface for combined KPI data
interface AssignedKpiData {
  kpi: Kpi;
  record: KpiRecord;
  progress: number;
  targetFormatted: string;
  actualFormatted: string;
}

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Đang tải...</span>
  </div>
);

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'approved':
      return 'default';
    case 'pending_approval':
      return 'secondary';
    case 'overdue':
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'not_started': 'Chưa bắt đầu',
    'in_progress': 'Đang thực hiện',
    'pending': 'Đang chờ',
    'pending_approval': 'Chờ duyệt',
    'completed': 'Hoàn thành',
    'approved': 'Đã duyệt',
    'rejected': 'Từ chối',
    'overdue': 'Quá hạn',
  };
  return statusMap[status?.toLowerCase()] || status;
};

// Memoized TableRow component for better performance
const KpiTableRow = React.memo(({ 
  kpiData, 
  onRowClick 
}: { 
  kpiData: AssignedKpiData; 
  onRowClick: (kpiData: AssignedKpiData) => void;
}) => {
  const { kpi, record, progress, targetFormatted, actualFormatted } = kpiData;
  
  return (
    <TableRow onClick={() => onRowClick(kpiData)} className="cursor-pointer hover:bg-muted/50">
      <TableCell className="font-medium w-[25%]">{kpi.name}</TableCell>
      <TableCell className="w-[15%]">{kpi.department}</TableCell>
      <TableCell className="w-[12%]">{targetFormatted}</TableCell>
      <TableCell className="w-[12%]">{actualFormatted}</TableCell>
      <TableCell className="w-[12%]">
        <div className="space-y-1">
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <span className="text-xs text-muted-foreground">{progress.toFixed(1)}%</span>
        </div>
      </TableCell>
      <TableCell className="w-[10%]">{record.period}</TableCell>
      <TableCell className="w-[14%]">
        <Badge variant={getStatusBadgeVariant(record.status)}>
          {getStatusLabel(record.status)}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

KpiTableRow.displayName = 'KpiTableRow';

// KPI Detail Dialog Component
const KpiDetailDialog: React.FC<{
  kpiData: AssignedKpiData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = React.memo(({ kpiData, open, onOpenChange }) => {
  const { updateKpiRecordActual, submitKpiRecord } = useContext(SupabaseDataContext);
  const { toast } = useToast();
  const [actualValue, setActualValue] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialize form when dialog opens or kpiData changes
  React.useEffect(() => {
    if (open && kpiData) {
      setActualValue(kpiData.record.actual?.toString() || '');
      setSubmissionDetails(kpiData.record.submission_details || '');
      setAttachments([]);
      setIsDragOver(false);
    }
  }, [open, kpiData]);

  // File upload handlers
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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

  // Calculate new progress when actual value changes - must be before early return
  const newProgress = React.useMemo(() => {
    if (!kpiData || !actualValue || !actualValue.trim()) return 0;
    const actual = parseFloat(actualValue);
    if (isNaN(actual)) return kpiData.progress;
    return kpiData.record.target > 0 ? Math.min((actual / kpiData.record.target) * 100, 100) : 0;
  }, [kpiData, actualValue]);

  // All callbacks must be before early return
  const handleUpdateProgress = useCallback(async () => {
    if (!kpiData) return;
    
    if (!actualValue || !actualValue.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập kết quả thực tế."
      });
      return;
    }

    try {
      setIsUpdating(true);
      const actual = parseFloat(actualValue);
      if (isNaN(actual) || actual < 0) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Kết quả thực tế phải là số hợp lệ và không âm."
        });
        return;
      }

      await updateKpiRecordActual(kpiData.record.id.toString(), actual);
      
      toast({
        title: "Cập nhật thành công!",
        description: "Đã cập nhật tiến độ KPI.",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error?.message || "Không thể cập nhật tiến độ KPI.",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [kpiData, actualValue, updateKpiRecordActual, toast, onOpenChange]);

  const handleSubmitReport = useCallback(async () => {
    if (!kpiData) return;
    
    // Kiểm tra nếu KPI đã được duyệt thì không cho phép nộp lại
    if (kpiData.record.status === 'approved') {
      toast({
        variant: "destructive",
        title: "Không thể nộp báo cáo",
        description: "KPI này đã được duyệt và không thể nộp lại."
      });
      return;
    }
    
    if (!actualValue || !actualValue.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập kết quả thực tế."
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const actual = parseFloat(actualValue);
      if (isNaN(actual) || actual < 0) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Kết quả thực tế phải là số hợp lệ và không âm."
        });
        return;
      }

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

      await submitKpiRecord(kpiData.record.id.toString(), {
        actual,
        submissionDetails: submissionDetails.trim(),
        attachment: uploadedFileUrls.length > 0 ? uploadedFileUrls.join(', ') : null,
      });
      
      toast({
        title: "Nộp báo cáo thành công!",
        description: uploadedFileUrls.length > 0 
          ? `Đã upload ${uploadedFileUrls.length} file(s) và nộp báo cáo.`
          : "Báo cáo đã được nộp thành công.",
      });
      
      // Reset form
      setSubmissionDetails('');
      setAttachments([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error?.message || "Không thể nộp báo cáo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [kpiData, actualValue, submissionDetails, attachments, submitKpiRecord, toast, onOpenChange]);

  if (!kpiData) return null;

  const { kpi, record, progress, targetFormatted, actualFormatted } = kpiData;
  
  // Kiểm tra nếu KPI đã được duyệt
  const isApproved = record.status === 'approved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {kpi.name}
          </DialogTitle>
          <DialogDescription>{kpi.description || "Không có mô tả chi tiết."}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Information & Update Progress */}
          <div className="space-y-4">
            {/* KPI Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Thông tin KPI</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Phòng ban</p>
                  <p className='font-semibold'>{kpi.department}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Mục tiêu</p>
                  <p className='font-semibold'>{targetFormatted}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Tần suất</p>
                  <p className='font-semibold'>{getFrequencyLabel(kpi.frequency)}</p>
                </div>
              </div>
            </div>

            {/* Record Information */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Thông tin kỳ báo cáo
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Kỳ báo cáo</p>
                  <p className='font-semibold'>{record.period}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Trạng thái</p>
                  <Badge variant={getStatusBadgeVariant(record.status)}>
                    {getStatusLabel(record.status)}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar - Current Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiến độ hiện tại</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-3" />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <p className="font-medium text-muted-foreground">Ngày bắt đầu</p>
                  <p className='font-semibold'>
                    {record.start_date ? new Date(record.start_date).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Ngày kết thúc</p>
                  <p className='font-semibold'>
                    {record.end_date ? new Date(record.end_date).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Submission Details - Read Only */}
              {record.submission_details && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="font-medium text-muted-foreground text-sm">Chi tiết báo cáo đã nộp</p>
                  <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-words">
                    {record.submission_details}
                  </p>
                </div>
              )}

              {/* KPI Description */}
              {kpi.description && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="font-medium text-muted-foreground text-sm">Mô tả KPI</p>
                  <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-words">
                    {kpi.description}
                  </p>
                </div>
              )}
            </div>

            {/* Update Progress Section */}
            <div className="border-t pt-4 space-y-4">
              <h5 className="font-semibold text-sm">Cập nhật tiến độ</h5>
              
              {isApproved && (
                <div className="p-3 bg-muted rounded-md border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    KPI này đã được duyệt. Bạn không thể cập nhật hoặc nộp lại báo cáo.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="actualValue" className="whitespace-nowrap">Kết quả thực tế *</Label>
                  <Input
                    id="actualValue"
                    type="number"
                    value={actualValue}
                    onChange={(e) => setActualValue(e.target.value)}
                    placeholder="Nhập kết quả thực tế"
                    className="w-32"
                    min="0"
                    disabled={isApproved}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{kpi.unit}</span>
                </div>
              </div>

              <Button
                onClick={handleUpdateProgress}
                disabled={isApproved || isUpdating || isSubmitting || !actualValue.trim()}
                variant="outline"
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Cập nhật tiến độ
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: File Upload & Submit */}
          <div className="space-y-4">
            {/* Submission Details */}
            <div className="space-y-2">
              <Label htmlFor="submissionDetails">Chi tiết báo cáo</Label>
              <Textarea
                id="submissionDetails"
                value={submissionDetails}
                onChange={(e) => setSubmissionDetails(e.target.value)}
                placeholder="Mô tả chi tiết về tiến độ thực hiện, các khó khăn gặp phải, kế hoạch tiếp theo..."
                rows={6}
                disabled={isApproved}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Tệp đính kèm</Label>
              <div
                onDragOver={isApproved ? undefined : handleDragOver}
                onDragEnter={isApproved ? undefined : handleDragEnter}
                onDragLeave={isApproved ? undefined : handleDragLeave}
                onDrop={isApproved ? undefined : handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-colors min-h-[200px] flex flex-col items-center justify-center
                  ${isApproved ? 'border-muted-foreground/10 bg-muted/30 cursor-not-allowed opacity-50' : isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                  ${isApproved ? '' : 'hover:border-primary/50 cursor-pointer'}
                `}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isApproved}
                />
                <label htmlFor="file-upload" className={`w-full ${isApproved ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {isApproved ? 'KPI đã được duyệt - không thể upload file' : 'Kéo thả file vào đây hoặc click để chọn'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isApproved ? '' : 'Hỗ trợ nhiều file, kích thước tối đa 100MB'}
                  </p>
                </label>
              </div>

              {/* Selected Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  <p className="text-sm font-medium">File đã chọn ({attachments.length}):</p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmitReport}
                disabled={isApproved || isUpdating || isSubmitting || !actualValue.trim()}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang nộp báo cáo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {isApproved ? 'KPI đã được duyệt' : 'Nộp báo cáo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {isApproved 
                  ? 'KPI này đã được duyệt và không thể nộp lại báo cáo'
                  : 'Khi nộp báo cáo, file đính kèm sẽ được tự động upload và báo cáo sẽ chờ duyệt'
                }
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

KpiDetailDialog.displayName = 'KpiDetailDialog';

export default function EmployeeKpiListPage() {
  const { user } = useContext(SessionContext);
  const { kpiRecords, kpis, submitMultiKpiSubmission } = useContext(SupabaseDataContext);
  const { toast } = useToast();
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [kpiDataToView, setKpiDataToView] = useState<AssignedKpiData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // State for multi-KPI submission
  const [isMultiSubmitModalOpen, setIsMultiSubmitModalOpen] = useState(false);
  const [selectedKpiIds, setSelectedKpiIds] = useState<Set<number>>(new Set());
  const [kpiActuals, setKpiActuals] = useState<Record<number, string>>({});
  const [kpiNotes, setKpiNotes] = useState<Record<number, string>>({});
  const [multiSubmissionDetails, setMultiSubmissionDetails] = useState('');
  const [multiAttachments, setMultiAttachments] = useState<File[]>([]);
  const [isMultiSubmitting, setIsMultiSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter KPI records for current user
  const assignedKpiData = useMemo(() => {
    if (!user?.id || !kpiRecords || !kpis) return [];

    const safeKpiRecords = kpiRecords || [];
    const safeKpis = kpis || [];

    // Filter records assigned to this employee
    const employeeRecords = safeKpiRecords.filter(
      record => String(record.employee_id) === String(user.id)
    );

    // Map records with KPI information
    const combined = employeeRecords
      .map(record => {
        const kpi = safeKpis.find(k => k.id === record.kpi_id);
        if (!kpi) return null;

        const progress = record.target > 0 
          ? (Number(record.actual || 0) / Number(record.target)) * 100 
          : 0;

        return {
          kpi,
          record,
          progress: Math.min(progress, 100),
          targetFormatted: `${record.target || 0} ${kpi.unit}`,
          actualFormatted: `${record.actual || 0} ${kpi.unit}`,
        } as AssignedKpiData;
      })
      .filter((item): item is AssignedKpiData => item !== null);

    return combined;
  }, [user?.id, kpiRecords, kpis]);

  // Filter KPIs
  const filteredKpiData = useMemo(() => {
    return assignedKpiData.filter(item => {
      const { record } = item;
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      return matchesStatus;
    });
  }, [assignedKpiData, filterStatus]);

  const handleRowClick = useCallback((kpiData: AssignedKpiData) => {
    setKpiDataToView(kpiData);
    setDetailDialogOpen(true);
  }, []);

  // Multi-KPI submission handlers
  const handleMultiSubmitClick = useCallback(() => {
    setSelectedKpiIds(new Set());
    setKpiActuals({});
    setKpiNotes({});
    setMultiSubmissionDetails('');
    setMultiAttachments([]);
    setIsMultiSubmitModalOpen(true);
  }, []);

  const handleToggleKpi = useCallback((kpiId: number) => {
    setSelectedKpiIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(kpiId)) {
        newSelected.delete(kpiId);
        setKpiActuals(prevActuals => {
          const newActuals = { ...prevActuals };
          delete newActuals[kpiId];
          return newActuals;
        });
        setKpiNotes(prevNotes => {
          const newNotes = { ...prevNotes };
          delete newNotes[kpiId];
          return newNotes;
        });
      } else {
        newSelected.add(kpiId);
      }
      return newSelected;
    });
  }, []);

  const handleMultiFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMultiAttachments(prev => [...prev, ...files]);
  }, []);

  const handleRemoveMultiFile = useCallback((index: number) => {
    setMultiAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirmMultiSubmit = useCallback(async () => {
    if (selectedKpiIds.size === 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một KPI để báo cáo."
      });
      return;
    }

    // Kiểm tra xem có KPI nào đã được duyệt không
    const approvedKpis: string[] = [];
    for (const kpiId of selectedKpiIds) {
      const kpiData = assignedKpiData.find(k => k.record.id === kpiId);
      if (kpiData && kpiData.record.status === 'approved') {
        approvedKpis.push(kpiData.kpi.name);
      }
    }
    
    if (approvedKpis.length > 0) {
      toast({
        variant: "destructive",
        title: "Không thể nộp báo cáo",
        description: `Các KPI sau đã được duyệt và không thể nộp lại: ${approvedKpis.join(', ')}`
      });
      return;
    }

    // Validate all selected KPIs have actual values
    for (const kpiId of selectedKpiIds) {
      const actual = kpiActuals[kpiId];
      if (!actual || !actual.trim()) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Vui lòng nhập kết quả thực tế cho tất cả các KPI đã chọn."
        });
        return;
      }
      
      const actualNum = parseFloat(actual);
      if (isNaN(actualNum) || actualNum < 0) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Kết quả thực tế phải là số hợp lệ và không âm."
        });
        return;
      }
    }

    if (!multiSubmissionDetails.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập chi tiết báo cáo."
      });
      return;
    }

    try {
      setIsMultiSubmitting(true);
      
      // Upload files to Google Drive if there are attachments
      let uploadedFileUrls: string[] = [];
      if (multiAttachments.length > 0) {
        for (let i = 0; i < multiAttachments.length; i++) {
          const file = multiAttachments[i];
          try {
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

            const result = await uploadFile({
              fileName: file.name,
              fileContent: base64,
              mimeType: file.type,
            });
            
            uploadedFileUrls.push(result.fileUrl);
            
            if (i < multiAttachments.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (uploadError) {
            console.error(`Error uploading file ${file.name}:`, uploadError);
            throw new Error(`Không thể upload file ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Lỗi không xác định'}`);
          }
        }
      }

      // Prepare submission items
      const items = Array.from(selectedKpiIds).map(kpiId => ({
        kpiRecordId: kpiId,
        actual: parseFloat(kpiActuals[kpiId]),
        notes: kpiNotes[kpiId] || undefined,
      }));

      // Submit multi-KPI submission
      if (!user?.id) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      await submitMultiKpiSubmission(
        user.id,
        items,
        multiSubmissionDetails,
        uploadedFileUrls.length > 0 ? uploadedFileUrls.join(', ') : null
      );

      // Reset form
      setSelectedKpiIds(new Set());
      setKpiActuals({});
      setKpiNotes({});
      setMultiSubmissionDetails('');
      setMultiAttachments([]);
      setIsMultiSubmitModalOpen(false);

      toast({
        title: "Nộp báo cáo thành công!",
        description: uploadedFileUrls.length > 0 
          ? `Đã upload ${uploadedFileUrls.length} file(s) và nộp báo cáo ${selectedKpiIds.size} KPI.`
          : `Đã nộp báo cáo ${selectedKpiIds.size} KPI thành công.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error?.message || "Không thể nộp báo cáo.",
      });
    } finally {
      setIsMultiSubmitting(false);
    }
  }, [selectedKpiIds, kpiActuals, kpiNotes, multiSubmissionDetails, multiAttachments, user, submitMultiKpiSubmission, toast]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>KPI của tôi</CardTitle>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={handleMultiSubmitClick} size="sm" className="gap-1">
              <CheckSquare className="h-4 w-4" />
              Báo cáo nhiều KPI
            </Button>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="not_started">Chưa bắt đầu</SelectItem>
                <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                <SelectItem value="pending_approval">Chờ duyệt</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Tên KPI</TableHead>
                <TableHead className="w-[15%]">Phòng ban</TableHead>
                <TableHead className="w-[12%]">Mục tiêu</TableHead>
                <TableHead className="w-[12%]">Thực tế</TableHead>
                <TableHead className="w-[12%]">Tiến độ</TableHead>
                <TableHead className="w-[10%]">Kỳ báo cáo</TableHead>
                <TableHead className="w-[14%]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKpiData.length > 0 ? filteredKpiData.map((kpiData, index) => (
                <KpiTableRow key={`${kpiData.kpi.id}-${kpiData.record.id}-${index}`} kpiData={kpiData} onRowClick={handleRowClick} />
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <Target className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        {assignedKpiData.length === 0 
                          ? 'Bạn chưa được giao KPI nào'
                          : 'Không tìm thấy KPI phù hợp với bộ lọc'}
                      </p>
                      {filterStatus !== 'all' && (
                        <Button
                          variant="link"
                          onClick={() => {
                            setFilterStatus('all');
                          }}
                          className="mt-2"
                        >
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {filteredKpiData.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Hiển thị {filteredKpiData.length} / {assignedKpiData.length} KPI đã được giao
            </div>
          )}
        </CardContent>
      </Card>
      
      <Suspense fallback={<LoadingSpinner />}>
        <KpiDetailDialog 
          kpiData={kpiDataToView} 
          open={isDetailDialogOpen} 
          onOpenChange={setDetailDialogOpen}
        />
      </Suspense>

      {/* Multi-KPI Submission Dialog */}
      <Dialog open={isMultiSubmitModalOpen} onOpenChange={setIsMultiSubmitModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Báo cáo nhiều KPI
            </DialogTitle>
            <DialogDescription>
              Chọn các KPI bạn muốn báo cáo và nhập kết quả thực tế cho từng KPI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* KPI Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Chọn KPI cần báo cáo *</Label>
              <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
                {assignedKpiData.length > 0 ? (
                  <div className="space-y-3">
                    {assignedKpiData.map((kpiData) => {
                      const isSelected = selectedKpiIds.has(kpiData.record.id);
                      const isApproved = kpiData.record.status === 'approved';
                      return (
                        <div
                          key={kpiData.record.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            isApproved 
                              ? 'border-muted-foreground/20 bg-muted/30 opacity-60' 
                              : isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => !isApproved && handleToggleKpi(kpiData.record.id)}
                            disabled={isApproved}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <Label 
                                className={`font-medium ${isApproved ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`} 
                                onClick={() => !isApproved && handleToggleKpi(kpiData.record.id)}
                              >
                                {kpiData.kpi.name}
                                {isApproved && (
                                  <span className="ml-2 text-xs text-muted-foreground">(Đã duyệt - không thể nộp lại)</span>
                                )}
                              </Label>
                              <Badge variant={getStatusBadgeVariant(kpiData.record.status)}>
                                {getStatusLabel(kpiData.record.status)}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Mục tiêu: {kpiData.targetFormatted}</p>
                              <p>Thực tế hiện tại: {kpiData.actualFormatted}</p>
                              <p>Kỳ: {kpiData.record.period}</p>
                            </div>
                            {isSelected && (
                              <div className="mt-3 space-y-2 pt-3 border-t">
                                {isApproved && (
                                  <div className="p-2 bg-muted rounded-md border border-primary/20 mb-2">
                                    <p className="text-xs text-muted-foreground">
                                      KPI này đã được duyệt. Bạn không thể nộp lại báo cáo.
                                    </p>
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <Label htmlFor={`actual-${kpiData.record.id}`} className="text-sm">
                                    Kết quả thực tế mới *
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id={`actual-${kpiData.record.id}`}
                                      type="number"
                                      value={kpiActuals[kpiData.record.id] || ''}
                                      onChange={(e) => {
                                        setKpiActuals(prev => ({ ...prev, [kpiData.record.id]: e.target.value }));
                                      }}
                                      placeholder="Nhập kết quả thực tế"
                                      min="0"
                                      className="flex-1"
                                      disabled={isApproved}
                                    />
                                    <span className="text-sm text-muted-foreground">{kpiData.kpi.unit || ''}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`notes-${kpiData.record.id}`} className="text-sm">
                                    Ghi chú (tùy chọn)
                                  </Label>
                                  <Textarea
                                    id={`notes-${kpiData.record.id}`}
                                    value={kpiNotes[kpiData.record.id] || ''}
                                    onChange={(e) => {
                                      setKpiNotes(prev => ({ ...prev, [kpiData.record.id]: e.target.value }));
                                    }}
                                    placeholder="Ghi chú về KPI này..."
                                    rows={2}
                                    disabled={isApproved}
                                  />
                                </div>
                                {kpiActuals[kpiData.record.id] && parseFloat(kpiActuals[kpiData.record.id]) >= 0 && (
                                  <div className="space-y-1">
                                    <Label className="text-sm">Tiến độ dự kiến</Label>
                                    <div className="flex items-center gap-2">
                                      <Progress 
                                        value={Math.min(100, Math.max(0, (parseFloat(kpiActuals[kpiData.record.id] || '0') / kpiData.record.target) * 100))} 
                                        className="h-2 flex-1" 
                                      />
                                      <span className="text-sm font-semibold whitespace-nowrap">
                                        {Math.round((parseFloat(kpiActuals[kpiData.record.id] || '0') / kpiData.record.target) * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có KPI nào được giao</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Details */}
            <div className="space-y-2">
              <Label htmlFor="multi-submission-details" className="text-base font-semibold">
                Chi tiết báo cáo chung *
              </Label>
              <Textarea
                id="multi-submission-details"
                value={multiSubmissionDetails}
                onChange={(e) => setMultiSubmissionDetails(e.target.value)}
                placeholder="Nhập chi tiết báo cáo chung cho tất cả các KPI..."
                rows={4}
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">File đính kèm (tùy chọn)</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = Array.from(e.dataTransfer.files);
                  setMultiAttachments(prev => [...prev, ...files]);
                }}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <Label htmlFor="multi-file-input" className="cursor-pointer text-primary hover:underline">
                      Click để chọn file
                    </Label>
                    <span className="text-sm text-muted-foreground"> hoặc kéo thả file vào đây</span>
                  </div>
                  <Input
                    id="multi-file-input"
                    type="file"
                    multiple
                    onChange={handleMultiFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">Hỗ trợ tất cả định dạng file, tối đa 100MB/file</p>
                </div>
              </div>
              {multiAttachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {multiAttachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMultiFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsMultiSubmitModalOpen(false)} className="flex-1">
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmMultiSubmit} 
              disabled={isMultiSubmitting || selectedKpiIds.size === 0 || !multiSubmissionDetails.trim()}
              className="flex-1"
            >
              {isMultiSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isMultiSubmitting ? 'Đang nộp...' : `Nộp báo cáo ${selectedKpiIds.size} KPI`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}