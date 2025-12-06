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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, Pencil, Trash2, MoreVertical, ChevronDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { SessionContext } from '@/contexts/SessionContext';
import { formatDateToLocal, getRoleLabel, cn } from '@/lib/utils';
import type { Employee } from '@/services/supabase-service';
import { roleService, employeeService } from '@/services/supabase-service';

export function UsersDepartmentsTab() {
  const { toast } = useToast();
  const { 
      users, addUser, updateUser, deleteUser,
      departments, addDepartment, updateDepartment, deleteDepartment,
      branches,
  } = useContext(SupabaseDataContext);
  const { selectedBranch } = useContext(SessionContext);

  // State for Departments
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDescription, setNewDeptDescription] = useState('');
  const [newDeptBranchId, setNewDeptBranchId] = useState<string>(selectedBranch?.id?.toString() || '');
  
  // Department dialogs
  const [isDeptEditDialogOpen, setIsDeptEditDialogOpen] = useState(false);
  const [isDeptDeleteDialogOpen, setIsDeptDeleteDialogOpen] = useState(false);
  const [selectedDeptForEdit, setSelectedDeptForEdit] = useState<any>(null);
  const [selectedDeptForDelete, setSelectedDeptForDelete] = useState<any>(null);
  
  // Department edit form
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptDescription, setEditDeptDescription] = useState('');
  const [editDeptBranchId, setEditDeptBranchId] = useState<string>('');

  // Cập nhật branch_id khi selectedBranch thay đổi
  React.useEffect(() => {
    if (selectedBranch?.id && !newDeptBranchId) {
      setNewDeptBranchId(selectedBranch.id.toString());
    }
  }, [selectedBranch]);

  // State for Users
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDepts, setNewUserDepts] = useState<number[]>([]); // Array of department IDs
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [newUserPosition, setNewUserPosition] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // User dialogs
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<any>(null);

  // User edit form
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserDepts, setEditUserDepts] = useState<number[]>([]); // Array of department IDs
  const [editUserRole, setEditUserRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [editUserPosition, setEditUserPosition] = useState('');
  const [editUserStatus, setEditUserStatus] = useState<'active' | 'inactive' | 'suspended' | 'terminated'>('active');

  // Department handlers
  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên phòng ban không được để trống.' });
        return;
    }
    if (departments.some(dept => dept.name === newDeptName.trim())) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Phòng ban đã tồn tại.' });
        return;
    }
    if (!newDeptBranchId) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng chọn chi nhánh cho phòng ban.' });
        return;
    }
    
    try {
      await addDepartment({
        name: newDeptName.trim(),
        code: newDeptCode.trim() || newDeptName.trim().toUpperCase().replace(/\s+/g, '_'),
        description: newDeptDescription.trim() || `Phòng ban ${newDeptName.trim()}`,
        branch_id: newDeptBranchId ? parseInt(newDeptBranchId, 10) : null
      });
      
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptDescription('');
      setNewDeptBranchId(selectedBranch?.id?.toString() || '');
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

  const handleEditDepartment = (dept: any) => {
    setSelectedDeptForEdit(dept);
    setEditDeptName(dept.name || '');
    setEditDeptCode(dept.code || '');
    setEditDeptDescription(dept.description || '');
    setEditDeptBranchId(dept.branch_id?.toString() || '');
    setIsDeptEditDialogOpen(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editDeptName.trim()) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên phòng ban không được để trống.' });
      return;
    }
    if (departments.some(dept => dept.name === editDeptName.trim() && dept.id !== selectedDeptForEdit.id)) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Phòng ban đã tồn tại.' });
      return;
    }
    if (!editDeptBranchId) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng chọn chi nhánh cho phòng ban.' });
      return;
    }

    try {
      await updateDepartment(selectedDeptForEdit.id.toString(), {
        name: editDeptName.trim(),
        code: editDeptCode.trim() || editDeptName.trim().toUpperCase().replace(/\s+/g, '_'),
        description: editDeptDescription.trim() || `Phòng ban ${editDeptName.trim()}`,
        branch_id: editDeptBranchId ? parseInt(editDeptBranchId, 10) : null
      });
      
      setIsDeptEditDialogOpen(false);
      setSelectedDeptForEdit(null);
      toast({
        title: 'Thành công!',
        description: 'Đã cập nhật phòng ban.'
      });
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể cập nhật phòng ban. Vui lòng thử lại.' 
      });
    }
  };

  const handleDeleteDepartment = (dept: any) => {
    setSelectedDeptForDelete(dept);
    setIsDeptDeleteDialogOpen(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!selectedDeptForDelete) return;

    // Check if department has employees
    const hasEmployees = users.some((user: any) => {
      const userDeptIds = user.department_ids || 
                          (user.all_departments ? user.all_departments.map((d: any) => d.id) : []) ||
                          (user.department_id ? [user.department_id] : []);
      return userDeptIds.includes(selectedDeptForDelete.id);
    });
    if (hasEmployees) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: 'Không thể xóa phòng ban vì còn nhân viên trong phòng ban này.' 
      });
      setIsDeptDeleteDialogOpen(false);
      setSelectedDeptForDelete(null);
      return;
    }

    try {
      await deleteDepartment(selectedDeptForDelete.id.toString());
      setIsDeptDeleteDialogOpen(false);
      setSelectedDeptForDelete(null);
      toast({
        title: 'Thành công!',
        description: 'Đã xóa phòng ban.'
      });
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể xóa phòng ban. Vui lòng thử lại.' 
      });
    }
  };
  
  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || newUserDepts.length === 0 || !newUserPassword.trim()) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin nhân viên bao gồm mật khẩu và ít nhất một phòng ban.' });
        return;
    }
    
    // Validate all selected departments
    const selectedDepts = departments.filter(d => newUserDepts.includes(d.id));
    if (selectedDepts.length !== newUserDepts.length) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Một hoặc nhiều phòng ban không hợp lệ.' });
        return;
    }
    
    // Kiểm tra xem phòng ban đã được gán cho chi nhánh chưa (nếu có selectedBranch)
    if (selectedBranch) {
        const invalidDepts = selectedDepts.filter(d => !d.branch_id || d.branch_id !== selectedBranch.id);
        if (invalidDepts.length > 0) {
            toast({ 
                variant: 'destructive', 
                title: 'Lỗi', 
                description: `Một hoặc nhiều phòng ban chưa được gán cho chi nhánh "${selectedBranch.name}". Vui lòng cập nhật phòng ban trước khi tạo nhân viên.` 
            });
            return;
        }
    }
    
    try {
      // Tạo employee_code tự động (unique từ database)
      const employeeCode = await employeeService.generateUniqueEmployeeCode();
      
      // Xác định role_id dựa trên role level
      let roleId: number;
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
      
      // Lấy role_id từ database dựa trên level (tự động tạo nếu chưa có)
      const role = await roleService.ensureRoleForLevel(level);
      roleId = role.id;
      
      // Primary department là department đầu tiên
      const primaryDeptId = newUserDepts[0];
      
      const newUser: Omit<Employee, 'id' | 'created_at' | 'updated_at'> = {
        employee_code: employeeCode,
        name: newUserName,
        email: newUserEmail,
        avatar_url: `https://picsum.photos/seed/${Date.now()}/40/40`,
        role_id: roleId,
        department_id: primaryDeptId, // Primary department for backward compatibility
        position: newUserPosition || 'Nhân viên',
        level: level,
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
      
      const createdUser = await addUser(newUser);
      
      // Set multiple departments for the employee
      if (createdUser?.id && newUserDepts.length > 0) {
        try {
          await employeeService.setEmployeeDepartments(createdUser.id, newUserDepts, primaryDeptId);
        } catch (deptError: any) {
          console.error('Error setting employee departments:', deptError);
          // Log but don't fail the entire operation - user is already created
          toast({
            variant: 'destructive',
            title: 'Cảnh báo',
            description: 'Nhân viên đã được tạo nhưng có lỗi khi gán phòng ban. Vui lòng cập nhật lại.'
          });
        }
      }
      
      // Reset form
      setNewUserName('');
      setNewUserEmail('');
      setNewUserDepts([]);
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
  };

  const handleEditUser = async (user: any) => {
    setSelectedUserForEdit(user);
    setEditUserName(user.name || '');
    setEditUserEmail(user.email || '');
    
    // Load all departments for this user
    let userDeptIds: number[] = [];
    if (user.all_departments && user.all_departments.length > 0) {
      userDeptIds = user.all_departments.map((d: any) => d.id);
    } else if (user.department_ids && user.department_ids.length > 0) {
      userDeptIds = user.department_ids;
    } else if (user.departments?.id) {
      userDeptIds = [user.departments.id];
    } else if (user.department_id) {
      userDeptIds = [user.department_id];
    }
    
    setEditUserDepts(userDeptIds);
    
    // Determine role from level
    const level = user.level || user.roles?.level || 1;
    if (level >= 4) {
      setEditUserRole('admin');
    } else if (level >= 2) {
      setEditUserRole('manager');
    } else {
      setEditUserRole('employee');
    }
    setEditUserPosition(user.position || '');
    setEditUserStatus(user.status || 'active');
    setIsUserEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUserName.trim() || !editUserEmail.trim() || editUserDepts.length === 0) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin bắt buộc và chọn ít nhất một phòng ban.' });
      return;
    }

    // Validate all selected departments
    const selectedDepts = departments.filter(d => editUserDepts.includes(d.id));
    if (selectedDepts.length !== editUserDepts.length) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Một hoặc nhiều phòng ban không hợp lệ.' });
      return;
    }

    try {
      // Determine level and role_id
      let level: number;
      switch (editUserRole) {
        case 'admin':
          level = 4;
          break;
        case 'manager':
          level = 2;
          break;
        default:
          level = 1;
      }
      
      const role = await roleService.ensureRoleForLevel(level);
      
      // Primary department là department đầu tiên
      const primaryDeptId = editUserDepts[0];
      
      await updateUser(selectedUserForEdit.id.toString(), {
        name: editUserName.trim(),
        email: editUserEmail.trim(),
        department_id: primaryDeptId, // Primary department for backward compatibility
        role_id: role.id,
        position: editUserPosition.trim() || 'Nhân viên',
        level: level,
        status: editUserStatus,
      });
      
      // Update multiple departments for the employee
      await employeeService.setEmployeeDepartments(selectedUserForEdit.id, editUserDepts, primaryDeptId);
      
      setIsUserEditDialogOpen(false);
      setSelectedUserForEdit(null);
      toast({
        title: 'Thành công!',
        description: 'Đã cập nhật thông tin nhân viên.'
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể cập nhật nhân viên. Vui lòng thử lại.' 
      });
    }
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUserForDelete(user);
    setIsUserDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUserForDelete) return;

    try {
      await deleteUser(selectedUserForDelete.id);
      setIsUserDeleteDialogOpen(false);
      setSelectedUserForDelete(null);
      toast({
        title: 'Thành công!',
        description: 'Đã xóa nhân viên.'
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể xóa nhân viên. Vui lòng thử lại.' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top row - Department and User */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Management */}
        <Card>
          <CardHeader>
            <CardTitle>Quản lý phòng ban</CardTitle>
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
                <div className="space-y-2">
                    <Label htmlFor="new-dept-branch">Chi nhánh *</Label>
                    <Select value={newDeptBranchId} onValueChange={setNewDeptBranchId}>
                        <SelectTrigger id="new-dept-branch">
                            <SelectValue placeholder="Chọn chi nhánh" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.map(branch => (
                                <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedBranch && !newDeptBranchId && (
                        <p className="text-xs text-muted-foreground">
                            Chi nhánh hiện tại: {selectedBranch.name}
                        </p>
                    )}
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
                        <TableHead>Chi nhánh</TableHead>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {departments.length > 0 ? departments.map(dept => {
                        // Count only employees (exclude admins - level >= 4) in this department
                        const employeeCount = users.filter(user => {
                            const level = user.level || user.roles?.level || 0;
                            if (level >= 4) return false;
                            
                            // Check if user belongs to this department
                            const userDeptIds = user.department_ids || 
                                              (user.all_departments ? user.all_departments.map((d: any) => d.id) : []) ||
                                              (user.department_id ? [user.department_id] : []);
                            return userDeptIds.includes(dept.id);
                        }).length;
                        const branchName = branches.find(b => b.id === dept.branch_id)?.name || 'Chưa gán';
                        return (
                            <TableRow key={dept.id}>
                                <TableCell className="font-medium">{dept.name}</TableCell>
                                <TableCell>{dept.code || 'N/A'}</TableCell>
                                <TableCell className="text-sm">{branchName}</TableCell>
                                <TableCell className="text-center">{employeeCount}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditDepartment(dept)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Sửa
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteDepartment(dept)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Xóa
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    }) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
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
                      <Label htmlFor="new-user-dept">Phòng ban * (có thể chọn nhiều)</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                      "w-full justify-between",
                                      !newUserDepts.length && "text-muted-foreground"
                                  )}
                              >
                                  {newUserDepts.length > 0
                                      ? `${newUserDepts.length} phòng ban đã chọn`
                                      : "Chọn phòng ban"}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                              <div className="max-h-60 overflow-y-auto p-2">
                                  {departments.length === 0 ? (
                                      <p className="text-sm text-muted-foreground p-2">Chưa có phòng ban nào</p>
                                  ) : (
                                      departments.map(dept => {
                                          const branchName = branches.find(b => b.id === dept.branch_id)?.name || '';
                                          const isSelected = newUserDepts.includes(dept.id);
                                          return (
                                              <div
                                                  key={dept.id}
                                                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                                  onClick={() => {
                                                      if (isSelected) {
                                                          setNewUserDepts(newUserDepts.filter(id => id !== dept.id));
                                                      } else {
                                                          setNewUserDepts([...newUserDepts, dept.id]);
                                                      }
                                                  }}
                                              >
                                                  <Checkbox
                                                      checked={isSelected}
                                                      onCheckedChange={(checked) => {
                                                          if (checked) {
                                                              setNewUserDepts([...newUserDepts, dept.id]);
                                                          } else {
                                                              setNewUserDepts(newUserDepts.filter(id => id !== dept.id));
                                                          }
                                                      }}
                                                  />
                                                  <Label className="text-sm font-normal cursor-pointer flex-1">
                                                      {dept.name} {branchName && `(${branchName})`}
                                                  </Label>
                                              </div>
                                          );
                                      })
                                  )}
                              </div>
                          </PopoverContent>
                      </Popover>
                      {newUserDepts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                              {newUserDepts.map(deptId => {
                                  const dept = departments.find(d => d.id === deptId);
                                  if (!dept) return null;
                                  const branchName = branches.find(b => b.id === dept.branch_id)?.name || '';
                                  return (
                                      <Badge key={deptId} variant="secondary" className="pr-1">
                                          {dept.name} {branchName && `(${branchName})`}
                                          <button
                                              onClick={() => setNewUserDepts(newUserDepts.filter(id => id !== deptId))}
                                              className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                          >
                                              <X className="h-3 w-3" />
                                          </button>
                                      </Badge>
                                  );
                              })}
                          </div>
                      )}
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
                          <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(users || []).length > 0 ? (users || []).map(user => (
                          <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                  {user.all_departments && user.all_departments.length > 0 ? (
                                      <div className="space-y-1">
                                          {user.all_departments.map((dept: any, idx: number) => (
                                              <div key={dept.id} className="text-sm">
                                                  {dept.name}
                                                  {idx === 0 && user.all_departments.length > 1 && (
                                                      <span className="text-xs text-muted-foreground ml-1">(chính)</span>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                  ) : (
                                      user.departments?.name || 'N/A'
                                  )}
                              </TableCell>
                              <TableCell>{getRoleLabel(user.roles?.name)}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Xóa
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
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

      {/* Department Edit Dialog */}
      <Dialog open={isDeptEditDialogOpen} onOpenChange={setIsDeptEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa phòng ban</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin phòng ban
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dept-name">Tên phòng ban *</Label>
              <Input
                id="edit-dept-name"
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                placeholder="VD: Chăm sóc khách hàng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-code">Mã phòng ban</Label>
              <Input
                id="edit-dept-code"
                value={editDeptCode}
                onChange={(e) => setEditDeptCode(e.target.value)}
                placeholder="VD: CSKH"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-desc">Mô tả</Label>
              <Textarea
                id="edit-dept-desc"
                value={editDeptDescription}
                onChange={(e) => setEditDeptDescription(e.target.value)}
                placeholder="Mô tả phòng ban..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-branch">Chi nhánh *</Label>
              <Select value={editDeptBranchId} onValueChange={setEditDeptBranchId}>
                <SelectTrigger id="edit-dept-branch">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateDepartment}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Delete Dialog */}
      <AlertDialog open={isDeptDeleteDialogOpen} onOpenChange={setIsDeptDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phòng ban</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phòng ban "{selectedDeptForDelete?.name}"? 
              Hành động này không thể hoàn tác. Phòng ban sẽ bị vô hiệu hóa thay vì xóa hoàn toàn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDeptForDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDepartment} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Edit Dialog */}
      <Dialog open={isUserEditDialogOpen} onOpenChange={setIsUserEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa thông tin nhân viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin nhân viên
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Tên nhân viên *</Label>
                <Input
                  id="edit-user-name"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  placeholder="VD: Nguyễn Văn B"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email *</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  placeholder="VD: nvb@example.com"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-dept">Phòng ban * (có thể chọn nhiều)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-full justify-between",
                                !editUserDepts.length && "text-muted-foreground"
                            )}
                        >
                            {editUserDepts.length > 0
                                ? `${editUserDepts.length} phòng ban đã chọn`
                                : "Chọn phòng ban"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <div className="max-h-60 overflow-y-auto p-2">
                            {departments.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-2">Chưa có phòng ban nào</p>
                            ) : (
                                departments.map(dept => {
                                    const branchName = branches.find(b => b.id === dept.branch_id)?.name || '';
                                    const isSelected = editUserDepts.includes(dept.id);
                                    return (
                                        <div
                                            key={dept.id}
                                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setEditUserDepts(editUserDepts.filter(id => id !== dept.id));
                                                } else {
                                                    setEditUserDepts([...editUserDepts, dept.id]);
                                                }
                                            }}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setEditUserDepts([...editUserDepts, dept.id]);
                                                    } else {
                                                        setEditUserDepts(editUserDepts.filter(id => id !== dept.id));
                                                    }
                                                }}
                                            />
                                            <Label className="text-sm font-normal cursor-pointer flex-1">
                                                {dept.name} {branchName && `(${branchName})`}
                                            </Label>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
                {editUserDepts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {editUserDepts.map(deptId => {
                            const dept = departments.find(d => d.id === deptId);
                            if (!dept) return null;
                            const branchName = branches.find(b => b.id === dept.branch_id)?.name || '';
                            return (
                                <Badge key={deptId} variant="secondary" className="pr-1">
                                    {dept.name} {branchName && `(${branchName})`}
                                    <button
                                        onClick={() => setEditUserDepts(editUserDepts.filter(id => id !== deptId))}
                                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-role">Vai trò</Label>
                <Select value={editUserRole} onValueChange={(value: 'admin' | 'manager' | 'employee') => setEditUserRole(value)}>
                  <SelectTrigger id="edit-user-role">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Nhân viên</SelectItem>
                    <SelectItem value="manager">Quản lý</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-position">Vị trí</Label>
                <Input
                  id="edit-user-position"
                  value={editUserPosition}
                  onChange={(e) => setEditUserPosition(e.target.value)}
                  placeholder="VD: Chuyên viên"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-status">Trạng thái</Label>
                <Select value={editUserStatus} onValueChange={(value: 'active' | 'inactive' | 'suspended' | 'terminated') => setEditUserStatus(value)}>
                  <SelectTrigger id="edit-user-status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="suspended">Tạm ngưng</SelectItem>
                    <SelectItem value="terminated">Đã chấm dứt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateUser}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Delete Dialog */}
      <AlertDialog open={isUserDeleteDialogOpen} onOpenChange={setIsUserDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhân viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa nhân viên "{selectedUserForDelete?.name}"? 
              Hành động này không thể hoàn tác. Nhân viên sẽ bị vô hiệu hóa thay vì xóa hoàn toàn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUserForDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </div>
  );
}
