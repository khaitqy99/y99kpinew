'use client';

import React, { useState } from 'react';
import {
  MoreHorizontal,
  PlusCircle,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const kpiData = [
  {
    id: 'KPI-001',
    name: 'Tăng trưởng doanh thu',
    department: 'Kinh doanh',
    target: '15%',
    frequency: 'Hàng quý',
    status: 'Đang hoạt động',
  },
  {
    id: 'KPI-002',
    name: 'Tỷ lệ chuyển đổi',
    department: 'Marketing',
    target: '5%',
    frequency: 'Hàng tháng',
    status: 'Đang hoạt động',
  },
  {
    id: 'KPI-003',
    name: 'Chỉ số hài lòng khách hàng (CSAT)',
    department: 'Chăm sóc khách hàng',
    target: '95 điểm',
    frequency: 'Hàng quý',
    status: 'Tạm dừng',
  },
  {
    id: 'KPI-004',
    name: 'Thời gian hoàn thành dự án',
    department: 'Dự án',
    target: 'Giảm 10%',
    frequency: 'Hàng năm',
    status: 'Đang hoạt động',
  },
];

export default function KpiListPage() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý KPI</CardTitle>
            <CardDescription>
              Xem, tạo và quản lý các chỉ số hiệu suất chính.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Tạo KPI mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Tạo KPI mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin chi tiết để thiết lập một KPI mới.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">
                    Tên KPI
                  </Label>
                  <Input id="name" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="description">
                    Mô tả
                  </Label>
                  <Textarea id="description" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="department">
                    Phòng ban
                  </Label>
                  <Select>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kinh-doanh">Kinh doanh</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="nhan-su">Nhân sự</SelectItem>
                      <SelectItem value="ky-thuat">Kỹ thuật</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="target">Mục tiêu</Label>
                        <Input id="target" type="number" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="unit">Đơn vị</Label>
                        <Input id="unit" placeholder="%, VNĐ,..." />
                    </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="frequency">
                    Tần suất
                  </Label>
                  <Select>
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Chọn tần suất đo lường" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hang-thang">Hàng tháng</SelectItem>
                      <SelectItem value="hang-quy">Hàng quý</SelectItem>
                      <SelectItem value="hang-nam">Hàng năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="reward-penalty">
                    Thưởng/Phạt
                  </Label>
                  <Textarea
                    id="reward-penalty"
                    placeholder="Cấu hình quy tắc thưởng/phạt"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Hủy</Button>
                </DialogClose>
                <Button type="submit" onClick={() => setOpen(false)}>Lưu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            {kpiData.map((kpi) => (
              <TableRow key={kpi.id}>
                <TableCell className="font-medium">{kpi.name}</TableCell>
                <TableCell>{kpi.department}</TableCell>
                <TableCell>{kpi.target}</TableCell>
                <TableCell>{kpi.frequency}</TableCell>
                <TableCell>
                  <Badge variant={kpi.status === 'Đang hoạt động' ? 'default' : 'secondary'}>
                    {kpi.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Sửa</DropdownMenuItem>
                      <DropdownMenuItem>Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
