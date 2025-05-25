
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
import { Button } from '@/components/ui/button';
import type { Sale } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';

interface SalesTableProps {
  sales: Sale[];
  onEditSaleTrigger?: (sale: Sale) => void; // Optional: only if editing is enabled
  onDeleteSaleTrigger?: (sale: Sale) => void; // Optional: only if deletion is enabled
  showActions?: boolean; // To conditionally show the actions column
}

export function SalesTable({ sales, onEditSaleTrigger, onDeleteSaleTrigger, showActions = false }: SalesTableProps) {
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
            <TableHead className="text-center">سعر البيع (عند البيع)</TableHead>
            <TableHead className="text-center">المبلغ الإجمالي</TableHead>
            <TableHead className="text-left rtl:text-right min-w-[150px]">تاريخ البيع</TableHead>
            {showActions && <TableHead className="text-center">إجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium rtl:text-right">{sale.productNameSnapshot}</TableCell>
              <TableCell className="text-center">{sale.quantitySold.toLocaleString()}</TableCell>
              <TableCell className="text-center">
                {sale.retailPricePerUnitSnapshot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className="text-center font-semibold">
                {sale.totalSaleAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className="text-left rtl:text-right">
                {format(new Date(sale.saleTimestamp), 'PPpp', { locale: arSA })}
              </TableCell>
              {showActions && (
                <TableCell className="text-center space-x-2 rtl:space-x-reverse">
                  {onEditSaleTrigger && (
                    <Button variant="outline" size="icon" onClick={() => onEditSaleTrigger(sale)} aria-label="تعديل البيع">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteSaleTrigger && (
                    <Button variant="outline" size="icon" onClick={() => onDeleteSaleTrigger(sale)} aria-label="حذف البيع" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
