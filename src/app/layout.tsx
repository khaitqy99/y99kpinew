
'use client';

import type { Metadata } from "next";
import { AppShellContent } from "@/components/app-shell-content";
import { Toaster } from "@/components/ui/toaster";
import { SessionContext, SessionProvider } from "@/contexts/SessionContext";
import "./globals.css";
import React from "react";

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

    if (isLoading) {
        return null; // Render nothing while session is loading
    }
    
    if (user) {
        return <AppShellContent>{children}</AppShellContent>;
    }

    return <>{children}</>;
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
