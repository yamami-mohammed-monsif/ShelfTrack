
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SalesTable } from '@/components/bouzid-store/sales-table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, TooltipProps, LegendProps } from 'recharts';
import type { SalesTimeframe, SalesDataPoint, Product, Sale } from '@/lib/types';
import { DollarSign, TrendingUp, CalendarDays, Package, ShoppingCart, AlertTriangle, List, ArrowLeft } from 'lucide-react';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { isLowStock } from '@/lib/product-utils';
import {
  format,
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter,
  startOfYear, endOfYear,
  subDays, subWeeks, subMonths, subQuarters, subYears,
  isWithinInterval,
} from 'date-fns';
import { arSA } from 'date-fns/locale';

interface SalesDashboardProps {
  products: Product[];
}

const chartConfig = {
  revenue: {
    label: "الإيرادات",
    color: "hsl(var(--chart-2))",
  },
  costs: {
    label: "التكاليف (مبدئيًا)",
    color: "hsl(var(--destructive))",
  },
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-right">
        <div className="grid grid-cols-1 gap-1.5">
          <div className="font-semibold">{label}</div>
          {payload.map((item) => (
            <div className="flex items-center justify-between" key={item.name}>
              <div className="flex items-center">
                <span
                  className="w-2.5 h-2.5 rounded-full me-1.5"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-xs text-muted-foreground">
                  {item.name === 'revenue' ? chartConfig.revenue.label : chartConfig.costs.label}
                </span>
              </div>
              <span className="font-semibold">
                {item.value?.toLocaleString()} د.ج
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = (props: LegendProps) => {
  const { payload } = props;
  if (!payload) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center space-s-1">
          <span style={{ backgroundColor: entry.color }} className="h-2 w-2 rounded-full inline-block"></span>
          <span className="text-xs text-muted-foreground">
            {entry.value === 'revenue' ? chartConfig.revenue.label : chartConfig.costs.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const calculateAggregatedSales = (
  sales: Sale[],
  timeframe: SalesTimeframe,
  now: Date = new Date()
): SalesDataPoint[] => {
  const dataPoints: SalesDataPoint[] = [];
  const locale = arSA;

  switch (timeframe) {
    case 'daily': // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const targetDate = subDays(now, i);
        const dayStart = startOfDay(targetDate);
        const dayEnd = endOfDay(targetDate);
        const dailySales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: dayStart, end: dayEnd }));
        const totalRevenue = dailySales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
        dataPoints.push({
          date: format(targetDate, 'EEE d MMM', { locale }),
          profit: totalRevenue,
          loss: 0,
        });
      }
      break;
    case 'weekly': // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const targetWeekStart = startOfWeek(subWeeks(now, i), { locale });
        const targetWeekEnd = endOfWeek(subWeeks(now, i), { locale });
        const weeklySales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: targetWeekStart, end: targetWeekEnd }));
        const totalRevenue = weeklySales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
        dataPoints.push({
          date: `أسبوع ${format(targetWeekStart, 'd MMM', { locale })}`,
          profit: totalRevenue,
          loss: 0,
        });
      }
      break;
    case 'monthly': // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const targetMonthStart = startOfMonth(subMonths(now, i));
        const targetMonthEnd = endOfMonth(targetMonthStart);
        const monthlySales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: targetMonthStart, end: targetMonthEnd }));
        const totalRevenue = monthlySales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
        dataPoints.push({
          date: format(targetMonthStart, 'MMM yyyy', { locale }),
          profit: totalRevenue,
          loss: 0,
        });
      }
      break;
    case 'quarterly': // Last 4 quarters
      for (let i = 3; i >= 0; i--) {
        const targetQuarterStart = startOfQuarter(subQuarters(now, i));
        const targetQuarterEnd = endOfQuarter(targetQuarterStart);
        const quarterlySales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: targetQuarterStart, end: targetQuarterEnd }));
        const totalRevenue = quarterlySales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
        dataPoints.push({
          date: `الربع ${format(targetQuarterStart, 'Q yyyy', { locale })}`,
          profit: totalRevenue,
          loss: 0,
        });
      }
      break;
    case 'half_yearly': // Last 2 half-years (approx)
        const currentHalfStart = (now.getMonth() < 6) ? startOfYear(now) : startOfMonth(subMonths(now, now.getMonth() - 6));
        const previousHalfStart = subMonths(currentHalfStart, 6);

        const periods = [
            {label: `النصف الثاني ${format(previousHalfStart, 'yyyy', { locale })}`, start: previousHalfStart, end: endOfMonth(subMonths(currentHalfStart,1)) },
            {label: `النصف الأول ${format(currentHalfStart, 'yyyy', { locale })}`, start: currentHalfStart, end: endOfMonth(addMonths(currentHalfStart, 5)) }
        ];
        if (now.getMonth() >=6 ) {
             periods[0].label = `النصف الأول ${format(currentHalfStart, 'yyyy', { locale })}`;
             periods[0].start = startOfYear(now);
             periods[0].end = endOfMonth(addMonths(startOfYear(now),5));
             periods[1].label = `النصف الثاني ${format(currentHalfStart, 'yyyy', { locale })}`;
             periods[1].start = startOfMonth(addMonths(startOfYear(now),6));
             periods[1].end = endOfYear(now);
        }


        for (const period of periods) {
            const periodSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: period.start, end: period.end }));
            const totalRevenue = periodSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
            dataPoints.push({ date: period.label, profit: totalRevenue, loss: 0 });
        }
      break;
    case 'yearly': // Last 2 years
      for (let i = 1; i >= 0; i--) {
        const targetYearStart = startOfYear(subYears(now, i));
        const targetYearEnd = endOfYear(targetYearStart);
        const yearlySales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: targetYearStart, end: targetYearEnd }));
        const totalRevenue = yearlySales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
        dataPoints.push({
          date: format(targetYearStart, 'yyyy', { locale }),
          profit: totalRevenue,
          loss: 0,
        });
      }
      break;
    default:
      return [];
  }
  return dataPoints;
};


