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
import { useTranslation } from '@/hooks/use-translation';

const KpiDetailDialog: React.FC<{
    kpi: Kpi | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}> = React.memo(({ kpi, open, onOpenChange, onEdit, onDelete }) => {
    const { t } = useTranslation();
    if (!kpi) return null;

    // Get translated frequency label
    const getFrequencyLabelTranslated = (frequency: string) => {
        const key = `kpis.frequency.${frequency?.toLowerCase()}`;
        const translated = t(key);
        return translated !== key ? translated : frequency;
    };

    // Get translated status label
    const getStatusLabelTranslated = (status: string) => {
        const key = `kpis.status.${status?.toLowerCase()}`;
        const translated = t(key);
        return translated !== key ? translated : status;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{kpi.name}</DialogTitle>
                    <DialogDescription>{kpi.description || t('kpis.noDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">{t('kpis.department')}</p>
                            <p className='font-semibold'>{kpi.department}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">{t('kpis.target')}</p>
                            <p className='font-semibold'>{kpi.target} {kpi.unit}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">{t('kpis.frequency')}</p>
                            <p className='font-semibold'>{getFrequencyLabelTranslated(kpi.frequency)}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">{t('kpis.status')}</p>
                            <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
                                {getStatusLabelTranslated(kpi.status)}
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-muted-foreground">{t('kpis.createdDate')}</p>
                            <p className='font-semibold'>{new Date(kpi.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">{t('kpis.lastUpdated')}</p>
                            <p className='font-semibold'>{new Date(kpi.updated_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>

                    {(kpi as any).reward_penalty_config && (
                        <div className="space-y-1">
                            <p className="font-medium text-muted-foreground text-sm">{t('kpis.rewardPenaltyConfig')}</p>
                            <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap break-words">
                                {typeof (kpi as any).reward_penalty_config === 'string' 
                                    ? (kpi as any).reward_penalty_config 
                                    : JSON.stringify((kpi as any).reward_penalty_config, null, 2)}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
                    <Button variant="destructive" onClick={onDelete}>{t('common.delete')}</Button>
                    <Button onClick={onEdit}>{t('common.edit')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

KpiDetailDialog.displayName = 'KpiDetailDialog';

export default KpiDetailDialog;
