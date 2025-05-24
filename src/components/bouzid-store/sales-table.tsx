
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import type { Sale } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface SalesTableProps {
  sales: Sale[];
}

export function SalesTable({ sales }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-10 px-4 text-muted-foreground">
        <p className="text-lg mb-2">لا توجد عمليات بيع مسجلة حالياً.</p>
        <p className="text-sm">يمكنك تسجيل عمليات بيع جديدة من الصفحة الرئيسية.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="py-4">سجل بجميع عمليات البيع المسجلة.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px] rtl:text-right">اسم المنتج</TableHead>
            <TableHead className="text-center">الكمية المباعة</TableHead>
            <TableHead className="text-center">سعر الوحدة (عند البيع)</TableHead>
            <TableHead className="text-center">المبلغ الإجمالي</TableHead>
            <TableHead className="text-left rtl:text-right min-w-[150px]">تاريخ البيع</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium rtl:text-right">{sale.productNameSnapshot}</TableCell>
              <TableCell className="text-center">{sale.quantitySold.toLocaleString()}</TableCell>
              <TableCell className="text-center">
                {sale.salePricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className="text-center font-semibold">
                {sale.totalSaleAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className="text-left rtl:text-right">
                {format(new Date(sale.saleTimestamp), 'PPpp', { locale: arSA })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
