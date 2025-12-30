'use client';

import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
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

const formatDateTime = (dateString: string | undefined | null, t: (key: string) => string): string => {
  if (!dateString) return t('reports.notAvailable');
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
    return t('reports.invalidDate');
  }
};

const formatDate = (dateString: string | undefined | null, t: (key: string) => string): string => {
  if (!dateString) return t('reports.notAvailable');
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return t('reports.invalidDate');
  }
};

const getStatusBadge = (status: string, t: (key: string) => string) => {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    completed: { label: t('reports.status.completed'), variant: 'default' },
    approved: { label: t('reports.status.approved'), variant: 'default' },
    pending_approval: { label: t('reports.status.pendingApproval'), variant: 'secondary' },
    in_progress: { label: t('reports.status.inProgress'), variant: 'outline' },
    not_started: { label: t('reports.status.notStarted'), variant: 'outline' },
    rejected: { label: t('reports.status.rejected'), variant: 'destructive' },
    overdue: { label: t('reports.status.overdue'), variant: 'destructive' },
  };

  const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

export const KpiDetailDialog: React.FC<KpiDetailDialogProps> = ({ record, open, onOpenChange }) => {
  const { t } = useTranslation();
  
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
            {kpi.name || t('reports.notAvailable')}
          </DialogTitle>
          <DialogDescription>
            {kpi.description || t('reports.noDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('reports.target')}</span>
                <span className="text-sm font-semibold">
                  {parseFloat(kpi.target || 0).toLocaleString('vi-VN')} {kpi.unit || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('reports.actual')}</span>
                <span className="text-sm font-semibold">
                  {parseFloat(record.actual || 0).toLocaleString('vi-VN')} {kpi.unit || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('reports.progress')}</span>
                <span className="text-sm font-semibold">{progress.toFixed(1)}%</span>
              </div>
              <div className="mt-2">
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('reports.period')}</span>
                <span className="text-sm font-semibold">{record.period || t('reports.notAvailable')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('reports.startDate')}</span>
                <span className="text-sm font-semibold">{formatDate(record.start_date, t)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('reports.endDate')}</span>
                <span className="text-sm font-semibold">{formatDate(record.end_date, t)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('reports.statusColumn')}</span>
                {getStatusBadge(record.status, t)}
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
                      <span className="font-semibold text-green-900 dark:text-green-100">{t('reports.totalBonus')}</span>
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
                      <span className="font-semibold text-red-900 dark:text-red-100">{t('reports.totalPenalty')}</span>
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
                  {t('reports.bonusPenaltyDetails')}
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('reports.type')}</TableHead>
                        <TableHead>{t('reports.amount')}</TableHead>
                        <TableHead>{t('reports.reason')}</TableHead>
                        <TableHead>{t('reports.createdBy')}</TableHead>
                        <TableHead>{t('reports.createdAt')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonusPenaltyRecords.map((bpRecord) => (
                        <TableRow key={bpRecord.id}>
                          <TableCell>
                            <Badge variant={bpRecord.type === 'bonus' ? 'default' : 'destructive'}>
                              {bpRecord.type === 'bonus' ? t('bonusCalculation.bonus') : t('bonusCalculation.penalty')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            <span className={bpRecord.type === 'bonus' ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(bpRecord.amount)} VNĐ
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={bpRecord.reason}>
                            {bpRecord.reason || t('reports.noReason')}
                          </TableCell>
                          <TableCell>
                            {bpRecord.createdBy ? (
                              <div className="text-sm">
                                <div className="font-medium">{bpRecord.createdBy.name}</div>
                                <div className="text-muted-foreground text-xs">{bpRecord.createdBy.code}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{t('reports.notAvailable')}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(bpRecord.createdAt, t)}
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
                  {t('reports.changeHistory')}
                </h4>
                <div className="space-y-3 text-sm">
                  {metadata.createdAt && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('reports.createdAt')}
                      </span>
                      <span className="font-medium">{formatDateTime(metadata.createdAt, t)}</span>
                    </div>
                  )}
                  {metadata.updatedAt && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('reports.lastUpdated')}
                      </span>
                      <span className="font-medium">{formatDateTime(metadata.updatedAt, t)}</span>
                    </div>
                  )}
                  {metadata.submissionDate && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t('reports.submissionDate')}
                      </span>
                      <span className="font-medium">{formatDateTime(metadata.submissionDate, t)}</span>
                    </div>
                  )}
                  {metadata.approvalDate && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('reports.approvalDate')}
                      </span>
                      <div className="text-right">
                        <div className="font-medium">{formatDateTime(metadata.approvalDate, t)}</div>
                        {metadata.approvedBy && (
                          <div className="text-xs text-muted-foreground">
                            {t('reports.approvedBy', { name: metadata.approvedBy.name, code: metadata.approvedBy.code })}
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
                <h4 className="font-semibold mb-2">{t('reports.submissionDetails')}</h4>
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









