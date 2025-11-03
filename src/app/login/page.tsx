'use client';

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
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useContext, useState, useEffect } from 'react';
import { SessionContext } from '@/contexts/SessionContext';
import { AuthService, LoginCredentials } from '@/services/auth-service';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { login, setIsLoggingIn } = useContext(SessionContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setCredentials(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.login(credentials);
      
      if (response.success && response.user) {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', credentials.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        login(response.user);
        setIsLoading(false); // Tắt loading state của login page
        setIsLoggingIn(true); // Bật logging in state để layout hiển thị splash screen
        
        // Delay redirect to show splash screen longer (3 seconds)
        setTimeout(() => {
          // Redirect based on role
          if (response.user.role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/employee/dashboard');
          }
          
          // Tắt logging in state sau khi redirect (sau một chút để đảm bảo trang load xong)
          setTimeout(() => {
            setIsLoggingIn(false);
          }, 500);
        }, 3000);
      } else {
        setError(response.error || 'Đăng nhập thất bại');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Có lỗi xảy ra khi đăng nhập');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo và Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
            <img 
              src="https://y99.vn/logo.png" 
              alt="Y99 Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <p className="text-gray-600">Hệ thống quản lý KPI và đánh giá hiệu suất</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center font-semibold">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin đăng nhập để truy cập hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={credentials.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Ghi nhớ đăng nhập
                </Label>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
              <p>Nếu bạn gặp vấn đề đăng nhập, vui lòng liên hệ quản trị viên</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2025 Y99 Company. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
