
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShoppingCart, CalendarClock, PackageSearch, Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep if used elsewhere, not directly by combobox
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { SaleFormData, Product } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordSale: (productId: string, quantitySold: number, saleTimestamp: number) => void;
  products: Product[];
}

const saleFormSchema = z.object({
  productId: z.string().min(1, { message: 'الرجاء اختيار منتج.' }),
  quantitySold: z.coerce
    .number({ invalid_type_error: 'الكمية يجب أن تكون رقماً.' })
    .int({ message: 'الكمية يجب أن تكون رقماً صحيحاً.' })
    .positive({ message: 'الكمية المباعة يجب أن تكون أكبر من صفر.' }),
  saleTimestamp: z.string().refine(val => !isNaN(new Date(val).getTime()), {
    message: 'تاريخ ووقت البيع غير صالح.',
  }),
});

export function RecordSaleModal({ isOpen, onClose, onRecordSale, products }: RecordSaleModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");


  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      productId: '',
      quantitySold: 1,
      saleTimestamp: new Date().toISOString().slice(0, 16), // Format for datetime-local
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        productId: '',
        quantitySold: 1,
        saleTimestamp: new Date().toISOString().slice(0, 16),
      });
      setSelectedProduct(null);
      setSearchValue("");
    }
  }, [isOpen, form]);

  const availableProducts = useMemo(() => products.filter(p => p.quantity > 0), [products]);

  const filteredProducts = useMemo(() => {
    if (!searchValue) return availableProducts;
    return availableProducts.filter(product =>
      product.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [availableProducts, searchValue]);


  const handleProductSelect = (product: Product) => {
    form.setValue('productId', product.id);
    setSelectedProduct(product);
    setSearchValue(product.name); // Update search value to reflect selection
    setComboboxOpen(false);
    if (form.getValues('quantitySold') > product.quantity) {
      form.setValue('quantitySold', product.quantity > 0 ? 1 : 0);
    }
     // Clear errors for productId if any
    form.clearErrors('productId');
  };

  const onSubmit = (data: SaleFormData) => {
    const product = products.find((p) => p.id === data.productId); // Use original products list for final validation
    if (!product) {
      form.setError('productId', { type: 'manual', message: 'المنتج المختار غير موجود.' });
      return;
    }
    if (data.quantitySold > product.quantity) {
      form.setError('quantitySold', {
        type: 'manual',
        message: `الكمية المتوفرة لـ "${product.name}" هي ${product.quantity} فقط.`,
      });
      return;
    }
    
    const saleTime = new Date(data.saleTimestamp).getTime();
    onRecordSale(data.productId, data.quantitySold, saleTime);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      setComboboxOpen(false); // Ensure combobox closes if dialog closes
    }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تسجيل عملية بيع</DialogTitle>
          <DialogDescription className="text-center">
            اختر المنتج وأدخل تفاصيل البيع.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center">
                    <PackageSearch className="me-2 h-4 w-4 text-muted-foreground" />
                    المنتج
                  </FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? availableProducts.find(
                                (product) => product.id === field.value
                              )?.name
                            : "اختر منتجاً..."}
                          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[250px] overflow-y-auto">
                      <Command>
                        <CommandInput 
                          placeholder="ابحث عن منتج..."
                          value={searchValue}
                          onValueChange={setSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>لم يتم العثور على منتج.</CommandEmpty>
                          <CommandGroup>
                            {filteredProducts.map((product) => (
                              <CommandItem
                                value={product.name} // Use product.name for cmdk filtering, actual value is product.id
                                key={product.id}
                                onSelect={() => handleProductSelect(product)}
                              >
                                <Check
                                  className={cn(
                                    "me-2 h-4 w-4",
                                    product.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {product.name} (المتوفر: {product.quantity})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                           {availableProducts.length === 0 && !searchValue && (
                             <CommandItem disabled className="text-center text-muted-foreground py-2">
                                لا توجد منتجات متوفرة للبيع
                             </CommandItem>
                           )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProduct && (
              <p className="text-sm text-muted-foreground">
                سعر الوحدة: {selectedProduct.wholesalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </p>
            )}

            <FormField
              control={form.control}
              name="quantitySold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الكمية المباعة</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} disabled={!selectedProduct} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="saleTimestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <CalendarClock className="me-2 h-4 w-4 text-muted-foreground" />
                    تاريخ ووقت البيع
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} className="text-right"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedProduct && form.getValues("quantitySold") > 0 && (
              <div className="text-lg font-semibold text-center p-2 bg-muted rounded-md">
                الإجمالي: {(selectedProduct.wholesalePrice * (form.watch("quantitySold") || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </div>
            )}


            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" variant="default" disabled={!selectedProduct || availableProducts.length === 0}>
                <ShoppingCart className="ms-2 h-4 w-4" />
                تسجيل البيع
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

