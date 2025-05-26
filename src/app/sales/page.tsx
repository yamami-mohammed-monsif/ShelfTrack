
'use client';

import React, { useState } from 'react';
import { SalesTable } from '@/components/bouzid-store/sales-table';
// EditSaleModal and related logic are removed/commented as they need rework
// import { EditSaleModal } from '@/components/bouzid-store/edit-sale-modal';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useProductsStorage } from '@/hooks/use-products-storage';
// import { useToast } from '@/hooks/use-toast';
import type { Sale, Product } from '@/lib/types'; // EditSaleFormData removed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// AlertDialog for delete confirmation is removed for now
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
import { ClipboardList } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { buttonVariants } from '@/components/ui/button';


export default function SalesRecordPage() {
  const { sales, isSalesLoaded } = useSalesStorage(); // editSale, deleteSale, getSaleById removed
  const { isLoaded: productsLoaded } = useProductsStorage(); // Products might be needed for future edit/delete context
  // const { toast } = useToast();

  // State for EditSaleModal (removed for now)
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  // const [productForSaleEdit, setProductForSaleEdit] = useState<Product | null>(null);

  // State for DeleteSaleDialog (removed for now)
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null); // This would be a SaleItem or Sale ID


  // Edit/Delete handlers are removed as their logic needs a complete rework for the new data model.
  // They will be re-implemented in a future step focusing on transaction management.

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
            <CardDescription>عرض جميع عمليات البيع المسجلة وتفاصيل المنتجات المباعة.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-4">
            <SalesTable
              sales={sales} // Pass the array of Sale (transaction) objects
              showActions={false} // Actions disabled for now
              // onEditSaleTrigger={handleEditSaleTrigger} // Removed
              // onDeleteSaleTrigger={handleDeleteSaleTrigger} // Removed
            />
          </CardContent>
        </Card>
      </main>

      {/* EditSaleModal and AlertDialog for delete are removed for now */}
    </div>
  );
}
