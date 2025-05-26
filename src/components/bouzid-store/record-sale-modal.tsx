
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShoppingCart, CalendarClock, PackageSearch, Check, ChevronsUpDown, PlusCircle, Trash2, ListOrdered } from 'lucide-react';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { AddToCartFormData, Product, CartItem, Sale, SaleItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { unitSuffix } from '@/lib/product-utils';
import { useToast } from "@/hooks/use-toast";


interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordSale: (saleData: Sale) => void;
  products: Product[];
}

const createAddItemFormSchema = (allProducts: Product[], currentCartItems: CartItem[]) => z.object({
  productId: z.string().min(1, { message: 'الرجاء اختيار منتج.' }),
  quantity: z.coerce
    .number({
      required_error: "الكمية مطلوبة.",
      invalid_type_error: "الكمية يجب أن تكون رقماً صالحاً."
    })
    .positive({ message: 'الكمية يجب أن تكون أكبر من صفر.' }),
}).superRefine((values, ctx) => {
  if (!values.productId) return;

  const product = allProducts.find(p => p.id === values.productId);
  if (!product) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "المنتج المختار غير صالح.", path: ['productId'] });
    return;
  }

  if (typeof values.quantity !== 'number' || Number.isNaN(values.quantity)) {
    if (values.quantity !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "الكمية يجب أن تكون رقماً صالحاً.", path: ['quantity'] });
    }
    return;
  }

  if (product.type === 'unit' && !Number.isInteger(values.quantity)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'كمية منتجات الوحدة يجب أن تكون رقماً صحيحاً.', path: ['quantity'] });
  }

  const quantityAlreadyInCart = currentCartItems
    .filter(item => item.product_id === values.productId)
    .reduce((sum, item) => sum + item.quantitySold, 0);
  
  const totalQuantityRequested = quantityAlreadyInCart + values.quantity;

  if (totalQuantityRequested > product.quantity) {
     ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `الكمية المطلوبة (${totalQuantityRequested.toLocaleString()}) تتجاوز المخزون المتاح (${product.quantity.toLocaleString()}). مأخوذ في الحسبان: ${quantityAlreadyInCart.toLocaleString()} في السلة.`,
        path: ['quantity'],
      });
  }
});


