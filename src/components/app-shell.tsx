'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  CheckCircle2,
  LayoutDashboard,
  Settings,
  Target,
  Users,
  LogOut,
  LifeBuoy,
  Shield,
  User,
  FileText,
} from 'lucide-react';

import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

const userAvatar = PlaceHolderImages.find((p) => p.id === 'user-avatar');

const adminNavItems = [
  { href: '/admin/dashboard', icon: Shield, label: 'Admin Dashboard' },
  { href: '/admin/kpis', icon: FileText, label: 'Quản lý KPI' },
  { href: '/admin/assign', icon: CheckCircle2, label: 'Giao KPI' },
];

const employeeNavItems = [
  { href: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard của tôi' },
  { href: '#', icon: Target, label: 'KPI của tôi' },
];

const commonNavItems = [
  { href: '#', icon: Bell, label: 'Thông báo' },
  { href: '#', icon: Settings, label: 'Cài đặt' },
];

type UserData = {
  name: string;
  email: string;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      const storedUserData = localStorage.getItem('userData');
      setRole(storedRole);
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    }
  }, [pathname]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const navItems = role === 'admin' ? [...adminNavItems, ...commonNavItems] : [...employeeNavItems, ...commonNavItems];
  const activeItem = navItems.find(item => item.href === pathname);

  return (
    <ClientOnly>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-transparent"
              >
                <Activity className="h-6 w-6" />
              </Button>
              <h1 className="text-lg font-bold font-headline tracking-wider">
                KPICentral
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.href === activeItem?.href}
                    tooltip={{
                      children: item.label,
                      className: 'p-2',
                    }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={userAvatar?.imageUrl}
                      alt="User Avatar"
                      data-ai-hint={userAvatar?.imageHint}
                    />
                    <AvatarFallback>
                      {userData?.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="duration-200 group-data-[collapsible=icon]:hidden">
                    <p className="font-medium">{userData?.name ?? 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {userData?.email ?? 'user@example.com'}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userData?.name ?? 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userData?.email ?? 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  <span>Hỗ trợ</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/login">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <p className="font-semibold hidden sm:block">{userData?.name ?? 'User'}</p>
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
          </header>
          <main className="flex-1 p-2 md:p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ClientOnly>
  );
}
