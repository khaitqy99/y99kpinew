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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

type UserData = {
  name: string;
  email: string;
  department?: string;
};

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserData = localStorage.getItem('userData');
      const storedRole = localStorage.getItem('userRole');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData({
          ...parsedData,
          department: storedRole === 'admin' ? 'Quản trị hệ thống' : 'Marketing',
        });
      }
      setRole(storedRole);
    }
  }, []);

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin tài khoản và tùy chọn hệ thống của bạn.
        </p>
      </div>
       <Separator />
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="system">Hệ thống</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Hồ sơ cá nhân</CardTitle>
              <CardDescription>
                Thông tin này sẽ được hiển thị công khai, hãy cẩn thận khi chia sẻ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" defaultValue={userData?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={userData?.email || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Phòng ban</Label>
                <Input id="department" defaultValue={userData?.department || ''} readOnly />
              </div>
               <Button>Lưu thay đổi</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt hệ thống</CardTitle>
              <CardDescription>
                Tùy chỉnh giao diện và thông báo của ứng dụng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ</Label>
                <Select defaultValue="vi">
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Chọn ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                 <div className="space-y-0.5">
                    <Label className="text-base">Chế độ tối</Label>
                    <p className='text-sm text-muted-foreground'>
                        Bật để chuyển sang giao diện nền tối.
                    </p>
                 </div>
                 <Switch aria-label="Dark mode toggle" />
              </div>
               <div className="space-y-4">
                 <h3 className='font-medium'>Thông báo</h3>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label>Thông báo qua Email</Label>
                        <p className='text-sm text-muted-foreground'>
                            Nhận thông báo về KPI và cập nhật quan trọng.
                        </p>
                    </div>
                    <Switch defaultChecked aria-label="Email notification toggle" />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label>Thông báo đẩy</Label>
                         <p className='text-sm text-muted-foreground'>
                            Nhận thông báo ngay trên thiết bị của bạn.
                        </p>
                    </div>
                    <Switch aria-label="Push notification toggle" />
                </div>
              </div>
               <Button>Lưu thay đổi</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
