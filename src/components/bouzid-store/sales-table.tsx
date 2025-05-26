
'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Sale } from '@/lib/types'; // SaleItem removed as it's part of Sale
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';
import { unitSuffix } from '@/lib/product-utils';
// cn import removed as it's not used

interface SalesTableProps {
  sales: Sale[];
  showCaption?: boolean;
  // showActions, onEditSaleTrigger, onDeleteSaleTrigger props removed as actions are currently disabled
}

export function SalesTable({
  sales,
  showCaption = true,
}: SalesTableProps) {

  if (!sales || sales.length === 0) {
    return (
      <div className="text-center py-10 px-4 text-muted-foreground">
        <p className="text-lg mb-2">لا توجد عمليات بيع مسجلة حالياً.</p>
        <p className="text-sm">يمكنك تسجيل عمليات بيع جديدة من الصفحة الرئيسية.</p>
      </div>
    );
  }

  // The sales are already sorted by timestamp in the hook/page level before being passed.
  // If additional client-side sorting is needed here, it can be done.
  // For now, we assume 'sales' prop is pre-sorted if desired.

  return (
    <div className="overflow-x-auto">
      <Table>
        {showCaption && (
          <TableCaption className="py-4">
            سجل بجميع عمليات البيع المسجلة. انقر لعرض تفاصيل المنتجات في كل عملية بيع.
          </TableCaption>
        )}
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[130px] rtl:text-right">التاريخ</TableHead>
            <TableHead className="min-w-[100px] rtl:text-right">معرف البيع</TableHead>
            <TableHead className="text-center min-w-[100px]">إجمالي المنتجات</TableHead>
            <TableHead className="text-center min-w-[120px]">المبلغ الإجمالي</TableHead>
            <TableHead className="text-center w-[120px]">التفاصيل</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Accordion type="multiple" className="w-full">
            {sales.map((transaction) => (
              <AccordionItem value={transaction.id} key={transaction.id} className="border-b last:border-b-0">
                {/* Main Transaction Row as AccordionTrigger */}
                <TableRow className="hover:bg-muted/30 data-[state=open]:bg-muted/40">
                  <TableCell className="font-medium rtl:text-right">
                    {typeof transaction.sale_timestamp === 'number' && !isNaN(transaction.sale_timestamp)
                      ? format(new Date(transaction.sale_timestamp), 'yyyy-MM-dd HH:mm', { locale: arSA })
                      : 'تاريخ غير صالح'}
                  </TableCell>
                  <TableCell className="rtl:text-right">{transaction.id.substring(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="text-center">{transaction.items.length}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {transaction.total_transaction_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
                  </TableCell>
                  <TableCell className="text-center">
                    <AccordionTrigger className="p-2 hover:bg-accent/50 rounded-md w-full justify-center group">
                       <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                       <span className="sr-only">عرض التفاصيل</span>
                    </AccordionTrigger>
                  </TableCell>
                </TableRow>

                {/* AccordionContent containing the sub-table for items */}
                <AccordionContent asChild>
                  <TableRow className="bg-muted/10 hover:bg-muted/20">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">المنتجات المباعة في هذه العملية:</h4>
                        <Table className="bg-background rounded-md shadow-sm">
                          <TableHeader>
                            <TableRow className="border-b-0">
                              <TableHead className="rtl:text-right">اسم المنتج</TableHead>
                              <TableHead className="text-center">الكمية</TableHead>
                              <TableHead className="text-center">سعر الوحدة</TableHead>
                              <TableHead className="text-center">إجمالي المنتج</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transaction.items.map((item) => (
                              <TableRow key={item.id} className="border-b-0 last:border-b-0">
                                <TableCell className="font-medium rtl:text-right">{item.productNameSnapshot}</TableCell>
                                <TableCell className="text-center">
                                  {item.quantitySold.toLocaleString()} {item.productType ? unitSuffix[item.productType] : ''}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.retailPricePerUnitSnapshot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
                                </TableCell>
                                <TableCell className="text-center font-semibold">
                                  {item.itemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TableBody>
      </Table>
    </div>
  );
}
