
'use client';

import React, { useState } from 'react';
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
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Product } from '@/lib/types';
import { productTypeLabels, unitSuffix, isLowStock } from '@/lib/product-utils';
import { format, parseISO, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function ProductsTable({ products, onEditProduct, onDeleteProduct }: ProductsTableProps) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-10 px-4 text-muted-foreground">
        <p className="text-lg mb-2">لا توجد منتجات في المخزون حالياً.</p>
        <p className="text-sm">يمكنك إضافة منتجات جديدة من الصفحة الرئيسية.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableCaption className="py-4">قائمة بجميع المنتجات المسجلة في المخزون.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px] rtl:text-right">اسم المنتج</TableHead>
              <TableHead className="rtl:text-right">النوع</TableHead>
              <TableHead className="text-center">سعر الجملة</TableHead>
              <TableHead className="text-center">سعر البيع</TableHead>
              <TableHead className="text-center">الكمية</TableHead>
              <TableHead className="text-left rtl:text-right min-w-[150px]">تاريخ الإضافة/التعديل</TableHead>
              <TableHead className="text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.sort((a, b) => {
                const dateA = parseISO(a.updated_at);
                const dateB = parseISO(b.updated_at);
                if (!isValid(dateA)) return 1; // push invalid dates to the end
                if (!isValid(dateB)) return -1;
                return dateB.getTime() - dateA.getTime();
              }).map((product) => (
              <TableRow key={product.id} className={cn(isLowStock(product) && "bg-destructive/10")}>
                <TableCell className="font-medium rtl:text-right">
                  <Link href={`/products/${product.id}`} className="hover:underline text-primary">
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="rtl:text-right">{productTypeLabels[product.type]}</TableCell>
                <TableCell className="text-center">
                  {typeof product.wholesalePrice === 'number'
                    ? product.wholesalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'} د.ج
                </TableCell>
                <TableCell className="text-center">
                  {typeof product.retailPrice === 'number'
                    ? product.retailPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'} د.ج
                </TableCell>
                <TableCell className={cn(
                    "text-center",
                    isLowStock(product) && "text-destructive font-semibold"
                  )}>
                  {product.quantity.toLocaleString()} {unitSuffix[product.type]}
                </TableCell>
                <TableCell className="text-left rtl:text-right">
                  {product.updated_at && isValid(parseISO(product.updated_at)) 
                    ? format(parseISO(product.updated_at), 'PPpp', { locale: arSA })
                    : 'تاريخ غير متوفر'}
                </TableCell>
                <TableCell className="text-center space-x-2 rtl:space-x-reverse">
                  <Button variant="outline" size="icon" onClick={() => onEditProduct(product)} aria-label="تعديل المنتج">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setProductToDelete(product)} aria-label="حذف المنتج" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {productToDelete && (
        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف المنتج "{productToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProductToDelete(null)}>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className={cn(buttonVariants({variant: "destructive"}))}>
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
