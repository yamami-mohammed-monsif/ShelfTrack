
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
  SidebarContent,
  SidebarRail
} from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/bouzid-store/app-header'; // Import AppHeader here
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
        <AppHeader /> {/* AppHeader is now global and full-width */}
        <SidebarProvider defaultOpen={false}> {/* Sidebar is collapsed by default on desktop */}
          <div className="flex min-h-screen"> {/* This div is the main container for sidebar + content area */}
            {/* Desktop Sidebar: Shown only on md and larger, on the right */}
            <Sidebar
              side="right"
              collapsible="icon"
              className="hidden md:flex flex-col border-l bg-sidebar text-sidebar-foreground"
            >
              <SidebarRail /> {/* Allows clicking the edge to toggle expand/collapse */}
              {/* SidebarContent already has pt-16, accounting for the AppHeader's height */}
              <SidebarContent className="flex-grow p-2 pt-16 overflow-y-auto">
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
            {/* It needs top padding to account for the globally rendered AppHeader */}
            <SidebarInset className="flex-1 flex flex-col overflow-x-hidden pt-16"> {/* Added pt-16 */}
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
