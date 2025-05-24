
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
  startOfHour,
  endOfHour,
  eachHourOfInterval,
  subDays,
  subWeeks,
  subMonths,
  isWithinInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { arSA } from 'date-fns/locale';

type SalesAnalyticsTimeframe = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | 'yearly';

interface SalesAnalyticsChartDataPoint {
  dateLabel: string; // Formatted date for X-axis
  totalSales: number;
  tooltipLabel?: string; // For more detailed tooltip date/range
}

const timeframeLabels: Record<SalesAnalyticsTimeframe, string> = {
  daily: 'يومي (اليوم بالساعة)',
  weekly: 'أسبوعي (آخر 12 أسبوعًا)',
  monthly: 'شهري (آخر 12 شهرًا)',
  '3months': 'آخر 3 أشهر (أسبوعي)',
  '6months': 'آخر 6 أشهر (أسبوعي)',
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
      case 'daily': {
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
      case 'weekly':
      case '3months':
      case '6months': {
        let numWeeksBack = 11; // For 'weekly' (12 weeks total)
        if (activeTimeframe === '3months') numWeeksBack = Math.ceil((3 * 30.44) / 7) -1 ; // Approx 13 weeks
        if (activeTimeframe === '6months') numWeeksBack = Math.ceil((6 * 30.44) / 7) - 1; // Approx 26 weeks
        
        const startDate = startOfWeek(subWeeks(now, numWeeksBack), { locale: arSA });
        const endDate = endOfWeek(now, { locale: arSA });
        const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: arSA.options?.weekStartsOn });
        
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
      case 'monthly': {
        const startDate = startOfMonth(subMonths(now, 11));
        const endDate = endOfMonth(now);
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        aggregatedData = months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          const monthSales = sales.filter(s => isWithinInterval(new Date(s.saleTimestamp), { start: monthStart, end: monthEnd }));
          return {
            dateLabel: format(monthStart, 'MMM yyyy', { locale: arSA }),
            tooltipLabel: format(monthStart, 'MMMM yyyy', { locale: arSA }),
            totalSales: monthSales.reduce((sum, s) => sum + s.totalSaleAmount, 0),
          };
        });
        break;
      }
      case 'yearly': {
        const currentYearStart = startOfMonth(new Date(now.getFullYear(), 0, 1));
        // const currentYearEnd = endOfMonth(new Date(now.getFullYear(), 11, 31));
        const monthsThisYear = eachMonthOfInterval({ start: currentYearStart, end: now }); // Up to current month
         aggregatedData = monthsThisYear.map(monthStart => {
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
                        left: -10, // Adjust for Y-axis labels in RTL
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
                        width={80} // Give Y-axis more space for labels
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
                 {activeTimeframe === 'daily' && <p>لا توجد مبيعات مسجلة لهذا اليوم حتى الآن.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
