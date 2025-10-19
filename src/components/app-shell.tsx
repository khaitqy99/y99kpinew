import React from "react";
import Link from "next/link";
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
} from "lucide-react";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/sidebar";

const userAvatar = PlaceHolderImages.find((p) => p.id === "user-avatar");

const navItems = [
  { href: "#", icon: LayoutDashboard, label: "Dashboard" },
  { href: "#", icon: Target, label: "KPI Management" },
  { href: "#", icon: Users, label: "Employee Management" },
  { href: "#", icon: CheckCircle2, label: "KPI Approval" },
  { href: "#", icon: Bell, label: "Notifications" },
  { href: "#", icon: Settings, label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
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
            {navItems.map((item, index) => (
              <SidebarMenuItem key={item.href + index}>
                <SidebarMenuButton
                  asChild
                  isActive={index === 0}
                  tooltip={{
                    children: item.label,
                    className: "p-2",
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
                  <AvatarFallback>AU</AvatarFallback>
                </Avatar>
                <div className="duration-200 group-data-[collapsible=icon]:hidden">
                  <p className="font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">
                    admin@kpicentral.com
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Admin User
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@kpicentral.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex justify-between items-center w-full">
                  <Label htmlFor="theme-switch">Dark Mode</Label>
                  <ThemeToggle />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-2">
            <p className="font-semibold hidden sm:block">Admin User</p>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
