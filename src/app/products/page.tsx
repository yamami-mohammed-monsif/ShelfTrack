
'use client';

import React, { useState } from 'react';
// import type { Metadata } from 'next'; // Not used in client component directly
import { AppHeader } from '@/components/bouzid-store/app-header';
import { ProductsTable } from '@/components/bouzid-store/products-table';
import { EditProductModal } from '@/components/bouzid-store/edit-product-modal';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductFormData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package } from 'lucide-react';


export default function ProductsListPage() {
  const { products, editProduct, isLoaded } = useProductsStorage();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProductToEdit(null); 
  };

  const handleSaveEditedProduct = (productId: string, data: ProductFormData) => {
    const edited = editProduct(productId, data);
    if (edited) {
      toast({
        title: "نجاح",
        description: `تم تعديل المنتج "${edited.name}" بنجاح.`,
        variant: "default",
      });
    } else {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل المنتج.",
        variant: "destructive",
      });
    }
    handleCloseEditModal();
  };


  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار التحميل...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow p-4 md:p-8">
        <Card className="shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="bg-card border-b">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">قائمة المنتجات</CardTitle>
            </div>
            <CardDescription>عرض جميع المنتجات الموجودة في المخزون وتفاصيلها.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ProductsTable products={products} onEditProduct={handleOpenEditModal} />
          </CardContent>
        </Card>
      </main>
      {productToEdit && (
         <EditProductModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onSaveEdit={handleSaveEditedProduct}
            productToEdit={productToEdit}
        />
      )}
    </div>
  );
}
