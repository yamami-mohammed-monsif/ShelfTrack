
'use client';

import React, { useState } from 'react';
import { SalesTable } from '@/components/bouzid-store/sales-table';
import { EditSaleModal } from '@/components/bouzid-store/edit-sale-modal';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useToast } from '@/hooks/use-toast';
import type { Sale, Product, EditSaleFormData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';


export default function SalesRecordPage() {
  const { sales, editSale, deleteSale, getSaleById, isSalesLoaded } = useSalesStorage();
  const { products: allProducts, getProductById, increaseProductQuantity, decreaseProductQuantity, isLoaded: productsLoaded } = useProductsStorage();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [productForSaleEdit, setProductForSaleEdit] = useState<Product | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const handleEditSaleTrigger = (sale: Sale) => {
    const product = getProductById(sale.productId);
    if (product) {
      setSaleToEdit(sale);
      setProductForSaleEdit(product);
      setIsEditModalOpen(true);
    } else {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المنتج المرتبط بهذا البيع.",
        variant: "destructive",
      });
    }
  };

  const handleSaveEditedSale = (
    saleId: string, 
    originalSale: Sale, 
    updatedFormData: EditSaleFormData
  ) => {
    const edited = editSale(saleId, updatedFormData);
    if (edited) {
      const quantityDifference = originalSale.quantitySold - edited.quantitySold;
      
      if (quantityDifference > 0) { // Sold less than before, add back to stock
        increaseProductQuantity(originalSale.productId, quantityDifference);
      } else if (quantityDifference < 0) { // Sold more than before, remove from stock
        decreaseProductQuantity(originalSale.productId, -quantityDifference);
      }
      // If quantityDifference is 0, no stock change needed.

      toast({
        title: "نجاح",
        description: `تم تعديل عملية البيع للمنتج "${edited.productNameSnapshot}" بنجاح.`,
        variant: "default",
      });
    } else {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل عملية البيع.",
        variant: "destructive",
      });
    }
    setIsEditModalOpen(false);
    setSaleToEdit(null);
    setProductForSaleEdit(null);
  };

  const handleDeleteSaleTrigger = (sale: Sale) => {
    setSaleToDelete(sale);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteSale = () => {
    if (saleToDelete) {
      const deleted = deleteSale(saleToDelete.id);
      if (deleted) {
        // Add the sold quantity back to the product stock
        increaseProductQuantity(saleToDelete.productId, saleToDelete.quantitySold);
        toast({
          title: "نجاح",
          description: `تم حذف عملية البيع للمنتج "${saleToDelete.productNameSnapshot}" بنجاح.`,
          variant: "default",
        });
      } else {
         toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حذف عملية البيع.",
          variant: "destructive",
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setSaleToDelete(null);
  };


  if (!isSalesLoaded || !productsLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار تحميل سجل المبيعات...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow p-4 md:p-8">
        <Card className="shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="bg-card border-b">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ClipboardList className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">سجل المبيعات</CardTitle>
            </div>
            <CardDescription>عرض جميع عمليات البيع المسجلة وتفاصيلها. يمكنك تعديل أو حذف عمليات البيع من هنا.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-4">
            <SalesTable 
              sales={sales} 
              showActions={true}
              onEditSaleTrigger={handleEditSaleTrigger}
              onDeleteSaleTrigger={handleDeleteSaleTrigger}
            />
          </CardContent>
        </Card>
      </main>

      {saleToEdit && productForSaleEdit && (
        <EditSaleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSaleToEdit(null);
            setProductForSaleEdit(null);
          }}
          onSaveEdit={handleSaveEditedSale}
          saleToEdit={saleToEdit}
          productForSale={productForSaleEdit}
        />
      )}

      {saleToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف عملية البيع للمنتج "{saleToDelete.productNameSnapshot}"؟ 
                سيتم إعادة الكمية المباعة ({saleToDelete.quantitySold.toLocaleString()}) إلى المخزون.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteSale} className={cn(buttonVariants({variant: "destructive"}))}>
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
