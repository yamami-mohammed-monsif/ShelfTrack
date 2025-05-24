
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, Archive, Menu, ClipboardList, Bell, CheckCircle } from 'lucide-react';
import { useNotificationsStorage } from '@/hooks/use-notifications-storage';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { unreadCount, unreadNotifications, markAllAsRead, isLoaded: notificationsLoaded } = useNotificationsStorage();

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" legacyBehavior passHref>
          <a className="text-2xl font-bold hover:opacity-90 transition-opacity">متجر بوزيد</a>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1 sm:gap-2">
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground px-2 sm:px-3 py-2">
              <Link href="/">
                <Home className="me-1 sm:me-2 h-5 w-5" />
                الرئيسية
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground px-2 sm:px-3 py-2">
              <Link href="/products">
                <Archive className="me-1 sm:me-2 h-5 w-5" />
                المخزون
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground px-2 sm:px-3 py-2">
              <Link href="/sales">
                <ClipboardList className="me-1 sm:me-2 h-5 w-5" />
                سجل المبيعات
              </Link>
            </Button>
          </nav>

          {/* Notifications Popover */}
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
              <PopoverContent className="w-80 p-0 bg-card text-card-foreground" align="end">
                <div className="p-4 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">الإشعارات</h3>
                    {unreadNotifications.length > 0 && (
                       <Button variant="link" size="sm" onClick={markAllAsRead} className="text-primary p-0 h-auto">
                         وضع علامة على الكل كمقروء
                       </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-[300px]">
                  {unreadNotifications.length === 0 ? (
                    <p className="text-muted-foreground text-center p-4">لا توجد إشعارات جديدة.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {unreadNotifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.href || '#'}
                          passHref
                          legacyBehavior={!notification.href}
                        >
                          <a className={cn(
                            "block p-3 hover:bg-muted/50",
                            !notification.href && "pointer-events-none" 
                          )}>
                            <p className={cn(
                                "text-sm font-medium",
                                !notification.read ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.message}
                            </p>
                            <p className={cn(
                                "text-xs",
                                !notification.read ? "text-primary" : "text-muted-foreground/80"
                            )}>
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: arSA })}
                            </p>
                          </a>
                        </Link>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                 {unreadNotifications.length > 0 && unreadNotifications.length < 5 && ( // Example condition
                    <div className="p-2 text-center border-t border-border">
                        <Link href="/notifications" passHref legacyBehavior>
                             <Button variant="link" size="sm" className="text-primary">عرض كل الإشعارات</Button>
                        </Link>
                    </div>
                 )}
              </PopoverContent>
            </Popover>
          )}


          {/* Mobile Navigation (Hamburger Menu) */}
          <div className="md:hidden">
            <Sheet>
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
                <div className="flex flex-col space-y-4">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
