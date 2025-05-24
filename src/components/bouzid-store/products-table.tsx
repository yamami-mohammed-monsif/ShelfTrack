
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
import type { Product, ProductType } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale'; 

interface ProductsTableProps {
  products: Product[];
}

const productTypeLabels: Record<ProductType, string> = {
  powder: 'مسحوق',
  liquid: 'سائل',
  unit: 'وحدة',
};

const unitSuffix: Record<ProductType, string> = {
  powder: 'كجم',
  liquid: 'لتر',
  unit: 'قطعة',
};

export function ProductsTable({ products }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-10 px-4 text-muted-foreground">
        <p className="text-lg mb-2">لا توجد منتجات في المخزون حالياً.</p>
        <p className="text-sm">يمكنك إضافة منتجات جديدة من الصفحة الرئيسية.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="py-4">قائمة بجميع المنتجات المسجلة في المخزون.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px] rtl:text-right">اسم المنتج</TableHead>
            <TableHead className="rtl:text-right">النوع</TableHead>
            <TableHead className="text-center">سعر الجملة</TableHead>
            <TableHead className="text-center">الكمية</TableHead>
            <TableHead className="text-left rtl:text-right min-w-[150px]">تاريخ الإضافة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.sort((a, b) => b.timestamp - a.timestamp).map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium rtl:text-right">{product.name}</TableCell>
              <TableCell className="rtl:text-right">{productTypeLabels[product.type]}</TableCell>
              <TableCell className="text-center">
                {product.wholesalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className="text-center">
                {product.quantity.toLocaleString()} {unitSuffix[product.type]}
              </TableCell>
              <TableCell className="text-left rtl:text-right">
                {format(new Date(product.timestamp), 'PPpp', { locale: arSA })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