export function SalesDashboard({ products }: SalesDashboardProps) {
  const { sales, isSalesLoaded } = useSalesStorage();
  const [currentTimeframe, setCurrentTimeframe] = useState<SalesTimeframe>('daily');

  const now = useMemo(() => new Date(), []);

  const dailyAndWeeklyStats = useMemo(() => {
    if (!isSalesLoaded) return {
      todaySalesValue: 0, todayUnitsSold: 0,
      thisWeekSalesValue: 0, thisWeekUnitsSold: 0
    };

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { locale: arSA });
    const weekEnd = endOfWeek(now, { locale: arSA });

    const salesToday = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: todayStart, end: todayEnd }));
    const salesThisWeek = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: weekStart, end: weekEnd }));

    return {
      todaySalesValue: salesToday.reduce((sum, s) => sum + s.totalSaleAmount, 0),
      todayUnitsSold: salesToday.reduce((sum, s) => sum + s.quantitySold, 0),
      thisWeekSalesValue: salesThisWeek.reduce((sum, s) => sum + s.totalSaleAmount, 0),
      thisWeekUnitsSold: salesThisWeek.reduce((sum, s) => sum + s.quantitySold, 0),
    };
  }, [sales, isSalesLoaded, now]);

  const totalProductsInStock = products.length;
  const lowStockProductsCount = useMemo(() => products.filter(p => isLowStock(p)).length, [products]);

  const dataForTimeframe = useMemo(() => {
    if (!isSalesLoaded) return [];
    return calculateAggregatedSales(sales, currentTimeframe, now);
  }, [sales, currentTimeframe, isSalesLoaded, now]);

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
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyAndWeeklyStats.todaySalesValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ج</div>
            <p className="text-xs text-muted-foreground">إجمالي قيمة المبيعات لليوم الحالي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوحدات المباعة اليوم</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyAndWeeklyStats.todayUnitsSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">إجمالي عدد الوحدات المباعة اليوم</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات هذا الأسبوع</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyAndWeeklyStats.thisWeekSalesValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ج</div>
            <p className="text-xs text-muted-foreground">إجمالي قيمة المبيعات لهذا الأسبوع</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوحدات المباعة هذا الأسبوع</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyAndWeeklyStats.thisWeekUnitsSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">إجمالي عدد الوحدات المباعة هذا الأسبوع</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد أنواع المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductsInStock}</div>
            <p className="text-xs text-muted-foreground">إجمالي الأنواع المتوفرة في المخزون</p>
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

      <Tabs defaultValue="daily" className="w-full" onValueChange={(value) => setCurrentTimeframe(value as SalesTimeframe)}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6">
          <TabsTrigger value="daily">يومي</TabsTrigger>
          <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
          <TabsTrigger value="monthly">شهري</TabsTrigger>
          <TabsTrigger value="quarterly">٣ أشهر</TabsTrigger>
          <TabsTrigger value="half_yearly">٦ أشهر</TabsTrigger>
          <TabsTrigger value="yearly">سنوي</TabsTrigger>
        </TabsList>

        {(['daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'] as SalesTimeframe[]).map((tf) => (
          <TabsContent key={tf} value={tf}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="me-2 h-5 w-5 text-primary" />
                  تحليل المبيعات - {
                    tf === 'daily' ? 'يومي (آخر 7 أيام)' :
                    tf === 'weekly' ? 'أسبوعي (آخر 4 أسابيع)' :
                    tf === 'monthly' ? 'شهري (آخر 6 أشهر)' :
                    tf === 'quarterly' ? 'ربعي (آخر 4 أرباع)' :
                    tf === 'half_yearly' ? 'نصف سنوي (آخر نصفين)' : 'سنوي (آخر سنتين)'
                  }
                </CardTitle>
                <CardDescription>
                  عرض الإيرادات والتكاليف (مبدئيًا) للفترة المحددة.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {dataForTimeframe.length > 0 ? (
                <>
                  <div className="h-[300px] w-full">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataForTimeframe} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.length > 15 ? `${value.substring(0,15)}...` : value}
                          />
                          <YAxis
                            tickFormatter={(value) => `${value.toLocaleString()} د.ج`}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={80}
                          />
                          <ChartTooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                          <ChartLegend content={<CustomLegend />} />
                          <Bar dataKey="profit" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} name="revenue" />
                          <Bar dataKey="loss" fill="var(--color-costs)" radius={[4, 4, 0, 0]} name="costs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">جدول البيانات</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px] rtl:text-right">الفترة</TableHead>
                          <TableHead className="text-center">{chartConfig.revenue.label} (د.ج)</TableHead>
                          <TableHead className="text-center">{chartConfig.costs.label} (د.ج)</TableHead>
                          <TableHead className="text-center">صافي الدخل (د.ج)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataForTimeframe.map((item) => (
                          <TableRow key={item.date}>
                            <TableCell className="font-medium rtl:text-right">{item.date}</TableCell>
                            <TableCell className="text-center text-green-600">{item.profit.toLocaleString()}</TableCell>
                            <TableCell className="text-center text-red-600">{item.loss.toLocaleString()}</TableCell>
                            <TableCell className="text-center font-semibold">{(item.profit - item.loss).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                    <p>لا توجد بيانات مبيعات لعرضها لهذه الفترة.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
