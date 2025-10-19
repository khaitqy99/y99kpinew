import type { Metadata } from "next";
import { AppShellContent } from "@/components/app-shell-content";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/contexts/SessionContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPICentral AppShell",
  description: "A modern dashboard for Key Performance Indicators management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <SessionProvider>
          <AppShellContent>{children}</AppShellContent>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
