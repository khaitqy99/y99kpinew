
'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const mockDepartments = [
    { id: 'dept-1', name: 'Kinh doanh' },
    { id: 'dept-2', name: 'Marketing' },
    { id: 'dept-3', name: 'Kỹ thuật' },
    { id: 'dept-4', name: 'Nhân sự' },
];

const mockUsers = [
    { id: 'user-1', name: 'Nguyễn Văn A', email: 'nva@example.com', department: 'Kinh doanh' },
    { id: 'user-2', name: 'Trần Thị B', email: 'ttb@example.com', department: 'Marketing' },
    { id: 'user-3', name: 'Lê Văn C', email: 'lvc@example.com', department: 'Kỹ thuật' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  
  const handleCreateDepartment = () => {
    toast({
        title: 'Thành công!',
        description: 'Đã tạo phòng ban mới.'
    })
  }
  
  const handleCreateUser = () => {
    toast({
        title: 'Thành công!',
        description: 'Đã tạo người dùng mới.'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý người dùng và phòng ban trong hệ thống của bạn.
        </p>
      </div>
      <Separator />
      
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý phòng ban</CardTitle>
                <CardDescription>Tạo và xem danh sách các phòng ban.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="new-dept">Tên phòng ban mới</Label>
                    <div className="flex gap-2">
                        <Input id="new-dept" placeholder="VD: Chăm sóc khách hàng" />
                        <Button onClick={handleCreateDepartment}>
                            <PlusCircle className='h-4 w-4 mr-2' /> Tạo
                        </Button>
                    </div>
                </div>
                <Separator />
                 <h3 className="text-sm font-medium">Danh sách phòng ban</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên phòng ban</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockDepartments.map(dept => (
                            <TableRow key={dept.id}>
                                <TableCell>{dept.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Quản lý người dùng</CardTitle>
                <CardDescription>Tạo và quản lý tài khoản nhân viên.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="new-user-name">Tên nhân viên</Label>
                        <Input id="new-user-name" placeholder="VD: Nguyễn Văn B" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-user-email">Email</Label>
                        <Input id="new-user-email" type="email" placeholder="VD: nvb@example.com" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-user-dept">Phòng ban</Label>
                        <Select>
                            <SelectTrigger id="new-user-dept">
                                <SelectValue placeholder="Chọn phòng ban" />
                            </SelectTrigger>
                            <SelectContent>
                                {mockDepartments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <Button className="w-full" onClick={handleCreateUser}>
                        <PlusCircle className='h-4 w-4 mr-2' /> Tạo nhân viên
                    </Button>
                </div>
                 <Separator />
                 <h3 className="text-sm font-medium">Danh sách nhân viên</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phòng ban</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.department}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
    </div>
  );
}
