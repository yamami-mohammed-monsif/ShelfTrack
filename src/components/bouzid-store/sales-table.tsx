
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"; // Changed from Accordion
import { Button } from '@/components/ui/button'; // For the trigger button
import type { Sale } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';
import { unitSuffix } from '@/lib/product-utils';

interface SalesTableProps {
  sales: Sale[];
  showCaption?: boolean;
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
          {sales.map((transaction) => (
            <Collapsible asChild key={transaction.id}>
              <>
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
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-center group p-2">
                        <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">عرض التفاصيل</span>
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                </TableRow>

                <CollapsibleContent asChild>
                  <TableRow className="bg-muted/10 hover:bg-muted/20">
                    <TableCell colSpan={5} className="p-0 !border-0">
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
                </CollapsibleContent>
              </>
            </Collapsible>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
