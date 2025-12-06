'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Target, TrendingUp, TrendingDown, Calendar, User, FileText, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BonusPenaltyRecord {
  id: number;
  type: 'bonus' | 'penalty';
  amount: number;
  reason: string;
  period: string;
  createdAt: string;
  createdBy: {
    id: number;
    name: string;
    code: string;
  } | null;
  kpi: {
    id: number;
    name: string;
  } | null;
}

interface KpiRecordMetadata {
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
  submissionDate?: string;
  approvalDate?: string;
  approvedBy?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

interface KpiDetailDialogProps {
  record: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Chưa có';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Không hợp lệ';
  }
};

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Chưa có';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Không hợp lệ';
  }
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    completed: { label: 'Hoàn thành', variant: 'default' },
    approved: { label: 'Đã duyệt', variant: 'default' },
    pending_approval: { label: 'Chờ duyệt', variant: 'secondary' },
    in_progress: { label: 'Đang thực hiện', variant: 'outline' },
    not_started: { label: 'Chưa bắt đầu', variant: 'outline' },
    rejected: { label: 'Từ chối', variant: 'destructive' },
    overdue: { label: 'Quá hạn', variant: 'destructive' },
  };

  const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

export const KpiDetailDialog: React.FC<KpiDetailDialogProps> = ({ record, open, onOpenChange }) => {
  if (!record) return null;

  const kpi = record.kpis || {};
  const progress = parseFloat(record.progress) || 0;
  const metadata: KpiDetailDialogProps['record']['metadata'] = record.metadata || {};
  const bonusPenaltyRecords: BonusPenaltyRecord[] = record.bonusPenaltyRecords || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {kpi.name || 'N/A'}
          </DialogTitle>
          <DialogDescription>
            {kpi.description || 'Không có mô tả'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Mục tiêu</span>
                <span className="text-sm font-semibold">
                  {parseFloat(kpi.target || 0).toLocaleString('vi-VN')} {kpi.unit || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Thực tế</span>
                <span className="text-sm font-semibold">
                  {parseFloat(record.actual || 0).toLocaleString('vi-VN')} {kpi.unit || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Tiến độ</span>
                <span className="text-sm font-semibold">{progress.toFixed(1)}%</span>
              </div>
              <div className="mt-2">
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Kỳ</span>
                <span className="text-sm font-semibold">{record.period || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Ngày bắt đầu</span>
                <span className="text-sm font-semibold">{formatDate(record.start_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Ngày kết thúc</span>
                <span className="text-sm font-semibold">{formatDate(record.end_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Trạng thái</span>
                {getStatusBadge(record.status)}
              </div>
            </div>
          </div>

          {/* Bonus/Penalty Summary */}
          {(record.bonusAmount > 0 || record.penaltyAmount > 0) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {record.bonusAmount > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900 dark:text-green-100">Tổng thưởng</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(record.bonusAmount)} VNĐ
                    </p>
                  </div>
                )}
                {record.penaltyAmount > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-900 dark:text-red-100">Tổng phạt</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(record.penaltyAmount)} VNĐ
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bonus/Penalty Breakdown */}
          {bonusPenaltyRecords.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Chi tiết thưởng/phạt
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Lý do</TableHead>
                        <TableHead>Người tạo</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonusPenaltyRecords.map((bpRecord) => (
                        <TableRow key={bpRecord.id}>
                          <TableCell>
                            <Badge variant={bpRecord.type === 'bonus' ? 'default' : 'destructive'}>
                              {bpRecord.type === 'bonus' ? 'Thưởng' : 'Phạt'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            <span className={bpRecord.type === 'bonus' ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(bpRecord.amount)} VNĐ
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={bpRecord.reason}>
                            {bpRecord.reason || 'Không có lý do'}
                          </TableCell>
                          <TableCell>
                            {bpRecord.createdBy ? (
                              <div className="text-sm">
                                <div className="font-medium">{bpRecord.createdBy.name}</div>
                                <div className="text-muted-foreground text-xs">{bpRecord.createdBy.code}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(bpRecord.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* Metadata / Audit Trail */}
          {metadata && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Lịch sử thay đổi
                </h4>
                <div className="space-y-3 text-sm">
                  {metadata.createdAt && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Ngày tạo
                      </span>
                      <span className="font-medium">{formatDateTime(metadata.createdAt)}</span>
                    </div>
                  )}
                  {metadata.updatedAt && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Cập nhật lần cuối
                      </span>
                      <span className="font-medium">{formatDateTime(metadata.updatedAt)}</span>
                    </div>
                  )}
                  {metadata.submissionDate && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Ngày nộp
                      </span>
                      <span className="font-medium">{formatDateTime(metadata.submissionDate)}</span>
                    </div>
                  )}
                  {metadata.approvalDate && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Ngày duyệt
                      </span>
                      <div className="text-right">
                        <div className="font-medium">{formatDateTime(metadata.approvalDate)}</div>
                        {metadata.approvedBy && (
                          <div className="text-xs text-muted-foreground">
                            bởi {metadata.approvedBy.name} ({metadata.approvedBy.code})
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Submission Details */}
          {record.submission_details && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Chi tiết nộp</h4>
                <div className="p-3 bg-muted/50 rounded text-sm whitespace-pre-wrap">
                  {record.submission_details}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};




