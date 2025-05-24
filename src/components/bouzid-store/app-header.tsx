
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Archive } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" legacyBehavior passHref>
          <a className="text-2xl font-bold hover:opacity-90 transition-opacity">متجر بوزيد</a>
        </Link>
        <nav className="flex gap-1 sm:gap-2">
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
        </nav>
      </div>
    </header>
  );
}
