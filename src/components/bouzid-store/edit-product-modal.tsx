
'use client';

import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormDescription,
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

const productFormSchema = z.object({
  name: z.string().min(2, { message: 'اسم المنتج يجب أن يكون حرفين على الأقل.' }),
  type: z.enum(['powder', 'liquid', 'unit'], {
    required_error: 'يجب اختيار نوع المنتج.',
  }),
  wholesalePrice: z.coerce
    .number({ invalid_type_error: 'السعر يجب أن يكون رقماً.' })
    .positive({ message: 'السعر يجب أن يكون إيجابياً.' }),
  quantity: z.coerce
    .number({ invalid_type_error: 'الكمية يجب أن تكون رقماً.' })
    .positive({ message: 'الكمية يجب أن تكون إيجابية.' })
    .int({ message: 'الكمية يجب أن تكون رقماً صحيحاً.' }),
});

const unitLabels: Record<ProductType, { price: string; quantity: string; icon: React.ElementType }> = {
  powder: { price: 'للكيلوجرام (كجم)', quantity: 'كجم', icon: Weight },
  liquid: { price: 'للتر (لتر)', quantity: 'لتر', icon: Droplet },
  unit: { price: 'للقطعة', quantity: 'قطعة', icon: Package },
};

export function EditProductModal({ isOpen, onClose, onSaveEdit, productToEdit }: EditProductModalProps) {
  const [currentProductType, setCurrentProductType] = useState<ProductType>(productToEdit?.type || 'unit');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      type: 'unit',
      wholesalePrice: 0,
      quantity: 0,
    },
  });

  useEffect(() => {
    if (isOpen && productToEdit) {
      form.reset({
        name: productToEdit.name,
        type: productToEdit.type,
        wholesalePrice: productToEdit.wholesalePrice,
        quantity: productToEdit.quantity,
      });
      setCurrentProductType(productToEdit.type);
    } else if (!isOpen) {
        form.reset({ // Reset to defaults when closing
            name: '',
            type: 'unit',
            wholesalePrice: 0,
            quantity: 0,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تعديل المنتج</DialogTitle>
          <DialogDescription className="text-center">
            قم بتحديث تفاصيل المنتج.
          </DialogDescription>
        </DialogHeader>
        {productToEdit && ( // Only render form if productToEdit is available
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
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
                          field.onChange(value as ProductType);
                          setCurrentProductType(value as ProductType);
                        }}
                        value={field.value} // Ensure value is controlled
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                      <Input type="number" step="1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
                <Button type="submit" variant="default">
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
