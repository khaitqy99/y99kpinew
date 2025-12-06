'use client';

import React, { useContext, useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Building2, PlusCircle, ArrowRight, LogOut, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseDataContext } from '@/contexts/SupabaseDataContext';
import { SessionContext } from '@/contexts/SessionContext';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BranchesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { 
    branches, 
    addBranch,
    updateBranch,
    deleteBranch,
    allDepartments, // Use unfiltered data for calculating stats for all branches
    allUsers, // Use unfiltered data for calculating stats for all branches
    loading
  } = useContext(SupabaseDataContext);
  const { user, selectedBranch, setSelectedBranch, logout } = useContext(SessionContext);

  // Ensure arrays are always defined - use allDepartments and allUsers for accurate stats
  const safeDepartments = allDepartments || [];
  const safeUsers = allUsers || [];

  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBranchForEdit, setSelectedBranchForEdit] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      address: '',
      phone: '',
      email: '',
    });
    setSelectedBranchForEdit(null);
  };

  // Calculate counts for all branches using useMemo to ensure recalculation when data changes
  const branchStats = React.useMemo(() => {
    const stats: Record<number, { departmentCount: number; employeeCount: number }> = {};
    
    branches.forEach((branch: any) => {
      const branchId = Number(branch.id);
      
      // Count departments in this branch - handle null/undefined branch_id
      const departmentCount = safeDepartments.filter((dept: any) => {
        const deptBranchId = dept.branch_id != null ? Number(dept.branch_id) : null;
        return deptBranchId === branchId;
      }).length;
      
      // Get all departments in this branch
      const branchDepartmentIds = safeDepartments
        .filter((dept: any) => {
          const deptBranchId = dept.branch_id != null ? Number(dept.branch_id) : null;
          return deptBranchId === branchId;
        })
        .map((d: any) => Number(d.id));
      
      // Count employees in those departments (exclude admins - level >= 4)
      const employeeCount = safeUsers.filter((user: any) => {
        const level = user.level || user.roles?.level || 0;
        const userDeptId = user.department_id != null ? Number(user.department_id) : null;
        return userDeptId !== null && branchDepartmentIds.includes(userDeptId) && level < 4;
      }).length;
      
      stats[branchId] = { departmentCount, employeeCount };
    });
    
    return stats;
  }, [branches, safeDepartments, safeUsers]);

  // Helper functions to get counts for a specific branch
  const getDepartmentCount = (branchId: number | string): number => {
    const id = Number(branchId);
    return branchStats[id]?.departmentCount || 0;
  };

  const getEmployeeCount = (branchId: number | string): number => {
    const id = Number(branchId);
    return branchStats[id]?.employeeCount || 0;
  };

  // Handle create
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: 'Tên chi nhánh không được để trống.' 
      });
      return;
    }

    // Check duplicate name
    if (branches.some(branch => branch.name === formData.name.trim())) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: 'Chi nhánh đã tồn tại.' 
      });
      return;
    }

    try {
      await addBranch({
        name: formData.name.trim(),
        code: formData.code.trim() || formData.name.trim().toUpperCase().replace(/\s+/g, '_'),
        description: formData.description.trim() || `Chi nhánh ${formData.name.trim()}`,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
      });
      
      resetForm();
      setIsCreateDialogOpen(false);
      toast({
        title: 'Thành công!',
        description: 'Đã tạo chi nhánh mới.'
      });
    } catch (error: any) {
      console.error('Error creating branch:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể tạo chi nhánh. Vui lòng thử lại.' 
      });
    }
  };

  // Handle edit
  const handleEdit = (branch: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedBranchForEdit(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      description: branch.description || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: 'Tên chi nhánh không được để trống.' 
      });
      return;
    }

    // Check duplicate name (excluding current branch)
    if (branches.some(branch => 
      branch.name === formData.name.trim() && branch.id !== selectedBranchForEdit.id
    )) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: 'Chi nhánh đã tồn tại.' 
      });
      return;
    }

    try {
      await updateBranch(selectedBranchForEdit.id, {
        name: formData.name.trim(),
        code: formData.code.trim() || formData.name.trim().toUpperCase().replace(/\s+/g, '_'),
        description: formData.description.trim() || `Chi nhánh ${formData.name.trim()}`,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
      });
      
      resetForm();
      setIsEditDialogOpen(false);
      toast({
        title: 'Thành công!',
        description: 'Đã cập nhật chi nhánh.'
      });
    } catch (error: any) {
      console.error('Error updating branch:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể cập nhật chi nhánh. Vui lòng thử lại.' 
      });
    }
  };

  // Handle delete
  const handleDelete = (branch: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedBranchForEdit(branch);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedBranchForEdit) return;

    try {
      // Check if branch has departments
      const departmentCount = getDepartmentCount(selectedBranchForEdit.id);
      const employeeCount = getEmployeeCount(selectedBranchForEdit.id);

      if (departmentCount > 0 || employeeCount > 0) {
        toast({ 
          variant: 'destructive', 
          title: 'Lỗi', 
          description: `Không thể xóa chi nhánh này vì còn ${departmentCount} phòng ban và ${employeeCount} nhân viên.` 
        });
        setIsDeleteDialogOpen(false);
        return;
      }

      await deleteBranch(selectedBranchForEdit.id);
      resetForm();
      setIsDeleteDialogOpen(false);
      
      // Clear selected branch if it was deleted
      if (selectedBranch?.id === selectedBranchForEdit.id) {
        setSelectedBranch(null);
      }
      
      toast({
        title: 'Thành công!',
        description: 'Đã xóa chi nhánh.'
      });
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: error?.message || 'Không thể xóa chi nhánh. Vui lòng thử lại.' 
      });
    }
  };

  // Handle select branch
  const handleSelectBranch = (branch: any) => {
    setSelectedBranch({
      id: branch.id,
      name: branch.name,
      code: branch.code || '',
    });
    toast({
      title: 'Đã chọn chi nhánh',
      description: `Bạn đang quản lý: ${branch.name}`,
    });
    // Redirect to dashboard after selection
    setTimeout(() => {
      router.push('/admin/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://y99.vn/logo.png" 
              alt="Y99 Logo" 
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-semibold">Hệ thống Quản lý KPI</h1>
              <p className="text-sm text-muted-foreground">Quản lý chi nhánh</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Quản lý Chi nhánh</h2>
            <p className="text-muted-foreground">
              Quản lý các chi nhánh trong hệ thống
            </p>
          </div>

          {branches.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Chưa có chi nhánh nào</CardTitle>
                <CardDescription>
                  Tạo chi nhánh đầu tiên để bắt đầu sử dụng hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tạo chi nhánh đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch: any) => {
                // Get counts from memoized stats - will update automatically when data loads
                const branchId = Number(branch.id);
                const stats = branchStats[branchId] || { departmentCount: 0, employeeCount: 0 };
                const employeeCount = stats.employeeCount;
                const departmentCount = stats.departmentCount;
                const isSelected = selectedBranch?.id === branch.id;
                
                return (
                  <Card 
                    key={branch.id}
                    className={`transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary border-primary' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-3 rounded-lg ${
                            isSelected ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <img 
                              src="https://y99.vn/logo.png" 
                              alt="Y99 Logo" 
                              className="h-6 w-auto"
                            />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{branch.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {branch.code || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => handleEdit(branch, e)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => handleDelete(branch, e)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {branch.description || 'Không có mô tả'}
                      </p>
                      {branch.address && (
                        <p className="text-xs text-muted-foreground mb-2">
                          📍 {branch.address}
                        </p>
                      )}
                      <div className="flex items-center gap-4 pt-4 border-t">
                        <div className="text-sm">
                          <p className="text-muted-foreground">Phòng ban</p>
                          <p className="font-semibold">{departmentCount}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Nhân viên</p>
                          <p className="font-semibold">{employeeCount}</p>
                        </div>
                        <Button 
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBranch(branch);
                          }}
                        >
                          {isSelected ? 'Đã chọn' : 'Chọn'}
                          {!isSelected && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Add New Branch Card */}
              <Card 
                className="border-dashed cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] py-8">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <PlusCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg mb-2">Tạo chi nhánh mới</CardTitle>
                  <p className="text-sm text-muted-foreground text-center">
                    Thêm chi nhánh mới vào hệ thống
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo chi nhánh mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để tạo chi nhánh mới trong hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Tên chi nhánh *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Chi nhánh Hà Nội"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-code">Mã chi nhánh</Label>
                <Input
                  id="create-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VD: HN (để trống sẽ tự động tạo)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Mô tả</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về chi nhánh..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-address">Địa chỉ</Label>
              <Input
                id="create-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="VD: 123 Đường ABC, Quận XYZ, TP.HCM"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-phone">Số điện thoại</Label>
                <Input
                  id="create-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="VD: contact@example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsCreateDialogOpen(false);
            }}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chi nhánh</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chi nhánh
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Tên chi nhánh *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Chi nhánh Hà Nội"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Mã chi nhánh</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VD: HN"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về chi nhánh..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Địa chỉ</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="VD: 123 Đường ABC, Quận XYZ, TP.HCM"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="VD: contact@example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsEditDialogOpen(false);
            }}>
              Hủy
            </Button>
            <Button onClick={handleUpdate}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa chi nhánh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chi nhánh &quot;{selectedBranchForEdit?.name}&quot;?
              Hành động này không thể hoàn tác.
              {selectedBranchForEdit && (
                <>
                  <br />
                  <br />
                  <strong>Lưu ý:</strong> Chỉ có thể xóa chi nhánh khi không còn phòng ban và nhân viên nào.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
