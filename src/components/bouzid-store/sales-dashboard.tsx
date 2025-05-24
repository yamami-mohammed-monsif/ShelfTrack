
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, TooltipProps, LegendProps } from 'recharts';
import type { SalesTimeframe, SalesDataPoint, Product, Sale } from '@/lib/types';
import { DollarSign, TrendingUp, CalendarDays, Package, ShoppingCart, TrendingDown, List } from 'lucide-react';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import {
  format,
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter,
  startOfYear, endOfYear,
  subDays, subWeeks, subMonths, subQuarters, subYears,
  isWithinInterval,
  eachDayOfInterval,
  addDays,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInCalendarQuarters,
  differenceInCalendarYears,
  parseISO,
} from 'date-fns';
import { arSA } from 'date-fns/locale';

interface SalesDashboardProps {
  products: Product[];
}

const chartConfig = {
  revenue: {
    label: "الإيرادات",
    color: "hsl(var(--chart-2))", // Muted Sage (originally profit)
  },
  costs: {
    label: "التكاليف (مبدئيًا)", // Placeholder for costs
    color: "hsl(var(--destructive))", // Destructive (Red) (originally loss)
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
          profit: totalRevenue, // 'profit' field used for revenue
          loss: 0, // 'loss' field used for costs, 0 for now
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
            {label: `النصف الثاني ${format(previousHalfStart, 'yyyy', { locale })}`, start: previousHalfStart, end: endOfMonth(addDays(subMonths(previousHalfStart,1),5*30+29)) }, // Approx
            {label: `النصف الأول ${format(currentHalfStart, 'yyyy', { locale })}`, start: currentHalfStart, end: endOfMonth(addDays(subMonths(currentHalfStart,1),5*30+29)) } // Approx
        ];
        if (now.getMonth() >=6 ) {
             periods[0].label = `النصف الأول ${format(currentHalfStart, 'yyyy', { locale })}`;
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

  const totalProducts = products.length;
  const totalStockQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

  const monthlyStats = useMemo(() => {
    if (!isSalesLoaded) return { currentMonthRevenue: 0, currentMonthSalesCount: 0, prevMonthRevenue: 0, prevMonthSalesCount: 0 };

    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(prevMonthStart);

    const currentMonthSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: currentMonthStart, end: currentMonthEnd }));
    const prevMonthSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: prevMonthStart, end: prevMonthEnd }));

    return {
      currentMonthRevenue: currentMonthSales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
      currentMonthSalesCount: currentMonthSales.length,
      prevMonthRevenue: prevMonthSales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
      prevMonthSalesCount: prevMonthSales.length,
    };
  }, [sales, isSalesLoaded, now]);
  
  const dataForTimeframe = useMemo(() => {
    if (!isSalesLoaded) return [];
    return calculateAggregatedSales(sales, currentTimeframe, now);
  }, [sales, currentTimeframe, isSalesLoaded, now]);

  const getPercentageChange = (current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? '+∞%' : 'N/A'; // Or handle as new
    }
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
  };
  
  const revenueChangeText = getPercentageChange(monthlyStats.currentMonthRevenue, monthlyStats.prevMonthRevenue);
  const salesCountChangeText = getPercentageChange(monthlyStats.currentMonthSalesCount, monthlyStats.prevMonthSalesCount);


  if (!isSalesLoaded || !products) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <p className="text-foreground text-xl">جار تحميل لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات (هذا الشهر)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.currentMonthRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ج</div>
            <p className="text-xs text-muted-foreground">
              {revenueChangeText !== 'N/A' && revenueChangeText !== '+∞%' ? `${revenueChangeText} عن الشهر الماضي` : (revenueChangeText === '+∞%' && monthlyStats.currentMonthRevenue > 0 ? 'إيرادات جديدة هذا الشهر' : 'لا توجد بيانات للمقارنة')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المبيعات (هذا الشهر)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.currentMonthSalesCount.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">
              {salesCountChangeText !== 'N/A' && salesCountChangeText !== '+∞%' ? `${salesCountChangeText} عن الشهر الماضي` : (salesCountChangeText === '+∞%' && monthlyStats.currentMonthSalesCount > 0 ? 'مبيعات جديدة هذا الشهر' : 'لا توجد بيانات للمقارنة')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد أنواع المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">إجمالي الأنواع المتوفرة في المخزون</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الكمية الإجمالية بالمخزون</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">إجمالي الوحدات من كل المنتجات</p>
          </CardContent>
        </Card>
      </div>

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

