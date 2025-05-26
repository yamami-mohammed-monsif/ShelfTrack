
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductsTable } from '@/components/bouzid-store/products-table';
import { EditProductModal } from '@/components/bouzid-store/edit-product-modal';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductFormData, ProductType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Package, Filter, ChevronsUpDown, Check } from 'lucide-react';
import { isLowStock } from '@/lib/product-utils';
import { cn } from '@/lib/utils';

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
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const filterFromQuery = searchParams.get('filter');
    if (filterFromQuery && Object.keys(filterLabels).includes(filterFromQuery) && filterFromQuery !== activeFilter) {
      setActiveFilter(filterFromQuery as ProductFilter);
    }
  }, [searchParams]); // Removed activeFilter from dependency array

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

  const filteredProductsForTable = useMemo(() => {
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

  if (!hasMounted || !isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار التحميل...</p>
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
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">قائمة المنتجات</CardTitle>
            </div>
            <CardDescription>عرض جميع المنتجات الموجودة في المخزون وتفاصيلها. قم بالتصفية حسب النوع أو حالة المخزون أو ابحث بالاسم.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between text-muted-foreground hover:text-muted-foreground"
                    >
                      {searchTerm || "ابحث عن منتج بالاسم..."}
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[300px] overflow-y-auto">
                    <Command>
                      <CommandInput
                        placeholder="ابحث عن منتج..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>لم يتم العثور على منتج.</CommandEmpty>
                        <CommandGroup>
                          {products.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name} 
                              onSelect={() => { 
                                const newSearchTerm = product.name === searchTerm ? "" : product.name;
                                setSearchTerm(newSearchTerm);
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "me-2 h-4 w-4",
                                  searchTerm === product.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {product.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                    {filterLabels[filterKey]} ({productCounts[filterKey]})
                  </Button>
                ))}
              </div>
            </div>
            <ProductsTable
              products={filteredProductsForTable}
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
    

    

    