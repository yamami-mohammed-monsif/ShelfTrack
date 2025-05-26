
'use client';

import React from 'react';
import { SalesTable } from '@/components/bouzid-store/sales-table';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function SalesRecordPage() {
  const { sales, isSalesLoaded } = useSalesStorage();
  const { isLoaded: productsLoaded } = useProductsStorage();

  if (!isSalesLoaded || !productsLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار تحميل سجل المبيعات...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow p-4 md:p-8">
        <Card className="shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="bg-card border-b">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ClipboardList className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">سجل المبيعات</CardTitle>
            </div>
            <CardDescription>عرض جميع عمليات البيع المسجلة وتفاصيل المنتجات المباعة.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-4">
            <SalesTable
              sales={sales}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
