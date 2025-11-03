'use client';

import React, { useState, useContext, useMemo, useCallback, Suspense } from 'react';
import {
  PlusCircle,
  Settings,
  Calculator,
  Loader2,
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
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import type { Kpi } from '@/services/supabase-service';
import Link from 'next/link';
import { getFrequencyLabel } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Lazy load heavy components
const KpiDialog = React.lazy(() => import('./KpiDialog'));
const KpiDetailDialog = React.lazy(() => import('./KpiDetailDialog'));

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Đang tải...</span>
  </div>
);

// Memoized TableRow component for better performance
const KpiTableRow = React.memo(({ kpi, onRowClick }: { kpi: Kpi; onRowClick: (kpi: Kpi) => void }) => (
  <TableRow onClick={() => onRowClick(kpi)} className="cursor-pointer hover:bg-muted/50">
    <TableCell className="font-medium w-[25%]">{kpi.name}</TableCell>
    <TableCell className="w-[20%]">{kpi.department}</TableCell>
    <TableCell className="w-[15%]">{`${kpi.target} ${kpi.unit}`}</TableCell>
    <TableCell className="w-[15%]">{getFrequencyLabel(kpi.frequency)}</TableCell>
    <TableCell className="w-[15%]">
      <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
        {kpi.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
      </Badge>
    </TableCell>
    <TableCell className="w-[10%]">
      {/* Actions are now in the detail dialog */}
    </TableCell>
  </TableRow>
));

KpiTableRow.displayName = 'KpiTableRow';

export default function KpiListPage() {
  const { kpis, deleteKpi } = useContext(SupabaseDataContext);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [kpiToEdit, setKpiToEdit] = useState<Kpi | null>(null);
  const [kpiToView, setKpiToView] = useState<Kpi | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<Kpi | null>(null);
  const { toast } = useToast();

  // Memoize expensive operations
  const memoizedKpis = useMemo(() => kpis, [kpis]);

  const handleRowClick = useCallback((kpi: Kpi) => {
    setKpiToView(kpi);
    setDetailDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((kpi: Kpi) => {
    setDetailDialogOpen(false);
    setKpiToEdit(kpi);
    setEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((kpiId: string) => {
    const kpi = kpis.find(k => k.id === kpiId);
    if (kpi) {
      setDetailDialogOpen(false);
      setKpiToDelete(kpi);
      setIsDeleteDialogOpen(true);
    }
  }, [kpis]);

  const confirmDelete = useCallback(async () => {
    if (!kpiToDelete) return;
    
    try {
      await deleteKpi(kpiToDelete.id);
      toast({
        variant: 'destructive',
        title: 'Đã xóa',
        description: 'Đã xóa KPI khỏi hệ thống.',
      });
      setIsDeleteDialogOpen(false);
      setKpiToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error?.message || 'Không thể xóa KPI',
      });
    }
  }, [kpiToDelete, deleteKpi, toast]);

  const handleOpenEditDialog = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setKpiToEdit(null);
    }
    setEditDialogOpen(isOpen);
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Quản lý KPI</CardTitle>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/bonus-calculation">
              <Button variant="outline" size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                Tính thưởng
              </Button>
            </Link>
            <Suspense fallback={<Button size="sm" disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" />Tạo KPI...</Button>}>
              <KpiDialog 
                open={isEditDialogOpen} 
                onOpenChange={handleOpenEditDialog} 
                kpiToEdit={kpiToEdit} 
              />
            </Suspense>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Tên KPI</TableHead>
                <TableHead className="w-[20%]">Phòng ban</TableHead>
                <TableHead className="w-[15%]">Mục tiêu</TableHead>
                <TableHead className="w-[15%]">Tần suất</TableHead>
                <TableHead className="w-[15%]">Trạng thái</TableHead>
                <TableHead className="w-[10%]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memoizedKpis.length > 0 ? memoizedKpis.map((kpi) => (
                <KpiTableRow key={kpi.id} kpi={kpi} onRowClick={handleRowClick} />
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Chưa có KPI nào</p>
                      <p className="text-sm text-muted-foreground">Tạo KPI mới để bắt đầu</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Suspense fallback={<LoadingSpinner />}>
        <KpiDetailDialog 
          kpi={kpiToView} 
          open={isDetailDialogOpen} 
          onOpenChange={setDetailDialogOpen} 
          onEdit={() => kpiToView && handleEditClick(kpiToView)}
          onDelete={() => kpiToView && handleDeleteClick(kpiToView.id)}
        />
      </Suspense>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa KPI</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa KPI "{kpiToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}