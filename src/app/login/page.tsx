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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { SessionContext } from '@/contexts/SessionContext';
import { employees } from '@/data/employees';

const adminUser = {
  id: 'admin-01',
  name: 'Admin User',
  email: 'admin@kpicentral.com',
  role: 'admin',
  department: 'Management',
  avatar: 'https://picsum.photos/seed/1/40/40'
};

const employeeUser = employees.find(e => e.email === 'nva@example.com');


export default function LoginPage() {
  const router = useRouter();
  const { login } = useContext(SessionContext);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = formData.get('role') as string;
    
    if (role === 'admin') {
      login(adminUser);
      router.push('/admin/dashboard');
    } else {
      login(employeeUser!);
      router.push('/employee/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Chọn vai trò để truy cập vào tài khoản dashboard tương ứng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                defaultValue="admin@kpicentral.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                required
                defaultValue="password"
              />
            </div>
            <div className="grid gap-2">
              <Label>Vai trò</Label>
              <RadioGroup defaultValue="admin" name="role" className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin">Admin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="employee" id="employee" />
                  <Label htmlFor="employee">Nhân viên</Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
