'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, TooltipProps, LegendProps } from 'recharts';
import type { SalesTimeframe, SalesDataPoint, Product } from '@/lib/types';
import { DollarSign, TrendingUp, TrendingDown, CalendarDays, Package } from 'lucide-react';

interface SalesDashboardProps {
  products: Product[]; // For potential future use in calculations
}

const mockSalesData: Record<SalesTimeframe, SalesDataPoint[]> = {
  daily: [
    { date: 'اليوم', profit: 150, loss: 20 },
    { date: 'أمس', profit: 120, loss: 10 },
    { date: 'أول أمس', profit: 180, loss: 30 },
  ],
  weekly: [
    { date: 'الأسبوع الحالي', profit: 800, loss: 100 },
    { date: 'الأسبوع الماضي', profit: 750, loss: 80 },
    { date: 'قبل أسبوعين', profit: 900, loss: 120 },
  ],
  monthly: [
    { date: 'هذا الشهر', profit: 3000, loss: 400 },
    { date: 'الشهر الماضي', profit: 2800, loss: 350 },
    { date: 'قبل شهرين', profit: 3200, loss: 450 },
  ],
  quarterly: [
    { date: 'الربع الحالي', profit: 9000, loss: 1200 },
    { date: 'الربع الماضي', profit: 8500, loss: 1100 },
  ],
  half_yearly: [
    { date: 'النصف الأول من السنة', profit: 18000, loss: 2500 },
    { date: 'النصف الثاني من السنة الماضية', profit: 17000, loss: 2300 },
  ],
  yearly: [
    { date: 'هذه السنة', profit: 35000, loss: 5000 },
    { date: 'السنة الماضية', profit: 32000, loss: 4800 },
  ],
};

const chartConfig = {
  profit: {
    label: "الأرباح",
    color: "hsl(var(--chart-2))", // Muted Sage
  },
  loss: {
    label: "الخسائر",
    color: "hsl(var(--destructive))", // Destructive (Red)
  },
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              الفترة
            </span>
            <span className="font-bold text-muted-foreground">{label}</span>
          </div>
          {payload.map((item) => (
            <div className="flex flex-col" key={item.name}>
              <span
                className="text-[0.70rem] uppercase"
                style={{ color: item.color }}
              >
                {item.name === 'profit' ? 'الأرباح' : 'الخسائر'}
              </span>
              <span className="font-bold" style={{ color: item.color }}>
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
          <span className="text-xs text-muted-foreground">{entry.value === 'profit' ? 'الأرباح' : 'الخسائر'}</span>
        </div>
      ))}
    </div>
  );
};


export function SalesDashboard({ products }: SalesDashboardProps) {
  const [currentTimeframe, setCurrentTimeframe] = useState<SalesTimeframe>('daily');

  const dataForTimeframe = useMemo(() => {
    return mockSalesData[currentTimeframe];
  }, [currentTimeframe]);

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح (الشهر)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,000.00 د.ج</div>
            <p className="text-xs text-muted-foreground">+15% عن الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخسائر (الشهر)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">400.00 د.ج</div>
            <p className="text-xs text-muted-foreground">-5% عن الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">إجمالي {totalQuantity} وحدة في المخزون</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح (الشهر)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,600.00 د.ج</div>
            <p className="text-xs text-muted-foreground">الأرباح مطروحاً منها الخسائر</p>
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

        {Object.keys(mockSalesData).map((tf) => (
          <TabsContent key={tf} value={tf}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="me-2 h-5 w-5 text-primary" />
                  تحليل المبيعات - {
                    tf === 'daily' ? 'يومي' :
                    tf === 'weekly' ? 'أسبوعي' :
                    tf === 'monthly' ? 'شهري' :
                    tf === 'quarterly' ? 'كل ٣ أشهر' :
                    tf === 'half_yearly' ? 'كل ٦ أشهر' : 'سنوي'
                  }
                </CardTitle>
                <CardDescription>
                  عرض الأرباح والخسائر للفترة المحددة.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                          tickFormatter={(value) => value.length > 10 ? `${value.substring(0,10)}...` : value}
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
                        <Bar dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} name="الأرباح" />
                        <Bar dataKey="loss" fill="var(--color-loss)" radius={[4, 4, 0, 0]} name="الخسائر" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">جدول البيانات</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">الفترة</TableHead>
                        <TableHead className="text-center">الأرباح (د.ج)</TableHead>
                        <TableHead className="text-center">الخسائر (د.ج)</TableHead>
                        <TableHead className="text-center">صافي الربح (د.ج)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataForTimeframe.map((item) => (
                        <TableRow key={item.date}>
                          <TableCell className="font-medium">{item.date}</TableCell>
                          <TableCell className="text-center text-green-600">{item.profit.toLocaleString()}</TableCell>
                          <TableCell className="text-center text-red-600">{item.loss.toLocaleString()}</TableCell>
                          <TableCell className="text-center">{(item.profit - item.loss).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
