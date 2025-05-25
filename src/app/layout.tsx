import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { Home, Archive, ClipboardList, LineChart as LineChartIcon } from 'lucide-react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarHeader,
  SidebarContent,
  SidebarRail
} from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  title: 'ShelfTrack',
  description: 'تطبيق ShelfTrack لإدارة المنتجات وتحليل المبيعات',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <SidebarProvider defaultOpen={true}> {/* Sidebar is expanded by default on desktop */}
          <div className="flex min-h-screen">
            {/* Desktop Sidebar: Shown only on md and larger, on the right */}
            <Sidebar 
              side="right" 
              collapsible="icon" 
              className="hidden md:flex flex-col border-l bg-sidebar text-sidebar-foreground"
            >
              <SidebarRail /> {/* Allows clicking the edge to toggle expand/collapse */}
              <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border sticky top-0 bg-sidebar z-10 px-2">
                <Link href="/" className="flex items-center gap-2 group-data-[state=expanded]:w-full justify-center">
                    {/* Placeholder Icon for Sidebar Header when collapsed */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-sidebar-primary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    <span className="font-bold text-lg group-data-[state=collapsed]:hidden whitespace-nowrap">ShelfTrack</span>
                </Link>
              </SidebarHeader>

              <SidebarContent className="flex-grow p-2 overflow-y-auto">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Link href="/" legacyBehavior passHref>
                      <SidebarMenuButton tooltip={{ children: "الرئيسية", side: "left" }} aria-label="الرئيسية">
                        <Home />
                        <span>الرئيسية</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Link href="/products" legacyBehavior passHref>
                      <SidebarMenuButton tooltip={{ children: "المخزون", side: "left" }} aria-label="المخزون">
                        <Archive />
                        <span>المخزون</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Link href="/sales" legacyBehavior passHref>
                      <SidebarMenuButton tooltip={{ children: "سجل المبيعات", side: "left" }} aria-label="سجل المبيعات">
                        <ClipboardList />
                        <span>سجل المبيعات</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Link href="/analytics" legacyBehavior passHref>
                      <SidebarMenuButton tooltip={{ children: "تحليلات المبيعات", side: "left" }} aria-label="تحليلات المبيعات">
                        <LineChartIcon />
                        <span>تحليلات المبيعات</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>

            {/* Main content area that adjusts to the sidebar */}
            <SidebarInset className="flex-1 flex flex-col overflow-x-hidden">
              {/* AppHeader is rendered by individual page components (e.g. src/app/page.tsx) */}
              {/* and will be inside this SidebarInset. */}
              {/* AppHeader contains its own mobile menu trigger. */}
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
