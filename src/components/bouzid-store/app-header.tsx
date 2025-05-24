
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Home, Archive, Menu, ClipboardList } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" legacyBehavior passHref>
          <a className="text-2xl font-bold hover:opacity-90 transition-opacity">متجر بوزيد</a>
        </Link>

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
    </header>
  );
}
