'use client';

import React, { useState, useContext } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { formatDateToLocal } from '@/lib/utils';
import type { Employee } from '@/services/supabase-service';
import { roleService } from '@/services/supabase-service';
import { companyService } from '@/services/supabase-service';

export function UsersDepartmentsTab() {
  const { toast } = useToast();
  const { 
      users, addUser, 
      departments, addDepartment,
  } = useContext(SupabaseDataContext);

  // State for Departments
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDescription, setNewDeptDescription] = useState('');

  // State for Roles (removed Role Management UI)

  // State for Users
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [newUserPosition, setNewUserPosition] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên phòng ban không được để trống.' });
        return;
    }
    if (departments.some(dept => dept.name === newDeptName.trim())) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Phòng ban đã tồn tại.' });
        return;
    }
    
    try {
      await addDepartment({
        name: newDeptName.trim(),
        code: newDeptCode.trim() || newDeptName.trim().toUpperCase().replace(/\s+/g, '_'),
        description: newDeptDescription.trim() || `Phòng ban ${newDeptName.trim()}`
      });
      
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptDescription('');
      toast({
          title: 'Thành công!',
          description: 'Đã tạo phòng ban mới.'
      });
    } catch (error) {
      console.error('Error creating department:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: 'Không thể tạo phòng ban. Vui lòng thử lại.' 
      });
    }
  };

  // Role management handlers removed
  
  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserDept || !newUserPassword.trim()) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin nhân viên bao gồm mật khẩu.' });
        return;
    }
    const selectedDept = departments.find(d => d.name === newUserDept);
    if (!selectedDept) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Phòng ban không hợp lệ.' });
        return;
    }
    
    try {
      // Tạo employee_code tự động
      const employeeCount = (users || []).length + 1;
      const employeeCode = `EMP${String(employeeCount).padStart(4, '0')}`;
      
      // Xác định role_id dựa trên role level
      let roleId: string;
      let level: number;
      
      switch (newUserRole) {
        case 'admin':
          level = 4;
          break;
        case 'manager':
          level = 2;
          break;
        default:
          level = 1;
      }
      
      // Lấy company mặc định (đảm bảo tồn tại để tránh lỗi FK)
      const company = await companyService.getDefault();
      if (!company) {
        throw new Error('Không tìm thấy công ty mặc định. Vui lòng tạo công ty trước.');
      }

      // Lấy role_id từ database dựa trên level (tự động tạo nếu chưa có)
      const role = await roleService.ensureRoleForLevel(level, company.id);
      roleId = role.id;
      
      const newUser: Omit<Employee, 'id' | 'created_at' | 'updated_at'> = {
        company_id: company.id,
        employee_code: employeeCode,
        name: newUserName,
        email: newUserEmail,
        phone: '',
        avatar_url: `https://picsum.photos/seed/${employeeCount + 10}/40/40`,
        role_id: roleId,
        department_id: selectedDept.id,
        manager_id: null,
        position: newUserPosition || 'Nhân viên',
        level: level,
        salary: 0,
        currency: 'VND',
        hire_date: formatDateToLocal(new Date()), // Format YYYY-MM-DD using local timezone
        contract_type: 'full_time',
        status: 'active',
        is_active: true,
        password_hash: newUserPassword, // Plain text cho demo
        last_login: null,
        login_attempts: 0,
        locked_until: null,
      };
      
      await addUser(newUser);
      
      // Reset form
      setNewUserName('');
      setNewUserEmail('');
      setNewUserDept('');
      setNewUserRole('employee');
      setNewUserPosition('');
      setNewUserPassword('');
      
      toast({
          title: 'Thành công!',
          description: 'Đã tạo người dùng mới.'
      });
    } catch (error: any) {
      console.error('Error creating user:', error?.message || error, error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể tạo người dùng. Vui lòng thử lại.' 
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top row - Department and User */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Management */}
        <Card>
          <CardHeader>
            <CardTitle>Quản lý phòng ban</CardTitle>
            <CardDescription>Tạo và xem danh sách các phòng ban.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-3">
                <div className="space-y-2">
                    <Label htmlFor="new-dept">Tên phòng ban mới</Label>
                    <Input id="new-dept" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="VD: Chăm sóc khách hàng" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-dept-code">Mã phòng ban</Label>
                    <Input id="new-dept-code" value={newDeptCode} onChange={e => setNewDeptCode(e.target.value)} placeholder="VD: CSKH" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-dept-desc">Mô tả</Label>
                    <Textarea id="new-dept-desc" value={newDeptDescription} onChange={e => setNewDeptDescription(e.target.value)} placeholder="Mô tả phòng ban..." />
                </div>
                <Button onClick={handleCreateDepartment} className="w-full">
                    <PlusCircle className='h-4 w-4 mr-2' /> Tạo phòng ban
                </Button>
            </div>
            <Separator />
             <h3 className="text-sm font-medium">Danh sách phòng ban</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tên phòng ban</TableHead>
                        <TableHead>Mã phòng ban</TableHead>
                        <TableHead>Mô tả</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {departments.length > 0 ? departments.map(dept => (
                        <TableRow key={dept.id}>
                            <TableCell className="font-medium">{dept.name}</TableCell>
                            <TableCell>{dept.code || 'N/A'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{dept.description || 'N/A'}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                <div className="flex flex-col items-center justify-center">
                                    <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">Chưa có phòng ban nào</p>
                                    <p className="text-sm text-muted-foreground">Tạo phòng ban mới để bắt đầu</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>Quản lý người dùng</CardTitle>
            <CardDescription>Tạo và quản lý tài khoản nhân viên.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
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
                                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="new-user-role">Vai trò</Label>
                      <Select value={newUserRole} onValueChange={(value: 'admin' | 'manager' | 'employee') => setNewUserRole(value)}>
                          <SelectTrigger id="new-user-role">
                              <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="employee">Nhân viên</SelectItem>
                              <SelectItem value="manager">Quản lý</SelectItem>
                              <SelectItem value="admin">Quản trị viên</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="new-user-position">Vị trí</Label>
                      <Input id="new-user-position" value={newUserPosition} onChange={e => setNewUserPosition(e.target.value)} placeholder="VD: Chuyên viên" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="new-user-password">Mật khẩu</Label>
                      <Input id="new-user-password" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Nhập mật khẩu cho tài khoản" />
                  </div>
               </div>
             </div>
             <div className="flex justify-center">
               <Button className="w-full md:w-auto" onClick={handleCreateUser}>
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
                          <TableHead>Vai trò</TableHead>
                          <TableHead>Vị trí</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(users || []).length > 0 ? (users || []).map(user => (
                          <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.departments?.name || 'N/A'}</TableCell>
                              <TableCell>{user.roles?.name || 'N/A'}</TableCell>
                              <TableCell>{user.position}</TableCell>
                          </TableRow>
                      )) : (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                  <div className="flex flex-col items-center justify-center">
                                      <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                      <p className="text-muted-foreground">Chưa có nhân viên nào</p>
                                      <p className="text-sm text-muted-foreground">Tạo nhân viên mới để bắt đầu</p>
                                  </div>
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
      
    </div>
  );
}
