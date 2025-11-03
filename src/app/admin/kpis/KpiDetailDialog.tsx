'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Kpi } from '@/services/supabase-service';
import { getFrequencyLabel } from '@/lib/utils';

const KpiDetailDialog: React.FC<{
    kpi: Kpi | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}> = React.memo(({ kpi, open, onOpenChange, onEdit, onDelete }) => {
    if (!kpi) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{kpi.name}</DialogTitle>
                    <DialogDescription>{kpi.description || "Không có mô tả chi tiết."}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">Phòng ban</p>
                            <p className='font-semibold'>{kpi.department}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Mục tiêu</p>
                            <p className='font-semibold'>{kpi.target} {kpi.unit}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Tần suất</p>
                            <p className='font-semibold'>{getFrequencyLabel(kpi.frequency)}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Trạng thái</p>
                            <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
                                {kpi.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">Ngày tạo</p>
                            <p className='font-semibold'>{new Date(kpi.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Cập nhật lần cuối</p>
                            <p className='font-semibold'>{new Date(kpi.updated_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>

                    {(kpi as any).reward_penalty_config && (
                        <div className="space-y-1">
                            <p className="font-medium text-muted-foreground text-sm">Cấu hình Thưởng/Phạt</p>
                            <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-words">
                                {typeof (kpi as any).reward_penalty_config === 'string' 
                                    ? (kpi as any).reward_penalty_config 
                                    : JSON.stringify((kpi as any).reward_penalty_config, null, 2)}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
                    <Button variant="destructive" onClick={onDelete}>Xóa</Button>
                    <Button onClick={onEdit}>Sửa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

KpiDetailDialog.displayName = 'KpiDetailDialog';

export default KpiDetailDialog;
