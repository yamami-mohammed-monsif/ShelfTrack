
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Menu, Bell, RotateCcw, Home, Archive, ClipboardList, LineChart as LineChartIcon, Download, History } from 'lucide-react';
import { useNotificationsStorage } from '@/hooks/use-notifications-storage';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useBackupLogStorage } from '@/hooks/use-backup-log-storage';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, startOfWeek, endOfWeek, format as formatDateFns } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Notification, Product, Sale } from '@/lib/types';

export function AppHeader() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoaded: notificationsLoaded, clearAllNotifications: clearAllNotificationData } = useNotificationsStorage();
  const { products, clearAllProducts } = useProductsStorage();
  const { sales, clearAllSales } = useSalesStorage();
  const { addLogEntry: addBackupLogEntry, clearAllBackupLogs } = useBackupLogStorage();
  const { toast } = useToast();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleResetAllData = () => {
    clearAllProducts();
    clearAllSales();
    clearAllNotificationData();
    clearAllBackupLogs(); // Also clear backup logs
    toast({
      title: "نجاح",
      description: "تمت إعادة تعيين جميع بيانات التطبيق بنجاح.",
      variant: "default",
    });
    setIsResetDialogOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleDownloadData = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: arSA, weekStartsOn: 6 }); // Saturday
    const weekEnd = endOfWeek(now, { locale: arSA, weekStartsOn: 6 }); // Friday

    const formattedStartDate = formatDateFns(weekStart, 'yyyy-MM-dd');
    const formattedEndDate = formatDateFns(weekEnd, 'yyyy-MM-dd');
    const fileName = `data-backup_${formattedStartDate}_to_${formattedEndDate}.json`;

    const dataToBackup = {
      metadata: {
        downloadedAt: now.toISOString(),
        periodStart: weekStart.toISOString(),
        periodEnd: weekEnd.toISOString(),
        fileName: fileName,
      },
      products: products,
      sales: sales,
      notifications: notifications,
    };

    const jsonString = JSON.stringify(dataToBackup, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addBackupLogEntry({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      periodStart: weekStart.getTime(),
      periodEnd: weekEnd.getTime(),
      fileName: fileName,
    });

    toast({
      title: "نجاح",
      description: `تم تصدير البيانات بنجاح إلى الملف: ${fileName}`,
      variant: "default",
    });
    setIsMobileMenuOpen(false); // Close mobile menu if export was triggered from there
  };


  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" legacyBehavior passHref>
          <a className="text-2xl font-bold hover:opacity-90 transition-opacity">ShelfTrack</a>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop Actions */}
          <div className="hidden md:flex gap-1 sm:gap-2 items-center">
            {notificationsLoaded && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                    <span className="sr-only">فتح الإشعارات</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[calc(100vw-2rem)] md:w-96 p-0 bg-card text-card-foreground" 
                  align="end"
                >
                  <div className="p-4 border-b border-border">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">الإشعارات</h3>
                      {notifications.length > 0 && unreadCount > 0 && (
                         <Button variant="link" size="sm" onClick={markAllAsRead} className="text-primary p-0 h-auto">
                           تحديد الكل كمقروء
                         </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                      <p className="text-muted-foreground text-center p-4">لا توجد إشعارات.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notification: Notification) => (
                          <Link
                            key={notification.id}
                            href={notification.href || '#'}
                            onClick={(e) => {
                              if (!notification.href) e.preventDefault();
                              handleNotificationClick(notification.id);
                            }}
                            className={cn(
                              "block p-3 hover:bg-muted/50",
                              !notification.read && "bg-primary/10", 
                              !notification.href && "cursor-default" 
                            )}
                          >
                            <p className={cn(
                                "text-sm",
                                !notification.read ? "font-semibold text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.message}
                            </p>
                            <p className={cn(
                                "text-xs",
                                !notification.read ? "text-primary" : "text-muted-foreground/80"
                            )}>
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: arSA })}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                   {notifications.length > 0 && (
                    <div className="p-2 text-center border-t border-border">
                        <Button variant="link" size="sm" asChild className="text-primary">
                            <Link href="#">عرض كل الإشعارات</Link> 
                        </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Export Data button removed from here for desktop view */}
            {/* <Button 
                variant="ghost" 
                onClick={handleDownloadData} 
                className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground px-2 sm:px-3 py-2"
                aria-label="تصدير البيانات"
              >
                <Download className="me-1 sm:me-2 h-5 w-5" />
                تصدير البيانات
            </Button> */}

            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-primary-foreground hover:bg-red-500/90 hover:text-white px-2 sm:px-3 py-2">
                  <RotateCcw className="me-1 sm:me-2 h-5 w-5" />
                  إعادة تعيين
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد إعادة التعيين</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد أنك تريد إعادة تعيين جميع بيانات التطبيق؟ سيتم حذف جميع المنتجات والمبيعات والإشعارات وسجل النسخ بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsResetDialogOpen(false)}>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAllData} className={cn(buttonVariants({variant: "destructive"}))}>
                    تأكيد وإعادة التعيين
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Mobile Navigation (Hamburger Menu) */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">فتح القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-card text-card-foreground p-6">
                <SheetHeader className="mb-6 text-start">
                  <SheetTitle className="text-xl">القائمة</SheetTitle>
                  <SheetDescription>
                    تصفح أقسام التطبيق المختلفة من هنا.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col space-y-2">
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="justify-start text-lg text-foreground hover:bg-accent hover:text-accent-foreground w-full">
                      <Link href="/">
                        <Home className="me-3 h-5 w-5" />
                        الرئيسية
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="justify-start text-lg text-foreground hover:bg-accent hover:text-accent-foreground w-full">
                      <Link href="/products">
                        <Archive className="me-3 h-5 w-5" />
                        المخزون
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="justify-start text-lg text-foreground hover:bg-accent hover:text-accent-foreground w-full">
                      <Link href="/sales">
                        <ClipboardList className="me-3 h-5 w-5" />
                        سجل المبيعات
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="justify-start text-lg text-foreground hover:bg-accent hover:text-accent-foreground w-full">
                      <Link href="/analytics">
                        <LineChartIcon className="me-3 h-5 w-5" />
                        تحليلات المبيعات
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="justify-start text-lg text-foreground hover:bg-accent hover:text-accent-foreground w-full">
                      <Link href="/backup-log">
                        <History className="me-3 h-5 w-5" />
                        سجل النسخ
                      </Link>
                    </Button>
                  </SheetClose>

                  <div className="pt-4 mt-4 border-t border-border">
                      <Button 
                        variant="ghost" 
                        onClick={handleDownloadData} // Export Data button in mobile menu
                        className="justify-start text-lg text-foreground hover:bg-accent hover:text-accent-foreground w-full"
                      >
                        <Download className="me-3 h-5 w-5" />
                        تصدير البيانات
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsResetDialogOpen(true);
                        }} 
                        className="justify-start text-lg text-destructive hover:bg-destructive/10 hover:text-destructive w-full"
                      >
                        <RotateCcw className="me-3 h-5 w-5" />
                        إعادة تعيين
                      </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
