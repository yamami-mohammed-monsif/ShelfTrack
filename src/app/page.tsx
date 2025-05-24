
'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/bouzid-store/app-header';
import { SalesDashboard } from '@/components/bouzid-store/sales-dashboard';
// import { AddProductButton } from '@/components/bouzid-store/add-product-button'; // No longer used directly
import { AddProductModal } from '@/components/bouzid-store/add-product-modal';
import { RecordSaleModal } from '@/components/bouzid-store/record-sale-modal';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import type { ProductFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';

export default function BouzidStorePage() {
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  
  const { products, addProduct, decreaseProductQuantity, isLoaded: productsLoaded } = useProductsStorage();
  const { addSale, isSalesLoaded } = useSalesStorage();
  const { toast } = useToast();

  const handleAddProduct = (data: ProductFormData) => {
    const newProduct = addProduct(data);
    toast({
      title: "نجاح",
      description: `تمت إضافة المنتج "${newProduct.name}" بنجاح.`,
      variant: "default",
    });
    console.log('New product added:', newProduct);
  };

  const handleRecordSale = (productId: string, quantitySold: number, saleTimestamp: number) => {
    const productSold = products.find(p => p.id === productId);
    if (!productSold) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المنتج.",
        variant: "destructive",
      });
      return;
    }

    const recordedSale = addSale(productSold, quantitySold, saleTimestamp);
    decreaseProductQuantity(productId, quantitySold);
    
    toast({
      title: "نجاح",
      description: `تم تسجيل بيع ${quantitySold} من "${productSold.name}" بنجاح.`,
      variant: "default",
    });
    console.log('Sale recorded:', recordedSale);
  };


  if (!productsLoaded || !isSalesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground text-xl">جار التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow pb-28"> {/* Add padding-bottom to avoid overlap with fixed button */}
        <SalesDashboard products={products} />
      </main>
      
      {/* Fixed Footer Buttons */}
      <div className="fixed bottom-0 start-0 end-0 p-4 bg-background border-t border-border shadow-lg z-40">
        <div className="flex gap-4">
          <Button 
            onClick={() => setIsRecordSaleModalOpen(true)} 
            className="flex-1 text-lg py-6 bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md"
            aria-label="تسجيل عملية بيع جديدة"
          >
            <ShoppingCart className="me-2 h-6 w-6" />
            بيع
          </Button>
          <Button 
            onClick={() => setIsAddProductModalOpen(true)} 
            className="flex-1 text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            aria-label="إضافة منتج جديد"
          >
            <Plus className="me-2 h-6 w-6" />
            منتج جديد
          </Button>
        </div>
      </div>

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAddProduct={handleAddProduct}
      />
      <RecordSaleModal
        isOpen={isRecordSaleModalOpen}
        onClose={() => setIsRecordSaleModalOpen(false)}
        onRecordSale={handleRecordSale}
        products={products}
      />
    </div>
  );
}
