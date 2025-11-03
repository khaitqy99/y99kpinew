'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  Eye,
  Calendar,
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
import { SessionContext } from '@/contexts/SessionContext';
import { bonusPenaltyService, BonusPenaltyRecord } from '@/services/bonus-penalty-service';
import { getCurrentQuarterLabel, getDefaultPeriod, getPeriodLabel } from '@/lib/period-utils';

interface EmployeeBonusPenaltySummaryProps {
  className?: string;
}

export function EmployeeBonusPenaltySummary({ className }: EmployeeBonusPenaltySummaryProps) {
  const { user } = useContext(SessionContext);
  const [bonusPenaltyRecords, setBonusPenaltyRecords] = useState<BonusPenaltyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getDefaultPeriod());

  // Load bonus/penalty records for current user
  const loadRecords = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      // Use period format (Q4-2025) instead of label format
      const records = await bonusPenaltyService.getRecordsByEmployee(user.id, selectedPeriod);
      setBonusPenaltyRecords(records);
    } catch (error) {
      console.error('Error loading bonus/penalty records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedPeriod]);

  // Load records when component mounts
  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Calculate summary statistics
  const summary = useMemo(() => {
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
    };
  }, [bonusPenaltyRecords]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Thưởng & Phạt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <div className="text-sm">Đang tải dữ liệu...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Thưởng & Phạt
        </CardTitle>
        <CardDescription>
          Tổng quan thưởng phạt trong {getCurrentQuarterLabel()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summary.totalRecords > 0 ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-lg font-bold text-green-600">
                  {summary.totalBonus.toLocaleString('vi-VN')}
                </div>
                <div className="text-xs text-green-700 font-medium">Thưởng</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-lg font-bold text-red-600">
                  {summary.totalPenalty.toLocaleString('vi-VN')}
                </div>
                <div className="text-xs text-red-700 font-medium">Phạt</div>
              </div>
              <div className={`text-center p-3 rounded-lg border ${summary.netAmount >= 0 ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-lg font-bold ${summary.netAmount >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {summary.netAmount.toLocaleString('vi-VN')}
                </div>
                <div className={`text-xs font-medium ${summary.netAmount >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                  Ròng
                </div>
              </div>
            </div>

            {/* Recent Records */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Mới nhất</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsDialogOpen(true)}
                  className="text-xs h-6 px-2"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Xem tất cả
                </Button>
              </div>
              {bonusPenaltyRecords.slice(0, 1).map((record) => (
                <div key={record.id} className="flex justify-between items-center p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-2">
                    {record.type === 'bonus' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {record.kpis?.name || 'Thưởng/Phạt chung'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.reason.length > 30 ? `${record.reason.substring(0, 30)}...` : record.reason}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${record.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.amount.toLocaleString('vi-VN')} VND
                    </div>
                    <Badge variant={record.type === 'bonus' ? 'default' : 'destructive'} className="text-xs">
                      {record.type === 'bonus' ? 'Thưởng' : 'Phạt'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="pt-2">
              <div className="text-center text-sm text-muted-foreground">
                Tổng cộng {summary.totalRecords} khoản thưởng/phạt
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground flex flex-col items-center justify-center min-h-[280px]">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có thưởng/phạt nào</p>
            <p className="text-xs mt-1">Dữ liệu sẽ hiển thị khi admin thêm</p>
          </div>
        )}
      </CardContent>

      {/* Full Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Chi tiết Thưởng & Phạt - {getCurrentQuarterLabel()}
            </DialogTitle>
            <DialogDescription>
              Danh sách đầy đủ các khoản thưởng và phạt trong quý hiện tại
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.totalBonus.toLocaleString('vi-VN')}
                </div>
                <div className="text-sm text-green-700 font-medium">Tổng thưởng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {summary.totalPenalty.toLocaleString('vi-VN')}
                </div>
                <div className="text-sm text-red-700 font-medium">Tổng phạt</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.netAmount >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {summary.netAmount.toLocaleString('vi-VN')}
                </div>
                <div className={`text-sm font-medium ${summary.netAmount >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                  Số dư ròng
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>KPI/Lý do</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngày áp dụng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonusPenaltyRecords.length > 0 ? (
                    bonusPenaltyRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.type === 'bonus' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <Badge variant={record.type === 'bonus' ? 'default' : 'destructive'}>
                              {record.type === 'bonus' ? 'Thưởng' : 'Phạt'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.kpis?.name || 'Thưởng/Phạt chung'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground">
                            {record.reason}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-bold ${record.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.amount.toLocaleString('vi-VN')} VND
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(record.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có thưởng/phạt nào</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
