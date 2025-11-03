'use client';

import React, { useContext, useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { SessionContext } from '@/contexts/SessionContext';
import { AuthService, ChangePasswordRequest } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';


export default function EmployeeAccountPage() {
  const { user } = useContext(SessionContext);
  const { toast } = useToast();
  
  // State for change password dialog
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Form state
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: keyof ChangePasswordRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin người dùng",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await AuthService.changePassword(user.id, formData);
      
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đổi mật khẩu thành công!",
        });
        
        // Reset form and close dialog
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsChangePasswordOpen(false);
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Có lỗi xảy ra khi đổi mật khẩu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi đổi mật khẩu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.currentPassword && 
                     formData.newPassword && 
                     formData.confirmPassword &&
                     formData.newPassword === formData.confirmPassword &&
                     formData.newPassword.length >= 6;

  return (
    <>
      <style jsx global>{`
        /* Ẩn nút show/hide password mặc định của browser */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
        }
        
        /* Firefox */
        input[type="password"]::-moz-caps-lock-indicator {
          display: none;
        }
      `}</style>
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex flex-1 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cài đặt tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Đổi mật khẩu</Label>
              <p className="text-sm text-muted-foreground">
                Cập nhật mật khẩu để bảo mật tài khoản của bạn
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Đổi mật khẩu
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Đổi mật khẩu
            </DialogTitle>
            <DialogDescription>
              Vui lòng nhập mật khẩu hiện tại và mật khẩu mới
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="pr-12 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="pr-12 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="pr-12 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password Mismatch Warning */}
            {formData.newPassword && formData.confirmPassword && 
             formData.newPassword !== formData.confirmPassword && (
              <p className="text-sm text-red-600">
                Mật khẩu xác nhận không khớp
              </p>
            )}

            {/* Password Length Warning */}
            {formData.newPassword && formData.newPassword.length < 6 && (
              <p className="text-sm text-red-600">
                Mật khẩu phải có ít nhất 6 ký tự
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangePasswordOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đổi mật khẩu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
