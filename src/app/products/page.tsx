
'use client';

import React from 'react';
import type { Metadata } from 'next';
import { AppHeader } from '@/components/bouzid-store/app-header';
import { ProductsTable } from '@/components/bouzid-store/products-table';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package } from 'lucide-react';

// It's good practice to export metadata from page components
// export const metadata: Metadata = {
//   title: 'قائمة المنتجات - متجر بوزيد',
//   description: 'عرض وإدارة قائمة المنتجات في مخزون متجر بوزيد.',
// };
// However, for client components, you'd typically set this in a parent layout or use a different mechanism if needed dynamically.
// For simplicity, we'll rely on the root layout's title for now or you can use `useEffect` to set document.title.


export default function ProductsListPage() {
  const { products, isLoaded } = useProductsStorage();

  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار التحميل...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow p-4 md:p-8">
        <Card className="shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="bg-card border-b">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">قائمة المنتجات</CardTitle>
            </div>
            <CardDescription>عرض جميع المنتجات الموجودة في المخزون وتفاصيلها.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* If p-0 on CardContent, ensure ProductsTable handles its own padding or the table looks good edge-to-edge */}
            <ProductsTable products={products} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
