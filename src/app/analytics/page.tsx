
'use client';

import React, { useState, useMemo } from 'react';
import { AppHeader } from '@/components/bouzid-store/app-header';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Filter, LineChart as LineChartIcon, CalendarDays } from 'lucide-react';
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  // endOfYear, // Not strictly needed if we go up to 'now' for current year/month
  startOfHour,
  endOfHour,
  eachHourOfInterval,
  subDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  min, // To ensure we don't plot future days for current month/year
} from 'date-fns';
import { arSA } from 'date-fns/locale';

type SalesAnalyticsTimeframe = 'daily' | 'weekly' | 'monthly' | 'last3months' | 'last6months' | 'yearly';

interface SalesAnalyticsChartDataPoint {
  dateLabel: string; // Formatted date for X-axis
  totalSales: number;
  tooltipLabel?: string; // For more detailed tooltip date/range
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
  const { sales, isSalesLoaded } = useSalesStorage();
  const [activeTimeframe, setActiveTimeframe] = useState<SalesAnalyticsTimeframe>('monthly');

  const chartData = useMemo(() => {
    if (!isSalesLoaded || sales.length === 0) return [];

    const now = new Date();
    let aggregatedData: SalesAnalyticsChartDataPoint[] = [];

    switch (activeTimeframe) {
      case 'daily': { // Today's sales, hour-by-hour
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const hoursToday = eachHourOfInterval({ start: todayStart, end: todayEnd });

        aggregatedData = hoursToday.map(hour => {
          const hourStart = startOfHour(hour);
          const hourEnd = endOfHour(hour);
          const hourSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: hourStart, end: hourEnd }));
          return {
            dateLabel: format(hour, 'HH:00', { locale: arSA }),
            tooltipLabel: `الساعة: ${format(hour, 'HH:00', { locale: arSA })} - ${format(hourEnd, 'HH:59', { locale: arSA })}`,
            totalSales: hourSales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
          };
        });
        break;
      }
      case 'weekly': { // Last 7 days (including today), day-by-day
        const startDate = startOfDay(subDays(now, 6));
        const endDate = endOfDay(now);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        aggregatedData = days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const daySales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: dayStart, end: dayEnd }));
          return {
            dateLabel: format(day, 'EEE d', { locale: arSA }), // e.g., الأحد 5
            tooltipLabel: format(day, 'MMMM d, yyyy', { locale: arSA }),
            totalSales: daySales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
          };
        });
        break;
      }
      case 'monthly': { // Current calendar month, day-by-day (up to today)
        const monthStart = startOfMonth(now);
        const monthActualEnd = min([now, endOfMonth(now)]); // Data up to today or end of month if past
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthActualEnd });
        
        aggregatedData = daysInMonth.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const daySales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: dayStart, end: dayEnd }));
          return {
            dateLabel: format(day, 'd', { locale: arSA }), // e.g., 15
            tooltipLabel: format(day, 'MMMM d, yyyy', { locale: arSA }),
            totalSales: daySales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
          };
        });
        break;
      }
      case 'last3months': { // Last 90 rolling days, week-by-week
        const startDateRough = subDays(now, 89);
        const firstWeekStart = startOfWeek(startDateRough, { locale: arSA });
        const lastWeekEnd = endOfWeek(now, { locale: arSA });
        
        const weeks = eachWeekOfInterval({ start: firstWeekStart, end: lastWeekEnd }, { weekStartsOn: arSA.options?.weekStartsOn });
        
        aggregatedData = weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { locale: arSA });
          const weekSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: weekStart, end: weekEnd }));
          return {
            dateLabel: format(weekStart, 'MMM d', { locale: arSA }),
            tooltipLabel: `أسبوع ${format(weekStart, 'MMM d', { locale: arSA })} - ${format(weekEnd, 'MMM d, yyyy', { locale: arSA })}`,
            totalSales: weekSales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
          };
        });
        break;
      }
      case 'last6months': { // Last 180 rolling days, week-by-week
        const startDateRough = subDays(now, 179);
        const firstWeekStart = startOfWeek(startDateRough, { locale: arSA });
        const lastWeekEnd = endOfWeek(now, { locale: arSA });

        const weeks = eachWeekOfInterval({ start: firstWeekStart, end: lastWeekEnd }, { weekStartsOn: arSA.options?.weekStartsOn });
        
        aggregatedData = weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { locale: arSA });
          const weekSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: weekStart, end: weekEnd }));
          return {
            dateLabel: format(weekStart, 'MMM d', { locale: arSA }),
            tooltipLabel: `أسبوع ${format(weekStart, 'MMM d', { locale: arSA })} - ${format(weekEnd, 'MMM d, yyyy', { locale: arSA })}`,
            totalSales: weekSales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
          };
        });
        break;
      }
      case 'yearly': { // Current calendar year, month-by-month (up to current month)
        const yearStart = startOfYear(now);
        const currentMonthEnd = endOfMonth(now); // Data up to end of current month
        const monthsInYear = eachMonthOfInterval({ start: yearStart, end: currentMonthEnd });
        
         aggregatedData = monthsInYear.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          const monthSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: monthStart, end: monthEnd }));
          return {
            dateLabel: format(monthStart, 'MMM', { locale: arSA }),
            tooltipLabel: format(monthStart, 'MMMM yyyy', { locale: arSA }),
            totalSales: monthSales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
          };
        });
        break;
      }
    }
    return aggregatedData;
  }, [sales, isSalesLoaded, activeTimeframe]);

  const chartConfig = {
    totalSales: {
      label: 'إجمالي المبيعات (د.ج)',
      color: 'hsl(var(--chart-1))',
    },
  };

  if (!isSalesLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار تحميل تحليلات المبيعات...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
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
                        allowDecimals={false}
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
                 {activeTimeframe === 'daily' && sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: startOfDay(new Date()), end: endOfDay(new Date()) })).length === 0 && <p>لا توجد مبيعات مسجلة لهذا اليوم حتى الآن.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

