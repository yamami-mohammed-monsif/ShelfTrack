'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/bouzid-store/app-header';
import { SalesDashboard } from '@/components/bouzid-store/sales-dashboard';
import { AddProductButton } from '@/components/bouzid-store/add-product-button';
import { AddProductModal } from '@/components/bouzid-store/add-product-modal';
import { useProductsStorage } from '@/hooks/use-products-storage';
import type { ProductFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

export default function BouzidStorePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { products, addProduct, isLoaded } = useProductsStorage();
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

  if (!isLoaded) {
    // Optional: add a loading state or skeleton screen
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
      <AddProductButton onClick={() => setIsModalOpen(true)} />
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}
