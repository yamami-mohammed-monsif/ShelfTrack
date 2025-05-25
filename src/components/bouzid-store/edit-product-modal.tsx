
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Package, Droplet, Weight } from 'lucide-react';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Product, ProductFormData, ProductType } from '@/lib/types';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEdit: (productId: string, data: ProductFormData) => void;
  productToEdit: Product | null;
}

const createProductFormSchema = () => z.object({
  name: z.string().min(2, { message: 'اسم المنتج يجب أن يكون حرفين على الأقل.' }),
  type: z.enum(['powder', 'liquid', 'unit'], {
    required_error: 'يجب اختيار نوع المنتج.',
  }),
  wholesalePrice: z.coerce
    .number({
      required_error: "سعر الجملة مطلوب.",
      invalid_type_error: "سعر الجملة يجب أن يكون رقماً صالحاً."
    })
    .positive({ message: 'سعر الجملة يجب أن يكون إيجابياً.' }),
  retailPrice: z.coerce
    .number({
      required_error: "سعر البيع مطلوب.",
      invalid_type_error: "سعر البيع يجب أن يكون رقماً صالحاً."
    })
    .positive({ message: 'سعر البيع يجب أن يكون إيجابياً.' }),
  quantity: z.coerce
    .number({
      required_error: "الكمية مطلوبة.",
      invalid_type_error: "الكمية يجب أن تكون رقماً صالحاً."
    })
    .positive({ message: 'الكمية يجب أن تكون إيجابية.' }), // Changed from nonNegative to positive
}).superRefine((values, ctx) => {
  if (values.type === 'unit' && values.quantity !== undefined && !Number.isInteger(values.quantity)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'كمية منتجات الوحدة يجب أن تكون رقماً صحيحاً.',
      path: ['quantity'],
    });
  }
  if (values.wholesalePrice !== undefined && values.retailPrice !== undefined && values.retailPrice < values.wholesalePrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'سعر البيع يجب أن يكون مساوياً أو أكبر من سعر الجملة.',
      path: ['retailPrice'],
    });
  }
});

const unitLabels: Record<ProductType, { price: string; quantity: string; icon: React.ElementType }> = {
  powder: { price: 'للكيلوجرام (كجم)', quantity: 'كجم', icon: Weight },
  liquid: { price: 'للتر (لتر)', quantity: 'لتر', icon: Droplet },
  unit: { price: 'للقطعة', quantity: 'قطعة', icon: Package },
};

export function EditProductModal({ isOpen, onClose, onSaveEdit, productToEdit }: EditProductModalProps) {
  const [currentProductType, setCurrentProductType] = useState<ProductType>(productToEdit?.type || 'unit');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(createProductFormSchema()),
    defaultValues: productToEdit ? {
        name: productToEdit.name,
        type: productToEdit.type,
        wholesalePrice: productToEdit.wholesalePrice,
        retailPrice: productToEdit.retailPrice,
        quantity: productToEdit.quantity,
    } : {
      name: '',
      type: 'unit',
      wholesalePrice: undefined,
      retailPrice: undefined,
      quantity: undefined,
    },
  });

  useEffect(() => {
    if (isOpen && productToEdit) {
      form.reset({
        name: productToEdit.name,
        type: productToEdit.type,
        wholesalePrice: productToEdit.wholesalePrice,
        retailPrice: productToEdit.retailPrice,
        quantity: productToEdit.quantity,
      });
      setCurrentProductType(productToEdit.type);
    } else if (!isOpen) {
        form.reset({
            name: '',
            type: 'unit',
            wholesalePrice: undefined,
            retailPrice: undefined,
            quantity: undefined,
        });
        setCurrentProductType('unit');
    }
  }, [isOpen, productToEdit, form]);

  const onSubmit = (data: ProductFormData) => {
    if (productToEdit) {
      onSaveEdit(productToEdit.id, data);
    }
    onClose();
  };

  const selectedUnitLabels = unitLabels[currentProductType];
  const IconComponent = selectedUnitLabels.icon;

  const quantityStep = useMemo(() => {
    if (currentProductType === 'unit') return '1';
    return '0.01';
  }, [currentProductType]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تعديل المنتج</DialogTitle>
          <DialogDescription className="text-center">
            قم بتحديث تفاصيل المنتج.
          </DialogDescription>
        </DialogHeader>
        {productToEdit && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-4 overflow-y-auto flex-grow"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المنتج</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: سكر, زيت, صابون..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>نوع المنتج</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          const newType = value as ProductType;
                          field.onChange(newType);
                          setCurrentProductType(newType);
                          form.setValue('quantity', form.getValues('quantity'), { shouldValidate: true });
                        }}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-s-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="powder" />
                          </FormControl>
                          <FormLabel className="font-normal">مسحوق (مثل السكر، الدقيق)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-s-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="liquid" />
                          </FormControl>
                          <FormLabel className="font-normal">سائل (مثل الزيت، الحليب)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-s-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="unit" />
                          </FormControl>
                          <FormLabel className="font-normal">وحدة (مثل قطعة صابون، علبة)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-s-2">
                 <IconComponent className="h-5 w-5 text-muted-foreground" />
                 <span className="text-sm text-muted-foreground">
                   الوحدة المحددة: {selectedUnitLabels.quantity}
                 </span>
              </div>

              <FormField
                control={form.control}
                name="wholesalePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر الجملة ({selectedUnitLabels.price})</FormLabel>
                    <FormControl>
                       <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="retailPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر البيع (التجزئة) ({selectedUnitLabels.price})</FormLabel>
                    <FormControl>
                       <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكمية في المخزون ({selectedUnitLabels.quantity})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={quantityStep}
                        placeholder="0"
                        {...field}
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
                  </FormItem>
                )}
              />

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
        )}
      </DialogContent>
    </Dialog>
  );
}
