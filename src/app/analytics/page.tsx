
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useProductsStorage } from '@/hooks/use-products-storage';
import type { Sale, Product, SaleItem, ProductType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Filter, LineChart as LineChartIcon, CalendarDays, Star } from 'lucide-react';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfHour,
  endOfHour,
  eachHourOfInterval,
  subDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  min,
} from 'date-fns';
import { arSA } from 'date-fns/locale';
import { unitSuffix } from '@/lib/product-utils';

type SalesAnalyticsTimeframe = 'daily' | 'weekly' | 'monthly' | 'last3months' | 'last6months' | 'yearly';

interface SalesAnalyticsChartDataPoint {
  dateLabel: string;
  totalSales: number; 
  tooltipLabel?: string;
}

interface TopPerformingProduct {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  unit: string;
  totalProfit: number;
  productType?: ProductType; 
}

const timeframeLabels: Record<SalesAnalyticsTimeframe, string> = {
  daily: 'يومي (اليوم بالساعة)',
  weekly: 'أسبوعي (آخر 7 أيام)',
  monthly: 'شهري (هذا الشهر)',
  last3months: 'آخر 3 أشهر (أسبوعي)',
  last6months: 'آخر 6 أشهر (أسبوعي)',
  yearly: 'هذه السنة (شهري)',
};

const CustomSalesAnalyticsTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SalesAnalyticsChartDataPoint;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-right">
        <p className="text-sm text-muted-foreground">{data.tooltipLabel || data.dateLabel}</p>
        <p className="font-semibold" style={{ color: payload[0].color }}>
          إجمالي المبيعات: {payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
        </p>
      </div>
    );
  }
  return null;
};


