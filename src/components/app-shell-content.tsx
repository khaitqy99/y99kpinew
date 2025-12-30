'use client';
import React, { useContext, useMemo, useState } from 'react';
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
  Calculator,
  Cog,
  PanelLeft,
  DollarSign,
  User,
  Calendar,
  Building2,
  Globe,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { NotificationPanel } from './notification-panel';
import { SessionContext } from '@/contexts/SessionContext';
import { useTranslation } from '@/hooks/use-translation';

export function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, selectedBranch, language, setLanguage } = useContext(SessionContext);
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isMobile = useIsMobile();

  if (!user) {
    return null;
  }

  const adminNavItems = useMemo(
    () => [
      { href: '/admin/dashboard', icon: Shield, label: t('nav.adminDashboard') },
      { href: '/admin/kpis', icon: FileText, label: t('nav.manageKpi') },
      { href: '/admin/daily-kpi-progress', icon: Calendar, label: t('nav.dailyProgress') },
      { href: '/admin/assign', icon: CheckCircle2, label: t('nav.assignKpi') },
      { href: '/admin/approval', icon: FileCheck, label: t('nav.approval') },
      { href: '/admin/bonus-calculation', icon: Calculator, label: t('nav.bonusCalculation') },
      { href: '/admin/reports/branch-kpi', icon: Activity, label: t('nav.branchReport') },
      { href: '/settings', icon: Settings, label: t('nav.settings') },
    ],
    [t]
  );

  const employeeNavItems = useMemo(
    () => [
      { href: '/employee/dashboard', icon: LayoutDashboard, label: t('nav.myDashboard') },
      { href: '/employee/kpis', icon: Target, label: t('nav.allKpi') },
      { href: '/employee/kpi-bonus-penalty', icon: DollarSign, label: t('nav.bonusPenalty') },
      { href: '/employee/account', icon: User, label: t('nav.account') },
    ],
    [t]
  );

  const navItems = user.role === 'admin' ? adminNavItems : employeeNavItems;
  const activeItem = navItems.find(item => pathname.startsWith(item.href));

  const sidebarContent = (
    <div 
      className={cn(
        "flex h-full flex-col text-sidebar-foreground border-r border-sidebar-border shadow-lg sidebar-backdrop",
        "sidebar-container",
        isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border',
          'justify-center px-4'
        )}
      >
        <div className="flex items-center justify-center mt-2">
          <img 
            src="https://y99.vn/logo.png" 
            alt="Y99 Logo" 
            className={cn(
              "sidebar-logo transition-all duration-500 ease-out hover:scale-110",
              isCollapsed ? "h-6 w-auto" : "h-10 w-auto"
            )}
          />
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => (
            <Tooltip key={item.label} disableHoverableContent={!isCollapsed}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant={item.href === activeItem?.href ? 'default' : 'ghost'}
                  className={cn(
                    'w-full p-3 nav-item h-12',
                    item.href === activeItem?.href && 'nav-item-active',
                    !isCollapsed ? 'justify-start' : 'justify-center'
                  )}
                >
                  <Link 
                    href={item.href} 
                    className={cn(
                      "flex items-center relative z-10 w-full",
                      isCollapsed ? "justify-center" : "justify-start"
                    )}
                  >
                    <item.icon className={cn(
                      "size-5 flex-shrink-0",
                      isCollapsed ? "ml-1" : ""
                    )} />
                    <span className={cn(
                      'font-medium transition-all duration-500 ease-out overflow-hidden whitespace-nowrap',
                      isCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-full ml-3'
                    )}>
                      {item.label}
                    </span>
                  </Link>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="sidebar-tooltip">
                  <div>
                    <p className="font-medium">{item.label}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      {/* User section */}
      <div className="mt-auto shrink-0 border-t border-gray-200 p-2">
        <Separator className={cn('my-2 transition-all duration-300', isCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100')} />
        
        {/* User Profile */}
        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent={!isCollapsed}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full p-3 nav-item h-12',
                  !isCollapsed ? 'justify-start' : 'justify-center'
                )}
              >
                <Avatar className={cn(
                  "h-9 w-9 transition-transform duration-300 hover:scale-110",
                  isCollapsed ? "ml-1" : ""
                )}>
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.name}
                  />
                  <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'flex flex-col transition-all duration-500 ease-out overflow-hidden',
                    isCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-full ml-3'
                  )}
                >
                  <span className="font-semibold leading-tight text-black whitespace-nowrap">
                    {user?.name}
                  </span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {user?.email}
                  </span>
                </div>
              </Button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right" className="sidebar-tooltip">
                {user && (
                    <>
                        <p>{user.name}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                    </>
                )}
            </TooltipContent>}
          </Tooltip>
        </TooltipProvider>

        {/* Logout Button */}
        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent={!isCollapsed}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full p-3 nav-item h-12 mt-1',
                  !isCollapsed ? 'justify-start' : 'justify-center'
                )}
                onClick={logout}
              >
                <LogOut className={cn(
                  "size-5 flex-shrink-0",
                  isCollapsed ? "ml-1" : ""
                )} />
                <span className={cn(
                  'transition-all duration-500 ease-out overflow-hidden whitespace-nowrap',
                  isCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-full ml-3'
                )}>
                  Đăng xuất
                </span>
              </Button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right" className="sidebar-tooltip">Đăng xuất</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  const mainContent = (
    <div className="relative flex h-screen flex-col overflow-y-auto">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
         <div className="flex items-center gap-3">
           <div className="flex items-center gap-2">
             <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
             <h1 className="text-lg font-semibold text-gray-900">
               {activeItem?.label ?? 'Dashboard'}
             </h1>
           </div>
         </div>
         <div className="flex items-center gap-3">
           {user?.role === 'admin' && (
             <Link href="/admin/branches">
               <Button variant="outline" size="sm" className="gap-2">
                 <Building2 className="h-4 w-4" />
                 {selectedBranch ? (
                   <span className="hidden md:inline">{selectedBranch.name}</span>
                 ) : (
                   <span className="hidden md:inline">{t('nav.selectBranch')}</span>
                 )}
               </Button>
             </Link>
           )}
           {user?.role !== 'admin' && user?.branch_name && (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200">
               <Building2 className="h-4 w-4 text-blue-600" />
               <span className="text-sm font-medium text-blue-900 hidden md:inline">
                 {user.branch_name}
               </span>
             </div>
           )}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm" className="gap-2">
                 <Globe className="h-4 w-4" />
                 <span className="hidden md:inline">
                   {language === 'vi' ? 'Tiếng Việt' : 'English'}
                 </span>
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem
                 onClick={() => setLanguage('vi')}
                 className={language === 'vi' ? 'bg-accent' : ''}
               >
                 <span className="mr-2">🇻🇳</span>
                 Tiếng Việt
                 {language === 'vi' && <span className="ml-auto">✓</span>}
               </DropdownMenuItem>
               <DropdownMenuItem
                 onClick={() => setLanguage('en')}
                 className={language === 'en' ? 'bg-accent' : ''}
               >
                 <span className="mr-2">🇬🇧</span>
                 English
                 {language === 'en' && <span className="ml-auto">✓</span>}
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
           <NotificationPanel />
         </div>
       </header>
      <main className="flex-1 bg-muted/30 p-2 md:p-4">{children}</main>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen w-full">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelLeft className="size-5" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <img 
            src="https://y99.vn/logo.png" 
            alt="Y99 Logo" 
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link href="/admin/branches">
                <Button variant="outline" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  {selectedBranch && (
                    <span className="text-xs">{selectedBranch.name}</span>
                  )}
                </Button>
              </Link>
            )}
            {user?.role !== 'admin' && user?.branch_name && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 border border-blue-200">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">
                  {user.branch_name}
                </span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {language === 'vi' ? 'VI' : 'EN'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setLanguage('vi')}
                  className={language === 'vi' ? 'bg-accent' : ''}
                >
                  <span className="mr-2">🇻🇳</span>
                  Tiếng Việt
                  {language === 'vi' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'bg-accent' : ''}
                >
                  <span className="mr-2">🇬🇧</span>
                  English
                  {language === 'en' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationPanel />
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-background">
      {/* Backdrop overlay when sidebar is expanded */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-transparent z-40 transition-all duration-300 ease-in-out"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'hidden h-full border-r transition-all duration-500 ease-out md:flex md:flex-col bg-white shadow-lg fixed left-0 top-0 z-50',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
      
      {/* Main content */}
      <div className="flex-1 h-full ml-16">
        {mainContent}
      </div>
    </div>
  );
}