export function RecordSaleModal({ isOpen, onClose, onRecordSale, products }: RecordSaleModalProps) {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [saleTimestampString, setSaleTimestampString] = useState(new Date().toISOString().slice(0, 16));
  
  const [productComboboxOpen, setProductComboboxOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");

  const productsRef = useRef(products);
  useEffect(() => { productsRef.current = products; }, [products]);

  const cartItemsRef = useRef(cartItems);
  useEffect(() => { cartItemsRef.current = cartItems; }, [cartItems]);

  const addItemForm = useForm<AddToCartFormData>({
    resolver: zodResolver(createAddItemFormSchema(productsRef.current, cartItemsRef.current)),
    defaultValues: { productId: '', quantity: undefined },
  });
   
  useEffect(() => {
    addItemForm.trigger(); // Re-validate when products or cartItems change
  }, [products, cartItems, addItemForm]);


  useEffect(() => {
    if (isOpen) {
      addItemForm.reset({ productId: '', quantity: undefined });
      setCartItems([]);
      setSaleTimestampString(new Date().toISOString().slice(0, 16));
      setProductSearchValue("");
    }
  }, [isOpen, addItemForm]);

  const availableProductsForDropdown = useMemo(() => products.filter(p => p.quantity > 0), [products]);

  const filteredProductsForDropdown = useMemo(() => {
    if (!productSearchValue) return availableProductsForDropdown;
    return availableProductsForDropdown.filter(product =>
      product.name.toLowerCase().includes(productSearchValue.toLowerCase())
    );
  }, [availableProductsForDropdown, productSearchValue]);

  const handleProductSelect = (product: Product) => {
    addItemForm.setValue('productId', product.id, { shouldValidate: true });
    setProductSearchValue(product.name); // Set search value to selected product name
    setProductComboboxOpen(false);
    addItemForm.setFocus('quantity');
    addItemForm.clearErrors('productId');
  };

  const handleAddItemToCart = (data: AddToCartFormData) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) {
      toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive" });
      return;
    }

    // Check if item already in cart, if so, update quantity (or replace for simplicity now)
    // For now, we allow adding the same product multiple times as separate cart entries,
    // or one could choose to merge them. Let's merge for a cleaner cart.
    const existingCartItemIndex = cartItems.findIndex(item => item.product_id === product.id);

    if (existingCartItemIndex > -1) {
        const updatedCartItems = [...cartItems];
        const existingItem = updatedCartItems[existingCartItemIndex];
        const newQuantity = existingItem.quantitySold + data.quantity;
        
        // Re-validate stock for the new total quantity
        if (newQuantity > product.quantity) {
            addItemForm.setError("quantity", { 
                type: "manual", 
                message: `الكمية الإجمالية (${newQuantity.toLocaleString()}) لـ "${product.name}" تتجاوز المخزون (${product.quantity.toLocaleString()}).`
            });
            return;
        }
        
        updatedCartItems[existingCartItemIndex] = {
            ...existingItem,
            quantitySold: newQuantity,
            itemTotalAmount: product.retailPrice * newQuantity,
        };
        setCartItems(updatedCartItems);
    } else {
        const newCartItem: CartItem = {
          tempId: crypto.randomUUID(),
          product_id: product.id,
          productNameSnapshot: product.name,
          quantitySold: data.quantity,
          wholesalePricePerUnitSnapshot: product.wholesalePrice,
          retailPricePerUnitSnapshot: product.retailPrice,
          itemTotalAmount: product.retailPrice * data.quantity,
          productType: product.type,
          availableStock: product.quantity,
        };
        setCartItems(prevItems => [...prevItems, newCartItem]);
    }

    toast({ title: "تمت الإضافة", description: `تم إضافة ${data.quantity} من "${product.name}" إلى السلة.`, variant: "default" });
    addItemForm.reset({ productId: '', quantity: undefined });
    setProductSearchValue(""); // Reset search value as well
    addItemForm.clearErrors();
  };
  
  const handleRemoveItemFromCart = (tempId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.tempId !== tempId));
  };

  const grandTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.itemTotalAmount, 0);
  }, [cartItems]);

  const handleFinalizeSale = () => {
    if (cartItems.length === 0) {
      toast({ title: "خطأ", description: "سلة البيع فارغة. الرجاء إضافة منتجات أولاً.", variant: "destructive"});
      return;
    }
    const saleTimestamp = new Date(saleTimestampString).getTime();
    if (isNaN(saleTimestamp)) {
        toast({ title: "خطأ", description: "تاريخ ووقت البيع غير صالح.", variant: "destructive"});
        return;
    }

    const finalSaleId = crypto.randomUUID();
    const now = Date.now();

    const saleToRecord: Sale = {
      id: finalSaleId,
      sale_timestamp: saleTimestamp,
      items: cartItems.map(cartItem => ({
        id: crypto.randomUUID(), // Each SaleItem gets its own unique ID
        sale_id: finalSaleId,
        product_id: cartItem.product_id,
        productNameSnapshot: cartItem.productNameSnapshot,
        quantitySold: cartItem.quantitySold,
        wholesalePricePerUnitSnapshot: cartItem.wholesalePricePerUnitSnapshot,
        retailPricePerUnitSnapshot: cartItem.retailPricePerUnitSnapshot,
        itemTotalAmount: cartItem.itemTotalAmount,
        productType: cartItem.productType,
      })),
      total_transaction_amount: grandTotal,
      created_at: now,
      updated_at: now,
    };
    onRecordSale(saleToRecord);
    onClose();
  };
  
  const selectedProductForAddItemForm = products.find(p => p.id === addItemForm.watch('productId'));
  const quantityStepForAddItemForm = useMemo(() => {
    if (selectedProductForAddItemForm?.type === 'unit') return '1';
    return '0.01';
  }, [selectedProductForAddItemForm]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      setProductComboboxOpen(false);
    }}>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تسجيل عملية بيع جديدة</DialogTitle>
          <DialogDescription className="text-center">
            أضف المنتجات إلى السلة ثم قم بإتمام عملية البيع.
          </DialogDescription>
        </DialogHeader>

        {/* Form for Adding Items to Cart */}
        <Form {...addItemForm}>
          <form
            onSubmit={addItemForm.handleSubmit(handleAddItemToCart)}
            className="space-y-4 p-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 items-start">
                <FormField
                  control={addItemForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>المنتج</FormLabel>
                      <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between min-h-[2.5rem]", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? products.find(p => p.id === field.value)?.name : "اختر منتجاً..."}
                              <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[250px] overflow-y-auto">
                          <Command>
                            <CommandInput
                              placeholder="ابحث عن منتج..."
                              value={productSearchValue}
                              onValueChange={setProductSearchValue}
                            />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على منتج.</CommandEmpty>
                              <CommandGroup>
                                {filteredProductsForDropdown.map((product) => (
                                  <CommandItem
                                    value={product.name}
                                    key={product.id}
                                    onSelect={() => handleProductSelect(product)}
                                  >
                                    <Check className={cn("me-2 h-4 w-4", product.id === field.value ? "opacity-100" : "opacity-0")} />
                                    {product.name} <span className="text-xs text-muted-foreground ms-1">(المتوفر: {product.quantity.toLocaleString()})</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addItemForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          step={quantityStepForAddItemForm}
                          {...field}
                          value={field.value === undefined || Number.isNaN(Number(field.value)) ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
                          disabled={!addItemForm.getValues('productId')}
                          className="min-h-[2.5rem]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="default" className="self-end min-h-[2.5rem]" disabled={!addItemForm.formState.isValid || !addItemForm.getValues('productId')}>
                  <PlusCircle className="me-2 h-5 w-5" />
                  إضافة
                </Button>
            </div>
          </form>
        </Form>
        
        {cartItems.length > 0 && <Separator className="my-4" />}

        {/* Cart Items Summary */}
        <ScrollArea className="flex-grow max-h-[300px] overflow-y-auto p-1">
          {cartItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">سلة البيع فارغة.</p>
          ) : (
            <div className="space-y-3">
              <h3 className="text-md font-semibold flex items-center"><ListOrdered className="me-2 h-5 w-5 text-primary"/>منتجات في السلة ({cartItems.length})</h3>
              {cartItems.map((item, index) => (
                <div key={item.tempId} className="flex items-center justify-between p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{item.productNameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantitySold.toLocaleString()} {unitSuffix[item.productType]} &times; {item.retailPricePerUnitSnapshot.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} د.ج = {item.itemTotalAmount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} د.ج
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromCart(item.tempId)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {cartItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="text-right text-lg font-bold p-2 bg-secondary text-secondary-foreground rounded-md">
              الإجمالي الكلي: {grandTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} د.ج
            </div>
            
            <FormItem className="mt-4">
              <FormLabel className="flex items-center">
                <CalendarClock className="me-2 h-4 w-4 text-muted-foreground" />
                تاريخ ووقت البيع
              </FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  value={saleTimestampString}
                  onChange={(e) => setSaleTimestampString(e.target.value)}
                  className="text-right"
                />
              </FormControl>
               { isNaN(new Date(saleTimestampString).getTime()) && <FormMessage className="text-destructive">التاريخ والوقت غير صالح.</FormMessage> }
            </FormItem>
          </>
        )}

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            type="button" 
            variant="default" 
            onClick={handleFinalizeSale} 
            disabled={cartItems.length === 0 || isNaN(new Date(saleTimestampString).getTime())}
          >
            <ShoppingCart className="ms-2 h-4 w-4" />
            إتمام البيع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
