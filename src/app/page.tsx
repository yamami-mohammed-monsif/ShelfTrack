
'use client';

import React, { useState } from 'react';
import { SalesDashboard } from '@/components/bouzid-store/sales-dashboard';
import { AddProductModal } from '@/components/bouzid-store/add-product-modal';
import { RecordSaleModal } from '@/components/bouzid-store/record-sale-modal';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import type { ProductFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';

export default function HomePage() {
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  
  const productsHook = useProductsStorage(); 
  const salesHook = useSalesStorage(); 
  const { toast } = useToast();

  const handleAddProduct = (data: ProductFormData) => {
    const newProduct = productsHook.addProduct(data);
    if (newProduct) {
      toast({
        title: "نجاح",
        description: `تمت إضافة المنتج "${newProduct.name}" بنجاح.`,
        variant: "default",
      });
      console.log('New product added:', newProduct);
    } else {
      toast({
        title: "خطأ",
        description: `المنتج "${data.name}" موجود بالفعل في المخزون.`,
        variant: "destructive",
      });
    }
  };

  const handleRecordSale = (productId: string, quantitySold: number, saleTimestamp: number) => {
    const productSold = productsHook.products.find(p => p.id === productId);
    if (!productSold) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المنتج.",
        variant: "destructive",
      });
      return;
    }

    const recordedSale = salesHook.addSale(productSold, quantitySold, saleTimestamp);
    productsHook.decreaseProductQuantity(productId, quantitySold);
    
    toast({
      title: "نجاح",
      description: `تم تسجيل بيع ${quantitySold} من "${productSold.name}" بنجاح.`,
      variant: "default",
    });
    console.log('Sale recorded:', recordedSale);
  };


  if (!productsHook.isLoaded || !salesHook.isSalesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground text-xl">جار التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background w-full"> {/* Added w-full */}
      <main className="flex-grow pb-28 w-full"> {/* Added w-full */}
        <SalesDashboard products={productsHook.products} />
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
        products={productsHook.products}
      />
    </div>
  );
}
