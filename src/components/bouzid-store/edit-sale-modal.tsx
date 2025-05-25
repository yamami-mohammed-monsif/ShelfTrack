
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, CalendarClock } from 'lucide-react';

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Sale, EditSaleFormData, Product } from '@/lib/types';
import { unitSuffix } from '@/lib/product-utils';

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEdit: (saleId: string, originalSale: Sale, data: EditSaleFormData) => void;
  saleToEdit: Sale | null;
  productForSale: Product | null; // Product associated with the sale
}

const createEditSaleFormSchema = (
    originalSaleQuantity: number, 
    currentProductStock: number, 
    productType: Product['type'] | undefined
) => z.object({
  quantitySold: z.coerce
    .number({
      required_error: "الكمية المباعة مطلوبة.",
      invalid_type_error: "الكمية المباعة يجب أن تكون رقماً صالحاً."
    })
    .positive({ message: 'الكمية المباعة يجب أن تكون أكبر من صفر.' })
    .refine(val => productType !== 'unit' || Number.isInteger(val), {
      message: 'كمية منتجات الوحدة يجب أن تكون رقماً صحيحاً.',
    })
    .refine(newSaleQuantity => {
        // Max quantity allowed = current product stock + original quantity of this sale
        // This means user can reduce the sale quantity (returning to stock)
        // or increase it up to the point where all available stock (including what was part of this sale) is used.
      const maxAllowedIncrease = currentProductStock;
      const effectivelyAvailableForThisSale = originalSaleQuantity + maxAllowedIncrease;
      return newSaleQuantity <= effectivelyAvailableForThisSale;
    }, { 
        message: `الكمية المطلوبة تتجاوز المخزون المتاح بالإضافة إلى الكمية الأصلية لهذه البيعة.`
    }),
  saleTimestamp: z.string().refine(val => {
    if (!val) return false;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: 'تاريخ ووقت البيع غير صالح.',
  }),
});


export function EditSaleModal({ 
    isOpen, 
    onClose, 
    onSaveEdit, 
    saleToEdit, 
    productForSale 
}: EditSaleModalProps) {

  const form = useForm<EditSaleFormData>({
    // Resolver will be set dynamically in useEffect
    defaultValues: {
      quantitySold: saleToEdit?.quantitySold || undefined,
      saleTimestamp: saleToEdit 
        ? new Date(saleToEdit.saleTimestamp).toISOString().slice(0, 16) 
        : new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    if (isOpen && saleToEdit && productForSale) {
      form.reset({
        quantitySold: saleToEdit.quantitySold,
        saleTimestamp: new Date(saleToEdit.saleTimestamp).toISOString().slice(0, 16),
      });
      // Dynamically set resolver with current stock and original sale quantity
      form.trigger(); // Re-validate with new schema context
      // @ts-ignore TODO: Fix this type error if possible, Zod's API might make this tricky
      form.resolver = zodResolver(createEditSaleFormSchema(
        saleToEdit.quantitySold, 
        productForSale.quantity, 
        productForSale.type
      ));

    } else if (!isOpen) {
        form.reset({
          quantitySold: undefined,
          saleTimestamp: new Date().toISOString().slice(0, 16),
        });
    }
  }, [isOpen, saleToEdit, productForSale, form]);


  const onSubmit = (data: EditSaleFormData) => {
    if (saleToEdit) {
      onSaveEdit(saleToEdit.id, saleToEdit, data);
    }
    onClose();
  };

  const productType = productForSale?.type;
  const quantityStep = useMemo(() => {
    if (productType === 'unit') return '1';
    return '0.01';
  }, [productType]);

  if (!saleToEdit || !productForSale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تعديل عملية البيع</DialogTitle>
          <DialogDescription className="text-center">
            قم بتحديث تفاصيل البيع للمنتج: {saleToEdit.productNameSnapshot}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 p-4 overflow-y-auto flex-grow"
          >
            <div>
              <p className="text-sm font-medium">المنتج: {saleToEdit.productNameSnapshot}</p>
              <p className="text-xs text-muted-foreground">
                سعر البيع الأصلي: {saleToEdit.retailPricePerUnitSnapshot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج / {productType ? unitSuffix[productType] : ''}
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="quantitySold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الكمية المباعة ({productType ? unitSuffix[productType] : ''})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      step={quantityStep}
                      value={field.value === undefined || Number.isNaN(Number(field.value)) ? "" : field.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const valueAsString = e.target.value;
                        if (valueAsString === "" || valueAsString === "-") {
                          field.onChange(undefined);
                        } else {
                          const valueAsNum = e.target.valueAsNumber;
                          if (Number.isNaN(valueAsNum)) {
                            field.onChange(valueAsString); 
                          } else {
                            field.onChange(valueAsNum);
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {productForSale && (
                     <p className="text-xs text-muted-foreground">
                        الكمية المتوفرة حالياً في المخزون: {productForSale.quantity.toLocaleString()} {unitSuffix[productForSale.type]}
                     </p>
                  )}
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

            {form.watch("quantitySold") > 0 && !Number.isNaN(form.watch("quantitySold")) && (
              <div className="text-lg font-semibold text-center p-2 bg-muted rounded-md">
                الإجمالي المحدث: {(saleToEdit.retailPricePerUnitSnapshot * (form.watch("quantitySold") || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ج
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" variant="default" disabled={!form.formState.isValid}>
                <Save className="ms-2 h-4 w-4" />
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
