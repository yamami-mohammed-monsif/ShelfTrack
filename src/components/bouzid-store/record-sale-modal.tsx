
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const createSaleFormSchema = (allProducts: Product[]) => z.object({
  productId: z.string().min(1, { message: 'الرجاء اختيار منتج.' }),
  quantitySold: z.coerce
    .number({ 
      invalid_type_error: 'الكمية يجب أن تكون رقماً.',
      required_error: "الكمية المباعة مطلوبة." 
    })
    .positive({ message: 'الكمية المباعة يجب أن تكون أكبر من صفر.' }),
  saleTimestamp: z.string().refine(val => {
    if (!val) return false; // Ensure value is not empty
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: 'تاريخ ووقت البيع غير صالح.',
  }),
}).superRefine((values, ctx) => {
  if (!values.productId) return;

  const product = allProducts.find(p => p.id === values.productId);

  if (!product) {
    // This case should ideally be handled by the combobox selection ensuring a valid product.
    // If it still occurs, it indicates an issue with product selection logic.
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "المنتج المختار غير صالح.",
      path: ['productId'],
    });
    return;
  }

  if (product.type === 'unit' && !Number.isInteger(values.quantitySold)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'كمية منتجات الوحدة يجب أن تكون رقماً صحيحاً.',
      path: ['quantitySold'],
    });
  }
  
  if (values.quantitySold > product.quantity) {
     ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `الكمية المتوفرة لـ "${product.name}" هي ${product.quantity.toLocaleString()} فقط.`,
        path: ['quantitySold'],
      });
  }
});


export function RecordSaleModal({ isOpen, onClose, onRecordSale, products }: RecordSaleModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Ref to hold the latest products for Zod schema
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(createSaleFormSchema(productsRef.current)), // Pass the ref's current value
    defaultValues: {
      productId: '',
      quantitySold: 1,
      saleTimestamp: new Date().toISOString().slice(0, 16), // Format for datetime-local
    },
  });
  
  // Update resolver if products change to ensure schema uses latest product list
  useEffect(() => {
    form.reset(form.getValues(), {
       // @ts-ignore - zodResolver is not strictly typed here but it works
      resolver: zodResolver(createSaleFormSchema(productsRef.current)),
    });
  }, [products, form]);


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
    form.setValue('productId', product.id, { shouldValidate: true });
    setSelectedProduct(product);
    setSearchValue(product.name); 
    setComboboxOpen(false);
    
    // Reset quantity or adjust if current quantity is too high for the new product.
    const currentQuantity = form.getValues('quantitySold');
    if (currentQuantity > product.quantity) {
        form.setValue('quantitySold', product.quantity > 0 ? 1 : 0, { shouldValidate: true });
    } else if (product.type === 'unit' && !Number.isInteger(currentQuantity)) {
        form.setValue('quantitySold', Math.floor(currentQuantity) || 1, { shouldValidate: true });
    } else if (currentQuantity <=0) {
        form.setValue('quantitySold', 1, { shouldValidate: true });
    }
    form.clearErrors('productId');
  };

  const onSubmit = (data: SaleFormData) => {
    // Validation is now primarily handled by Zod's superRefine.
    // Final check can be minimal or rely on Zod.
    const saleTime = new Date(data.saleTimestamp).getTime();
    onRecordSale(data.productId, data.quantitySold, saleTime);
    onClose();
  };

  const quantityStep = useMemo(() => {
    if (selectedProduct?.type === 'unit') return '1';
    return '0.01'; // Allow decimals for powder and liquid
  }, [selectedProduct]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      setComboboxOpen(false); 
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
                            ? products.find( // Use 'products' here for display consistency after selection
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
                                value={product.name} 
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
                                {product.name} (المتوفر: {product.quantity.toLocaleString()})
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
                سعر الوحدة: {selectedProduct.wholesalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج / {
                  selectedProduct.type === 'powder' ? 'كجم' : selectedProduct.type === 'liquid' ? 'لتر' : 'قطعة'
                }
              </p>
            )}

            <FormField
              control={form.control}
              name="quantitySold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الكمية المباعة</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      disabled={!selectedProduct}
                      step={quantityStep}
                      onChange={(e) => field.onChange(e.target.valueAsNumber === 0 ? "" : e.target.valueAsNumber)} // Handle 0 as empty for coerce
                    />
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
            
            {selectedProduct && form.watch("quantitySold") > 0 && (
              <div className="text-lg font-semibold text-center p-2 bg-muted rounded-md">
                الإجمالي: {(selectedProduct.wholesalePrice * (form.watch("quantitySold") || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </div>
            )}


            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" variant="default" disabled={!selectedProduct || availableProducts.length === 0 || !form.formState.isValid}>
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
