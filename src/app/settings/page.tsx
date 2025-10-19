'use client';

import React, {useState, useContext} from 'react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { DataContext, Employee, Kpi } from '@/contexts/DataContext';


export default function SettingsPage() {
  const { toast } = useToast();
  const { 
      users, addUser, 
      kpis, addKpi,
      departments, addDepartment,
      getFrequencies
  } = useContext(DataContext);


  // State for Departments
  const [newDeptName, setNewDeptName] = useState('');

  // State for Users
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('');

  // State for KPI Creation
  const [kpiName, setKpiName] = useState('');
  const [kpiDescription, setKpiDescription] = useState('');
  const [kpiDepartment, setKpiDepartment] = useState('');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiFrequency, setKpiFrequency] = useState('');
  const [kpiRewardPenalty, setKpiRewardPenalty] = useState('');
  
  const kpiFrequencies = getFrequencies();

  const handleCreateDepartment = () => {
    if (!newDeptName.trim()) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên phòng ban không được để trống.' });
        return;
    }
    if (departments.includes(newDeptName.trim())) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Phòng ban đã tồn tại.' });
        return;
    }
    addDepartment(newDeptName.trim());
    setNewDeptName('');
    toast({
        title: 'Thành công!',
        description: 'Đã tạo phòng ban mới.'
    })
  }
  
  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserDept) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin nhân viên.' });
        return;
    }
    const newUser: Omit<Employee, 'id'> = {
        name: newUserName,
        email: newUserEmail,
        role: 'employee',
        department: newUserDept,
        avatar: `https://picsum.photos/seed/${users.length + 10}/40/40`,
    };
    addUser(newUser);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserDept('');
    toast({
        title: 'Thành công!',
        description: 'Đã tạo người dùng mới.'
    })
  }

  const handleCreateKpi = () => {
    if (!kpiName || !kpiDepartment || !kpiTarget || !kpiUnit || !kpiFrequency) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ các trường bắt buộc.' });
        return;
    }
    const newKpi: Omit<Kpi, 'id'> = {
        name: kpiName,
        description: kpiDescription,
        department: kpiDepartment,
        target: Number(kpiTarget),
        unit: kpiUnit,
        frequency: kpiFrequency,
        status: 'active',
        rewardPenaltyConfig: kpiRewardPenalty,
    };
    addKpi(newKpi);
    // Reset form
    setKpiName('');
    setKpiDescription('');
    setKpiDepartment('');
    setKpiTarget('');
    setKpiUnit('');
    setKpiFrequency('');
    setKpiRewardPenalty('');
    toast({
        title: 'Thành công!',
        description: 'Đã tạo KPI mới.'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý người dùng, phòng ban và các thiết lập hệ thống.
        </p>
      </div>
      <Tabs defaultValue="users-departments">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users-departments">Người dùng & Phòng ban</TabsTrigger>
            <TabsTrigger value="kpi-management">Tạo KPI</TabsTrigger>
        </TabsList>
        <TabsContent value="users-departments" className="mt-6">
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
                            <Input id="new-dept" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="VD: Chăm sóc khách hàng" />
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
                            {departments.map(dept => (
                                <TableRow key={dept}>
                                    <TableCell>{dept}</TableCell>
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
                            <Input id="new-user-name" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="VD: Nguyễn Văn B" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="new-user-email">Email</Label>
                            <Input id="new-user-email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="VD: nvb@example.com" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="new-user-dept">Phòng ban</Label>
                            <Select value={newUserDept} onValueChange={setNewUserDept}>
                                <SelectTrigger id="new-user-dept">
                                    <SelectValue placeholder="Chọn phòng ban" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                            {users.map(user => (
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
        </TabsContent>
        <TabsContent value="kpi-management" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Tạo KPI mới</CardTitle>
                    <CardDescription>
                        Điền thông tin chi tiết để thiết lập một KPI mới cho toàn công ty.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="kpi-name">Tên KPI</Label>
                        <Input id="kpi-name" value={kpiName} onChange={e => setKpiName(e.target.value)} placeholder="VD: Tăng trưởng doanh thu" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="kpi-description">Mô tả</Label>
                        <Textarea id="kpi-description" value={kpiDescription} onChange={e => setKpiDescription(e.target.value)} placeholder="Mô tả chi tiết về KPI..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="kpi-department">Phòng ban chịu trách nhiệm</Label>
                        <Select value={kpiDepartment} onValueChange={setKpiDepartment}>
                            <SelectTrigger id="kpi-department">
                            <SelectValue placeholder="Chọn phòng ban" />
                            </SelectTrigger>
                            <SelectContent>
                            {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="kpi-target">Mục tiêu</Label>
                            <Input id="kpi-target" type="number" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} placeholder="VD: 15" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kpi-unit">Đơn vị</Label>
                            <Input id="kpi-unit" value={kpiUnit} onChange={e => setKpiUnit(e.target.value)} placeholder="%, VNĐ, sản phẩm,..." />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="kpi-frequency">Tần suất đo lường</Label>
                             <Select value={kpiFrequency} onValueChange={setKpiFrequency}>
                                <SelectTrigger id="kpi-frequency">
                                    <SelectValue placeholder="Chọn tần suất" />
                                </SelectTrigger>
                                <SelectContent>
                                {kpiFrequencies.map(freq => (
                                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="kpi-reward-penalty">Cấu hình Thưởng/Phạt</Label>
                        <Textarea id="kpi-reward-penalty" value={kpiRewardPenalty} onChange={e => setKpiRewardPenalty(e.target.value)} placeholder="VD: Đạt 100% target thưởng 1M, dưới 80% phạt 500k..." />
                    </div>
                     <div className='flex justify-end'>
                        <Button onClick={handleCreateKpi}>
                            <PlusCircle className='h-4 w-4 mr-2' /> Lưu KPI
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
