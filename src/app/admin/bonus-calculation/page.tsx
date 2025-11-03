'use client';

import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Eye,
  Download,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { getDefaultPeriod, getCurrentQuarterLabel, generatePeriodOptions, getPeriodLabel } from '@/lib/period-utils';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { 
  RoleCode,
  ROLE_CODES 
} from '@/types/kpi-config';
import { bonusPenaltyService, BonusPenaltyRecord, CreateBonusPenaltyRecord } from '@/services/bonus-penalty-service';

// Add Bonus/Penalty Dialog
const AddBonusPenaltyDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (record: CreateBonusPenaltyRecord) => Promise<void>;
  employees: any[];
  kpis: any[];
  kpiRecords: any[];
  periods: any[];
}> = ({ open, onOpenChange, onSave, employees, kpis, kpiRecords, periods }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    kpiId: 'none',
    type: 'bonus' as 'bonus' | 'penalty',
    amount: '',
    reason: '',
    period: getDefaultPeriod(),
  });

  // Filter KPIs that are assigned to the selected employee
  const assignedKpis = useMemo(() => {
    if (!formData.employeeId || !kpiRecords || !kpis) {
      return [];
    }
    
    // Get all KPI IDs assigned to this employee
    const assignedKpiIds = new Set(
      kpiRecords
        .filter(record => record.employee_id === formData.employeeId)
        .map(record => record.kpi_id)
    );
    
    // Return only KPIs that are assigned to this employee
    return kpis.filter(kpi => assignedKpiIds.has(kpi.id));
  }, [formData.employeeId, kpiRecords, kpis]);

  // Reset KPI selection when employee changes
  React.useEffect(() => {
    if (formData.employeeId) {
      setFormData(prev => ({ ...prev, kpiId: 'none' }));
    }
  }, [formData.employeeId]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        employeeId: '',
        kpiId: 'none',
        type: 'bonus',
        amount: '',
        reason: '',
        period: getDefaultPeriod(),
      });
    }
  }, [open]);

  const handleSave = async () => {
    if (!formData.employeeId || !formData.amount || !formData.reason) {
      return;
    }

    try {
      await onSave({
        employee_id: formData.employeeId,
        kpi_id: formData.kpiId === 'none' ? undefined : formData.kpiId,
        type: formData.type,
        amount: parseCurrency(formData.amount),
        reason: formData.reason,
        period: formData.period,
      });

      // Reset form only on success
      setFormData({
        employeeId: '',
        kpiId: 'none',
        type: 'bonus',
        amount: '',
        reason: '',
        period: getDefaultPeriod(),
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving record:', error);
      // Error is already handled in onSave (handleAddRecord)
      // Don't reset form on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Thêm thưởng/phạt
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin thưởng hoặc phạt cho nhân viên
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Nhân viên</Label>
            <Select value={formData.employeeId} onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role?.name || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kpi">KPI (Tùy chọn)</Label>
            <Select 
              value={formData.kpiId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, kpiId: value }))}
              disabled={!formData.employeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.employeeId 
                    ? "Vui lòng chọn nhân viên trước" 
                    : assignedKpis.length === 0 
                      ? "Nhân viên chưa được giao KPI nào" 
                      : "Chọn KPI (không bắt buộc)"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không chọn KPI</SelectItem>
                {assignedKpis.length > 0 ? (
                  assignedKpis.map(kpi => (
                    <SelectItem key={kpi.id} value={kpi.id}>
                      {kpi.name} - {kpi.unit || 'N/A'}
                    </SelectItem>
                  ))
                ) : formData.employeeId ? (
                  <SelectItem value="" disabled>
                    Không có KPI nào được giao cho nhân viên này
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Loại</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'bonus' | 'penalty' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bonus">Thưởng</SelectItem>
                <SelectItem value="penalty">Phạt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền (VND)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="Nhập số tiền"
              value={formData.amount}
              onChange={(e) => {
                // Remove all non-digit characters except comma
                let value = e.target.value.replace(/[^\d,]/g, '');
                // Remove commas to parse, then format
                const numValue = parseCurrency(value);
                if (value === '' || numValue === 0) {
                  setFormData(prev => ({ ...prev, amount: '' }));
                } else {
                  // Format with commas
                  const formatted = formatCurrency(numValue);
                  setFormData(prev => ({ ...prev, amount: formatted }));
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Thời kỳ</Label>
            <Select value={formData.period} onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}>
              <SelectTrigger>
                <SelectValue>
                  {getPeriodLabel(formData.period)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Lý do</Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do thưởng/phạt"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function BonusCalculationPage() {
  const { users, departments, roles, kpis, kpiRecords, loading } = useContext(SupabaseDataContext);
  const [bonusPenaltyRecords, setBonusPenaltyRecords] = useState<BonusPenaltyRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getDefaultPeriod());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate periods dynamically
  const periods = generatePeriodOptions();

  // Get employees with their roles
  const employees = useMemo(() => {
    const safeUsers = users || [];
    const safeRoles = roles || [];
    
    return safeUsers.map(user => ({
      ...user,
      role: safeRoles.find(role => role.id === user.role_id)
    }));
  }, [users, roles]);

  // Load bonus/penalty records
  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const records = await bonusPenaltyService.getRecords(selectedPeriod);
      setBonusPenaltyRecords(records);
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải dữ liệu thưởng/phạt',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, toast]);

  // Load records when component mounts or period changes
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
    const uniqueEmployees = new Set(bonusPenaltyRecords.map(record => record.employee_id)).size;
    
    return {
      totalEmployees: uniqueEmployees,
      totalBonus,
      totalPenalty,
      netAmount,
      totalRecords: bonusPenaltyRecords.length
    };
  }, [bonusPenaltyRecords]);

  // Handle adding new bonus/penalty record
  const handleAddRecord = async (recordData: CreateBonusPenaltyRecord) => {
    try {
      const newRecord = await bonusPenaltyService.createRecord(recordData);
      setBonusPenaltyRecords(prev => [newRecord, ...prev]);
      
      toast({
        title: 'Thành công',
        description: `Đã thêm ${recordData.type === 'bonus' ? 'thưởng' : 'phạt'} cho nhân viên`,
      });
    } catch (error: any) {
      console.error('Error adding record:', error);
      const errorMessage = error?.message || 'Không thể thêm bản ghi thưởng/phạt';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: errorMessage,
      });
      // Re-throw to prevent form reset on error
      throw error;
    }
  };

  // Handle deleting record
  const handleDeleteRecord = async (recordId: string) => {
    try {
      await bonusPenaltyService.deleteRecord(recordId);
      setBonusPenaltyRecords(prev => prev.filter(record => record.id !== recordId));
      
      toast({
        title: 'Thành công',
        description: 'Đã xóa bản ghi thưởng/phạt',
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xóa bản ghi thưởng/phạt',
      });
    }
  };

  // Handle export data
  const handleExportData = () => {
    const csvContent = [
      ['Nhân viên', 'KPI', 'Loại', 'Số tiền (VND)', 'Lý do', 'Thời kỳ', 'Ngày tạo'].join(','),
      ...bonusPenaltyRecords.map(record => [
        record.employees?.name || 'N/A',
        record.kpis?.name || 'Không có KPI',
        record.type === 'bonus' ? 'Thưởng' : 'Phạt',
        record.amount,
        `"${record.reason}"`,
        record.period,
        new Date(record.created_at).toLocaleDateString('vi-VN')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bonus_penalty_${selectedPeriod.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Xuất dữ liệu',
      description: 'Đã xuất dữ liệu thưởng/phạt thành công.',
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Quản lý thưởng phạt</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn thời kỳ">
                  {getPeriodLabel(selectedPeriod)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Xuất dữ liệu
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm thưởng/phạt
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading state */}
          {loading.users || loading.roles || loading.kpis || isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tổng nhân viên
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalEmployees}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Tổng thưởng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {summary.totalBonus.toLocaleString('vi-VN')} VND
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Tổng phạt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {summary.totalPenalty.toLocaleString('vi-VN')} VND
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      Số dư ròng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${summary.netAmount >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {summary.netAmount.toLocaleString('vi-VN')} VND
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Records Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>KPI</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonusPenaltyRecords.length > 0 ? bonusPenaltyRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.employees?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.kpis?.name ? (
                          <div>
                            <div className="font-medium">{record.kpis.name}</div>
                            {record.kpis.unit && (
                              <div className="text-xs text-muted-foreground">
                                Đơn vị: {record.kpis.unit}
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
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        <div className="flex flex-col items-center justify-center">
                          <Calculator className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Chưa có dữ liệu thưởng/phạt nào</p>
                          <p className="text-sm text-muted-foreground">Nhấn "Thêm thưởng/phạt" để bắt đầu</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
      
      <AddBonusPenaltyDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddRecord}
        employees={employees}
        kpis={kpis || []}
        kpiRecords={kpiRecords || []}
        periods={periods}
      />
    </>
  );
}
