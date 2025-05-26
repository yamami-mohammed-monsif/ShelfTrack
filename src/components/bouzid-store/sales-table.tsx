
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
// Edit/Delete buttons removed for now
// import { Button } from '@/components/ui/button';
import type { Sale, SaleItem } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
// import { Pencil, Trash2 } from 'lucide-react'; // Icons for edit/delete removed

interface SalesTableProps {
  sales: Sale[]; // Expects an array of Sale (transaction) objects
  // Edit/Delete triggers are removed as their logic needs rework for new data model
  // onEditSaleTrigger?: (sale: Sale, item: SaleItem) => void;
  // onDeleteSaleTrigger?: (sale: Sale, item: SaleItem) => void;
  showActions?: boolean; // Kept for future use, but actions are hidden now
  showCaption?: boolean;
}

// Helper type for flattened items with transaction timestamp
type DisplayableSaleItem = SaleItem & {
  transaction_timestamp: number;
  transaction_id: string;
};

export function SalesTable({
  sales,
  // onEditSaleTrigger,
  // onDeleteSaleTrigger,
  showActions = false, // Actions are effectively disabled for now
  showCaption = true,
}: SalesTableProps) {

  const allSaleItemsWithDetails = useMemo(() => {
    return sales.flatMap(transaction =>
      (transaction.items || []).map(item => ({
        ...item,
        transaction_timestamp: transaction.sale_timestamp,
        transaction_id: transaction.id,
      }))
    ).sort((a, b) => b.transaction_timestamp - a.transaction_timestamp);
  }, [sales]);

  if (allSaleItemsWithDetails.length === 0) {
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
        {showCaption && (
          <TableCaption className="py-4">
            سجل بجميعรายการ البيع المسجلة.
          </TableCaption>
        )}
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px] rtl:text-right">اسم المنتج</TableHead>
            <TableHead className="text-center">الكمية المباعة</TableHead>
            <TableHead className="text-center">سعر الوحدة (عند البيع)</TableHead>
            <TableHead className="text-center">المبلغ الإجمالي للمنتج</TableHead>
            <TableHead className="text-left rtl:text-right min-w-[150px]">تاريخ ووقت البيع</TableHead>
            {/* Actions column is hidden as edit/delete logic needs rework
            {showActions && <TableHead className="text-center">إجراءات</TableHead>}
            */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {allSaleItemsWithDetails.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium rtl:text-right">{item.productNameSnapshot}</TableCell>
              <TableCell className="text-center">{item.quantitySold.toLocaleString()}</TableCell>
              <TableCell className="text-center">
                {item.retailPricePerUnitSnapshot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className="text-center font-semibold">
                {item.itemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className="text-left rtl:text-right">
                {format(new Date(item.transaction_timestamp), 'PPpp', { locale: arSA })}
              </TableCell>
              {/* Actions are hidden for now
              {showActions && (
                <TableCell className="text-center space-x-2 rtl:space-x-reverse">
                  {onEditSaleTrigger && (
                    <Button variant="outline" size="icon" onClick={() => onEditSaleTrigger(sales.find(s=>s.id === item.sale_id)!, item)} aria-label="تعديل البيع">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteSaleTrigger && (
                    <Button variant="outline" size="icon" onClick={() => onDeleteSaleTrigger(sales.find(s=>s.id === item.sale_id)!, item)} aria-label="حذف البيع" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
              */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
