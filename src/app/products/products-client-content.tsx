
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/bouzid-store/app-header';
import { ProductsTable } from '@/components/bouzid-store/products-table';
import { EditProductModal } from '@/components/bouzid-store/edit-product-modal';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductFormData, ProductType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Filter, Search } from 'lucide-react';
import { isLowStock } from '@/lib/product-utils';

type ProductFilter = 'all' | ProductType | 'low-stock';

const filterLabels: Record<ProductFilter, string> = {
  all: 'الكل',
  powder: 'مسحوق',
  liquid: 'سائل',
  unit: 'وحدة',
  'low-stock': 'مخزون منخفض',
};

export default function ProductsClientContent() {
  const { products, editProduct, deleteProduct, isLoaded } = useProductsStorage();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const filterFromQuery = searchParams.get('filter');
    if (filterFromQuery && Object.keys(filterLabels).includes(filterFromQuery) && filterFromQuery !== activeFilter) {
      setActiveFilter(filterFromQuery as ProductFilter);
    }
  }, [searchParams, activeFilter]);

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

  const handleDeleteProduct = (productToDelete: Product) => {
    deleteProduct(productToDelete.id);
    toast({
      title: "نجاح",
      description: `تم حذف المنتج "${productToDelete.name}" بنجاح.`,
      variant: "default",
    });
  };

  const productCounts = useMemo(() => {
    return {
      all: products.length,
      powder: products.filter(p => p.type === 'powder').length,
      liquid: products.filter(p => p.type === 'liquid').length,
      unit: products.filter(p => p.type === 'unit').length,
      'low-stock': products.filter(p => isLowStock(p)).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let intermediateProducts = products;

    if (activeFilter !== 'all') {
      if (activeFilter === 'low-stock') {
        intermediateProducts = products.filter(product => isLowStock(product));
      } else {
        intermediateProducts = products.filter(product => product.type === activeFilter);
      }
    }

    if (searchTerm) {
      intermediateProducts = intermediateProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return intermediateProducts;
  }, [products, activeFilter, searchTerm]);

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
            <CardDescription>عرض جميع المنتجات الموجودة في المخزون وتفاصيلها. قم بالتصفية حسب النوع أو حالة المخزون أو ابحث بالاسم.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="ابحث عن منتج بالاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border"
                />
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap pb-4 border-b">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">تصفية حسب:</span>
                {(Object.keys(filterLabels) as ProductFilter[]).map((filterKey) => (
                  <Button
                    key={filterKey}
                    variant={activeFilter === filterKey ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filterKey)}
                    className="px-3 py-1 h-auto m-1"
                  >
                    {filterLabels[filterKey]} ({filterKey === 'all' 
                      ? productCounts.all 
                      : products.filter(p => { 
                          if (filterKey === 'low-stock') return isLowStock(p);
                          return p.type === filterKey;
                        }).length
                    })
                  </Button>
                ))}
              </div>
            </div>
            <ProductsTable 
              products={filteredProducts} 
              onEditProduct={handleOpenEditModal}
              onDeleteProduct={handleDeleteProduct} 
            />
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
