
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SalesTable } from '@/components/bouzid-store/sales-table';
import type { Product, Sale } from '@/lib/types';
import { DollarSign, ShoppingCart, Package, AlertTriangle, List, ArrowLeft, TrendingUp } from 'lucide-react';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { isLowStock } from '@/lib/product-utils';
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek, // For weekly calculations
  isWithinInterval,
} from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SalesDashboardProps {
  products: Product[];
}

export function SalesDashboard({ products }: SalesDashboardProps) {
  const { sales, isSalesLoaded } = useSalesStorage();
  
  const now = useMemo(() => new Date(), []);

  const dailyStats = useMemo(() => {
    if (!isSalesLoaded) return {
      todaySalesValue: 0,
      todayProfit: 0,
    };

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    
    const salesToday = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: todayStart, end: todayEnd }));

    const todaySalesValue = salesToday.reduce((sum, s) => sum + s.totalSaleAmount, 0);
    const todayProfit = salesToday.reduce((sum, s) => {
      const profitPerSale = (s.retailPricePerUnitSnapshot - s.wholesalePricePerUnitSnapshot) * s.quantitySold;
      return sum + (Number.isNaN(profitPerSale) ? 0 : profitPerSale);
    }, 0);

    return {
      todaySalesValue,
      todayProfit,
    };
  }, [sales, isSalesLoaded, now]);

  const totalProductsInStock = products.length;
  const lowStockProductsCount = useMemo(() => products.filter(p => isLowStock(p)).length, [products]);

  const recentSales = useMemo(() => {
    if (!isSalesLoaded) return [];
    return sales.sort((a, b) => b.saleTimestamp - a.saleTimestamp).slice(0, 5);
  }, [sales, isSalesLoaded]);


  if (!isSalesLoaded || !products) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <p className="text-foreground text-xl">جار تحميل لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="grid gap-6 grid-cols-2 md:grid-cols-2"> 
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.todaySalesValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ج</div>
            <p className="text-xs text-muted-foreground">إجمالي قيمة المبيعات لليوم الحالي</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أرباح اليوم</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
                "text-2xl font-bold",
                dailyStats.todayProfit > 0 && "text-emerald-600",
                dailyStats.todayProfit < 0 && "text-destructive"
              )}
            >
              {dailyStats.todayProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ج
            </div>
            <p className="text-xs text-muted-foreground">إجمالي الأرباح المحققة اليوم</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductsInStock}</div>
            <p className="text-xs text-muted-foreground">إجمالي المنتجات المتوفرة في المخزون</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">منتجات منخفضة المخزون</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProductsCount}</div>
            <p className="text-xs text-muted-foreground">عدد المنتجات التي مخزونها منخفض</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <List className="me-2 h-5 w-5 text-primary" />
            أحدث عمليات البيع
          </CardTitle>
          <CardDescription>
            آخر 5 عمليات بيع تم تسجيلها.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-4">
          <SalesTable sales={recentSales} />
        </CardContent>
        <div className="p-4 pt-2 text-center">
          <Button asChild variant="link" className="text-primary">
            <Link href="/sales">
              عرض كل سجل المبيعات
              <ArrowLeft className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

