'use client';

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShellContent } from "@/components/app-shell-content";
import { Toaster } from "@/components/ui/toaster";
import { SessionContext, SessionProvider } from "@/contexts/SessionContext";
import { DataProvider } from "@/contexts/DataContext";
import "./globals.css";

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const { user, isLoading } = React.useContext(SessionContext);
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !user && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isLoading, user, pathname, router]);

    if (isLoading) {
        return null;
    }

    if (!user) {
        // This will be the login page, which doesn't need the AppShell
        return <>{children}</>; 
    }
    
    // User is logged in, show the main app shell, but not on the login page itself
    if (pathname === '/login') {
        return null;
    }
    
    return <AppShellContent>{children}</AppShellContent>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>KPICentral App</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SessionProvider>
          <DataProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </DataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
