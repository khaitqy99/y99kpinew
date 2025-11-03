'use client';

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShellContent } from "@/components/app-shell-content";
import { Toaster } from "@/components/ui/toaster";
import { SessionContext, SessionProvider } from "@/contexts/SessionContext";
import { SupabaseDataProvider } from "@/contexts/SupabaseDataContext";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const { user, isLoading, isLoggingOut, isLoggingIn } = React.useContext(SessionContext);
    const pathname = usePathname();
    const router = useRouter();
    const [isFadingOut, setIsFadingOut] = React.useState(false);
    const [showSplash, setShowSplash] = React.useState(true);

    React.useEffect(() => {
        if (!isLoading && !user && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isLoading, user, pathname, router]);

    // Trigger fade out when loading finishes
    React.useEffect(() => {
        if (!isLoading && !isLoggingIn && !isLoggingOut) {
            // Start fade out
            setIsFadingOut(true);
            // Hide splash after fade completes
            const timer = setTimeout(() => {
                setShowSplash(false);
            }, 300); // Match fade out duration
            
            return () => clearTimeout(timer);
        } else {
            setIsFadingOut(false);
            setShowSplash(true);
        }
    }, [isLoading, isLoggingIn, isLoggingOut]);

    // Determine what content to render
    let content = null;
    if (!user) {
        content = <>{children}</>; // Login page
    } else if (pathname === '/login') {
        content = null; // Already logged in
    } else {
        content = <AppShellContent>{children}</AppShellContent>; // Main app
    }

    return (
        <>
            {/* Show splash with fade out */}
            {showSplash && <SplashScreen isFadingOut={isFadingOut} />}
            
            {/* Render content normally - it will load in background while splash fades */}
            {content}
        </>
    );
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Fix for SVG className.split() error
              // SVG elements have className as SVGAnimatedString, not a plain string
              (function() {
                if (typeof window === 'undefined' || typeof document === 'undefined') return;
                
                // Helper function to normalize className for any element
                function normalizeClassName(element) {
                  if (!element || !element.className) return;
                  
                  try {
                    // Check if className is SVGAnimatedString (has baseVal property)
                    if (typeof element.className === 'object' && 'baseVal' in element.className) {
                      // Create a normalized string version
                      const normalizedValue = element.className.baseVal || '';
                      // Override the className property to return a string
                      Object.defineProperty(element, 'className', {
                        value: normalizedValue,
                        writable: true,
                        configurable: true,
                        enumerable: true
                      });
                    } else if (typeof element.className !== 'string' && element.className !== null) {
                      // Ensure it's always a string
                      element.className = String(element.className || '');
                    }
                  } catch (e) {
                    // Ignore errors in normalization
                  }
                }
                
                // Use capture phase to normalize className before any other listeners
                // Also check currentTarget in case event bubbles
                document.addEventListener('click', function(event) {
                  if (event.target) {
                    normalizeClassName(event.target);
                  }
                  // Also normalize if event has currentTarget
                  if (event.currentTarget && event.currentTarget !== event.target) {
                    normalizeClassName(event.currentTarget);
                  }
                }, true); // Use capture phase (true) to run before other listeners
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <SessionProvider>
          <SupabaseDataProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </SupabaseDataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