export default function SalesAnalyticsPage() {
  const { sales: salesTransactions, isSalesLoaded } = useSalesStorage();
  const { products, isLoaded: isProductsLoaded } = useProductsStorage();
  const [activeTimeframe, setActiveTimeframe] = useState<SalesAnalyticsTimeframe>('monthly');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  const salesTimeInterval = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeTimeframe) {
      case 'daily':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'weekly':
        start = startOfDay(subDays(now, 6)); // Last 7 days including today
        end = endOfDay(now);
        break;
      case 'monthly':
        start = startOfMonth(now);
        end = min([endOfDay(now), endOfMonth(now)]); // Current calendar month, up to today
        break;
      case 'last3months':
        start = startOfDay(subDays(now, 89)); // Last 90 days
        end = endOfDay(now);
        break;
      case 'last6months':
        start = startOfDay(subDays(now, 179)); // Last 180 days
        end = endOfDay(now);
        break;
      case 'yearly':
        start = startOfYear(now);
        end = min([endOfDay(now), endOfYear(now)]); // Current calendar year, up to today
        break;
      default:
        start = now;
        end = now;
    }
    return { start, end };
  }, [activeTimeframe]);

  const chartData = useMemo(() => {
    if (!isSalesLoaded || salesTransactions.length === 0) return [];

    let aggregatedData: SalesAnalyticsChartDataPoint[] = [];
    const { start: intervalStart, end: intervalEnd } = salesTimeInterval;

    const relevantTransactions = salesTransactions.filter(t => 
        t.sale_timestamp >= intervalStart.getTime() && t.sale_timestamp <= intervalEnd.getTime()
    );

    switch (activeTimeframe) {
      case 'daily': {
        const hoursToday = eachHourOfInterval({ start: intervalStart, end: intervalEnd });
        aggregatedData = hoursToday.map(hour => {
          const hourStart = startOfHour(hour);
          const hourEnd = endOfHour(hour);
          const hourTransactions = relevantTransactions.filter(t => 
            t.sale_timestamp >= hourStart.getTime() && t.sale_timestamp <= hourEnd.getTime()
          );
          return {
            dateLabel: format(hour, 'HH:00', { locale: arSA }),
            tooltipLabel: `الساعة: ${format(hour, 'HH:00', { locale: arSA })} - ${format(hourEnd, 'HH:59', { locale: arSA })}`,
            totalSales: hourTransactions.reduce((sum, t) => sum + t.total_transaction_amount, 0),
          };
        });
        break;
      }
      case 'weekly': {
        const days = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
        aggregatedData = days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayTransactions = relevantTransactions.filter(t => 
            t.sale_timestamp >= dayStart.getTime() && t.sale_timestamp <= dayEnd.getTime()
          );
          return {
            dateLabel: format(day, 'EEE d', { locale: arSA }),
            tooltipLabel: format(day, 'MMMM d, yyyy', { locale: arSA }),
            totalSales: dayTransactions.reduce((sum, t) => sum + t.total_transaction_amount, 0),
          };
        });
        break;
      }
      case 'monthly': {
        const daysInMonth = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
        aggregatedData = daysInMonth.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayTransactions = relevantTransactions.filter(t => 
            t.sale_timestamp >= dayStart.getTime() && t.sale_timestamp <= dayEnd.getTime()
          );
          return {
            dateLabel: format(day, 'd', { locale: arSA }),
            tooltipLabel: format(day, 'MMMM d, yyyy', { locale: arSA }),
            totalSales: dayTransactions.reduce((sum, t) => sum + t.total_transaction_amount, 0),
          };
        });
        break;
      }
      case 'last3months':
      case 'last6months': {
        const firstWeekStart = startOfWeek(intervalStart, { locale: arSA, weekStartsOn: 6 }); // Assuming week starts on Saturday for arSA
        const lastWeekEnd = endOfWeek(intervalEnd, { locale: arSA, weekStartsOn: 6 });
        const weeks = eachWeekOfInterval({ start: firstWeekStart, end: lastWeekEnd }, { weekStartsOn: arSA.options?.weekStartsOn || 6 });
        aggregatedData = weeks.map(weekStart => {
          const weekEndVal = endOfWeek(weekStart, { locale: arSA, weekStartsOn: 6 });
          const weekTransactions = relevantTransactions.filter(t => 
            t.sale_timestamp >= weekStart.getTime() && t.sale_timestamp <= weekEndVal.getTime()
          );
          return {
            dateLabel: format(weekStart, 'MMM d', { locale: arSA }),
            tooltipLabel: `أسبوع ${format(weekStart, 'MMM d', { locale: arSA })} - ${format(weekEndVal, 'MMM d, yyyy', { locale: arSA })}`,
            totalSales: weekTransactions.reduce((sum, t) => sum + t.total_transaction_amount, 0),
          };
        });
        break;
      }
      case 'yearly': {
        const monthsInYear = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });
        aggregatedData = monthsInYear.map(monthStart => {
          const monthEndPeriod = endOfMonth(monthStart);
          const actualMonthEnd = min([intervalEnd, monthEndPeriod]);
          const monthTransactions = relevantTransactions.filter(t => 
            t.sale_timestamp >= monthStart.getTime() && t.sale_timestamp <= actualMonthEnd.getTime()
          );
          return {
            dateLabel: format(monthStart, 'MMM', { locale: arSA }),
            tooltipLabel: format(monthStart, 'MMMM yyyy', { locale: arSA }),
            totalSales: monthTransactions.reduce((sum, t) => sum + t.total_transaction_amount, 0),
          };
        });
        break;
      }
    }
    return aggregatedData;
  }, [salesTransactions, isSalesLoaded, activeTimeframe, salesTimeInterval]);

  const topPerformingProductsData = useMemo((): TopPerformingProduct[] => {
    if (!isSalesLoaded || !isProductsLoaded || salesTransactions.length === 0 || products.length === 0) return [];

    const { start: intervalStart, end: intervalEnd } = salesTimeInterval;

    const productPerformance: Record<string, {
      productId: string;
      productName: string;
      productType?: ProductType;
      totalQuantitySold: number;
      totalProfit: number;
    }> = {};

    salesTransactions.forEach(transaction => {
      if (transaction.sale_timestamp >= intervalStart.getTime() && transaction.sale_timestamp <= intervalEnd.getTime()) {
        (transaction.items || []).forEach(item => {
          if (!productPerformance[item.product_id]) {
            const productDetails = products.find(p => p.id === item.product_id);
            productPerformance[item.product_id] = {
              productId: item.product_id,
              productName: productDetails?.name || item.productNameSnapshot,
              productType: item.productType || productDetails?.type, // Prioritize item's snapshot type
              totalQuantitySold: 0,
              totalProfit: 0,
            };
          }
          productPerformance[item.product_id].totalQuantitySold += item.quantitySold;
          const profitPerSaleItem = (item.retailPricePerUnitSnapshot - (item.wholesalePricePerUnitSnapshot || 0)) * item.quantitySold;
          productPerformance[item.product_id].totalProfit += isNaN(profitPerSaleItem) ? 0 : profitPerSaleItem;
        });
      }
    });

    return Object.values(productPerformance)
      .map(p => ({
        ...p,
        unit: p.productType ? unitSuffix[p.productType] : '',
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);

  }, [salesTransactions, products, activeTimeframe, isSalesLoaded, isProductsLoaded, salesTimeInterval]);


  const chartConfig = {
    totalSales: {
      label: 'إجمالي المبيعات (د.ج)',
      color: 'hsl(var(--chart-1))',
    },
  };

  if (!hasMounted || !isSalesLoaded || !isProductsLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار تحميل تحليلات المبيعات...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow p-4 md:p-8 space-y-6">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <LineChartIcon className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">تحليلات المبيعات</CardTitle>
            </div>
            <CardDescription>عرض المبيعات الإجمالية عبر فترات زمنية مختلفة.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6 pb-4 border-b flex-wrap">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">تصفية حسب:</span>
              {(Object.keys(timeframeLabels) as SalesAnalyticsTimeframe[]).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={activeTimeframe === timeframe ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTimeframe(timeframe)}
                  className="px-3 py-1 h-auto m-1"
                >
                  {timeframeLabels[timeframe]}
                </Button>
              ))}
            </div>

            {chartData.length > 0 && chartData.some(d => d.totalSales > 0) ? (
              <div className="h-[400px] w-full">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 20,
                        left: -10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={['auto', 'auto']}
                        allowDecimals={true}
                        width={80}
                      />
                      <Tooltip
                        content={<CustomSalesAnalyticsTooltip />}
                        cursor={{ strokeDasharray: '3 3' }}
                      />
                      <Legend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="totalSales"
                        stroke="var(--color-totalSales)"
                        strokeWidth={2}
                        dot={{
                          fill: "var(--color-totalSales)",
                          r: 4,
                          strokeWidth: 2,
                          stroke: "hsl(var(--background))"
                        }}
                        activeDot={{
                           r: 6,
                           fill: "var(--color-totalSales)",
                           stroke: "hsl(var(--background))",
                           strokeWidth: 2,
                        }}
                        name="إجمالي المبيعات"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                <p>لا توجد بيانات مبيعات لعرضها لهذه الفترة الزمنية.</p>
                 {activeTimeframe === 'daily' && salesTransactions.filter(t => t.sale_timestamp >= startOfDay(new Date()).getTime() && t.sale_timestamp <= endOfDay(new Date()).getTime()).length === 0 && <p>لا توجد مبيعات مسجلة لهذا اليوم حتى الآن.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Star className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">أفضل 10 منتجات أداءً</CardTitle>
                </div>
                <CardDescription>
                    المنتجات الأكثر ربحية خلال الفترة الزمنية المحددة: {timeframeLabels[activeTimeframe]}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-4">
                {topPerformingProductsData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableCaption className="py-4">
                                يتم ترتيب المنتجات حسب إجمالي الربح المحقق.
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="rtl:text-right">المنتج</TableHead>
                                    <TableHead className="text-center">الكمية المباعة</TableHead>
                                    <TableHead className="text-center">الربح المحقق</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topPerformingProductsData.map((product) => (
                                    <TableRow key={product.productId}>
                                        <TableCell className="font-medium rtl:text-right">
                                            {product.productName}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {product.totalQuantitySold.toLocaleString()} {product.unit}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {product.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                        <p>لا توجد بيانات منتجات لعرضها لهذه الفترة الزمنية.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
