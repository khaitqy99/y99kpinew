'use client';
import React, { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  LayoutDashboard,
  Settings,
  Target,
  LogOut,
  LifeBuoy,
  Shield,
  FileText,
  FileCheck,
} from 'lucide-react';

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
import { NotificationPanel } from './notification-panel';
import { SessionContext } from '@/contexts/SessionContext';

const adminNavItems = [
  { href: '/admin/dashboard', icon: Shield, label: 'Admin Dashboard' },
  { href: '/admin/kpis', icon: FileText, label: 'Quản lý KPI' },
  { href: '/admin/assign', icon: CheckCircle2, label: 'Giao KPI' },
  { href: '/admin/approval', icon: FileCheck, label: 'Duyệt KPI' },
  { href: '/settings', icon: Settings, label: 'Cài đặt' },
];

const employeeNavItems = [
  { href: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard của tôi' },
  { href: '/employee/kpis', icon: Target, label: 'KPI của tôi' },
];

export function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useContext(SessionContext);

  // This component assumes `user` is always defined because RootLayout handles the auth check.
  if (!user) return null;

  const navItems = user.role === 'admin' ? adminNavItems : employeeNavItems;
  const activeItem = navItems.find(item => pathname.startsWith(item.href));

  return (
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
                    src={user.avatar}
                    alt="User Avatar"
                  />
                  <AvatarFallback>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="duration-200 group-data-[collapsible=icon]:hidden">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Hỗ trợ</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-2">
            <p className="font-semibold hidden sm:block">{activeItem?.label ?? 'Dashboard'}</p>
          </div>
          <NotificationPanel />
        </header>
        <main className="flex-1 p-2 md:p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
