
'use client';

import React from 'react';
import Link from 'next/link';
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
import type { Product } from '@/lib/types';
import { productTypeLabels, unitSuffix, isLowStock } from '@/lib/product-utils';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale'; 
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
}

export function ProductsTable({ products, onEditProduct }: ProductsTableProps) {
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
            <TableHead className="text-left rtl:text-right min-w-[150px]">تاريخ الإضافة/التعديل</TableHead>
            <TableHead className="text-center">تعديل</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.sort((a, b) => b.timestamp - a.timestamp).map((product) => (
            <TableRow key={product.id} className={cn(isLowStock(product) && "bg-destructive/10")}>
              <TableCell className="font-medium rtl:text-right">
                <Link href={`/products/${product.id}`} className="hover:underline text-primary">
                  {product.name}
                </Link>
              </TableCell>
              <TableCell className="rtl:text-right">{productTypeLabels[product.type]}</TableCell>
              <TableCell className="text-center">
                {product.wholesalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </TableCell>
              <TableCell className={cn(
                  "text-center",
                  isLowStock(product) && "text-destructive font-semibold"
                )}>
                {product.quantity.toLocaleString()} {unitSuffix[product.type]}
              </TableCell>
              <TableCell className="text-left rtl:text-right">
                {format(new Date(product.timestamp), 'PPpp', { locale: arSA })}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="outline" size="icon" onClick={() => onEditProduct(product)} aria-label="تعديل المنتج">
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
