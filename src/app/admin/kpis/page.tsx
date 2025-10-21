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
    <TableCell className="font-medium">{kpi.name}</TableCell>
    <TableCell>{kpi.department}</TableCell>
    <TableCell>{`${kpi.target}${kpi.unit}`}</TableCell>
    <TableCell>{kpi.frequency}</TableCell>
    <TableCell>
      <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
        {kpi.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
      </Badge>
    </TableCell>
    <TableCell>
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
    setDetailDialogOpen(false);
    deleteKpi(kpiId);
    toast({
      variant: 'destructive',
      title: 'Đã xóa',
      description: 'Đã xóa KPI khỏi hệ thống.',
    });
  }, [deleteKpi]);

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
            <CardDescription>
              Xem, tạo và quản lý các chỉ số hiệu suất chính.
            </CardDescription>
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
                <TableHead>Tên KPI</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Mục tiêu</TableHead>
                <TableHead>Tần suất</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>
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
    </>
  );
}