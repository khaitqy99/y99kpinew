
'use client';

import type { Metadata } from "next";
import { AppShellContent } from "@/components/app-shell-content";
import { Toaster } from "@/components/ui/toaster";
import { SessionContext, SessionProvider } from "@/contexts/SessionContext";
import "./globals.css";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

// Metadata cannot be exported from a client component.
// We can either move it to a server component or define it statically.
// For now, let's keep it but be aware of this limitation in client components.
// export const metadata: Metadata = {
//   title: "KPICentral AppShell",
//   description: "A modern dashboard for Key Performance Indicators management.",
// };

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
        return null; // Or a global spinner
    }
    
    if (user) {
        // If user is logged in, show the main app shell
        return <AppShellContent>{children}</AppShellContent>;
    }
    
    // If no user, and we are on the login page, show the login page
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // If no user and not on login page, we are being redirected, so render nothing.
    return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>KPICentral App</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <SessionProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
