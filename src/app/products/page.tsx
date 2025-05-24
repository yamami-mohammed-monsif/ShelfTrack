
'use client';

import React, { useState, useMemo } from 'react';
import { AppHeader } from '@/components/bouzid-store/app-header';
import { ProductsTable } from '@/components/bouzid-store/products-table';
import { EditProductModal } from '@/components/bouzid-store/edit-product-modal';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductFormData, ProductType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Filter } from 'lucide-react';

type ProductFilter = 'all' | ProductType;

const filterLabels: Record<ProductFilter, string> = {
  all: 'الكل',
  powder: 'مسحوق',
  liquid: 'سائل',
  unit: 'وحدة',
};

export default function ProductsListPage() {
  const { products, editProduct, isLoaded } = useProductsStorage();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('all');

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

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') {
      return products;
    }
    return products.filter(product => product.type === activeFilter);
  }, [products, activeFilter]);

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
            <CardDescription>عرض جميع المنتجات الموجودة في المخزون وتفاصيلها. قم بالتصفية حسب النوع.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4 pb-4 border-b">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">تصفية حسب النوع:</span>
              {(Object.keys(filterLabels) as ProductFilter[]).map((filterKey) => (
                <Button
                  key={filterKey}
                  variant={activeFilter === filterKey ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(filterKey)}
                  className="px-3 py-1 h-auto"
                >
                  {filterLabels[filterKey]}
                </Button>
              ))}
            </div>
            <ProductsTable products={filteredProducts} onEditProduct={handleOpenEditModal} />
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
