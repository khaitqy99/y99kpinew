'use client';

import React from 'react';
import { X, TrendingUp, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Kpi } from '@/services/supabase-service';

interface KpiProgressChartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: Kpi | null;
}

const KpiProgressChart: React.FC<KpiProgressChartProps> = ({ open, onOpenChange, kpi }) => {
  if (!kpi) return null;

  // Mock data for chart - replace with actual data from API
  const mockChartData = [
    { period: '2024-01', progress: 75, actual: 75, target: 100 },
    { period: '2024-02', progress: 85, actual: 85, target: 100 },
    { period: '2024-03', progress: 90, actual: 90, target: 100 },
    { period: '2024-04', progress: 95, actual: 95, target: 100 },
    { period: '2024-05', progress: 88, actual: 88, target: 100 },
    { period: '2024-06', progress: 92, actual: 92, target: 100 },
  ];

  const maxProgress = Math.max(...mockChartData.map(d => d.progress));
  const avgProgress = Math.round(mockChartData.reduce((sum, d) => sum + d.progress, 0) / mockChartData.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Biểu đồ tiến độ: {kpi.name}
          </DialogTitle>
          <DialogDescription>
            Theo dõi tiến độ thực hiện KPI qua các kỳ báo cáo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Thông tin KPI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mục tiêu:</span>
                  <p className="font-medium">{kpi.target}{kpi.unit}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tần suất:</span>
                  <p className="font-medium">{kpi.frequency}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phòng ban:</span>
                  <p className="font-medium">{kpi.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Tiến độ cao nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{maxProgress}%</div>
                <p className="text-xs text-muted-foreground">
                  Kỳ {mockChartData.find(d => d.progress === maxProgress)?.period}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Tiến độ trung bình</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{avgProgress}%</div>
                <p className="text-xs text-muted-foreground">6 kỳ gần nhất</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Xu hướng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Tăng trưởng</span>
                </div>
                <p className="text-xs text-muted-foreground">+17% so với kỳ đầu</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Biểu đồ tiến độ theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simple Bar Chart */}
                <div className="space-y-3">
                  {mockChartData.map((data, index) => (
                    <div key={data.period} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{data.period}</span>
                        <span className="text-muted-foreground">{data.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${data.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Thực tế: {data.actual}{kpi.unit}</span>
                        <span>Mục tiêu: {data.target}{kpi.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart Legend */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm text-muted-foreground">Tiến độ thực tế</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-muted rounded"></div>
                    <span className="text-sm text-muted-foreground">Mục tiêu</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Phân tích hiệu suất</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Điểm mạnh</p>
                    <p className="text-muted-foreground">
                      Tiến độ tăng trưởng ổn định qua các kỳ, đạt mục tiêu trong 4/6 kỳ gần nhất.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Cần cải thiện</p>
                    <p className="text-muted-foreground">
                      Có sự dao động trong tiến độ, cần duy trì tính nhất quán.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Khuyến nghị</p>
                    <p className="text-muted-foreground">
                      Tập trung vào việc duy trì tiến độ trên 90% để đảm bảo đạt mục tiêu cuối năm.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KpiProgressChart;
