
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditProductModal } from '@/components/bouzid-store/edit-product-modal';
import { EditSaleModal } from '@/components/bouzid-store/edit-sale-modal'; // New Import
import { SalesTable } from '@/components/bouzid-store/sales-table';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductFormData, Sale, EditSaleFormData } from '@/lib/types'; // Updated types
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Package, Edit3, DollarSign, TrendingUp, ListOrdered, CalendarDays, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { productTypeLabels, unitSuffix } from '@/lib/product-utils';
import { cn } from '@/lib/utils';


const CustomSalesTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as any; 
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-1 text-right">
          <span className="text-sm text-muted-foreground">
            {format(parseISO(data.originalDate), 'PPpp', { locale: arSA })}
          </span>
          <span className="font-semibold" style={{ color: payload[0].color }}>
            الكمية المباعة: {payload[0].value?.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = typeof params.productId === 'string' ? params.productId : '';

  const { 
    getProductById, 
    editProduct, 
    deleteProduct,
    increaseProductQuantity, // For sale edits/deletes
    decreaseProductQuantity, // For sale edits
    isLoaded: productsLoaded,
  } = useProductsStorage();
  const { 
    sales, 
    editSale, // For editing sales
    deleteSale, // For deleting sales
    isSalesLoaded 
  } = useSalesStorage();

  const [product, setProduct] = useState<Product | null | undefined>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isDeleteProductDialogOpen, setIsDeleteProductDialogOpen] = useState(false);

  // State for EditSaleModal
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  
  // State for DeleteSaleDialog
  const [isDeleteSaleDialogOpen, setIsDeleteSaleDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);


  useEffect(() => {
    if (productsLoaded && productId) {
      const fetchedProduct = getProductById(productId);
      setProduct(fetchedProduct);
      if (!fetchedProduct) {
        console.warn("Product not found on initial load or ID change");
      }
    }
  }, [productId, productsLoaded, getProductById]);


  const productSales = useMemo(() => {
    if (!product) return [];
    // Ensure sales are sorted by timestamp for this product
    return sales
      .filter(sale => sale.productId === product.id)
      .sort((a, b) => b.saleTimestamp - a.saleTimestamp); // Sort by most recent first for table
  }, [sales, product]);

  const salesChartData = useMemo(() => {
    // For chart, sort by oldest first
    return productSales
      .slice() // Create a copy before reversing for chart
      .reverse()
      .map(sale => ({
        originalDate: new Date(sale.saleTimestamp).toISOString(),
        date: format(new Date(sale.saleTimestamp), 'MMM d', { locale: arSA }), 
        quantitySold: sale.quantitySold,
    }));
  }, [productSales]);

  const salesChartConfig = {
    quantitySold: {
      label: 'الكمية المباعة',
      color: 'hsl(var(--chart-1))',
    },
  };

  const handleOpenEditProductModal = () => {
    if (product) {
      setIsEditProductModalOpen(true);
    }
  };

  const handleCloseEditProductModal = () => {
    setIsEditProductModalOpen(false);
  };

  const handleSaveEditedProduct = (id: string, data: ProductFormData) => {
    const edited = editProduct(id, data);
    if (edited) {
      setProduct(edited); 
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
    handleCloseEditProductModal();
  };

  const handleConfirmDeleteProduct = () => {
    if (product) {
      // Before deleting product, consider if associated sales should also be handled (e.g., anonymized or cascade deleted).
      // For now, sales will remain but might point to a non-existent product if not careful.
      // A more robust system might prevent product deletion if sales exist, or archive the product.
      // For this iteration, we just delete the product.
      deleteProduct(product.id);
      toast({
        title: "نجاح",
        description: `تم حذف المنتج "${product.name}" بنجاح.`,
        variant: "default",
      });
      setIsDeleteProductDialogOpen(false);
      router.push('/products'); 
    }
  };

  // --- Sale Edit/Delete Handlers ---
  const handleEditSaleTrigger = (sale: Sale) => {
    setSaleToEdit(sale); // product for sale is the current page's product
    setIsEditSaleModalOpen(true);
  };

  const handleSaveEditedSale = (
    saleId: string, 
    originalSale: Sale, 
    updatedFormData: EditSaleFormData
  ) => {
    const editedSale = editSale(saleId, updatedFormData);
    if (editedSale && product) { // product should be the current page product
      const quantityDifference = originalSale.quantitySold - editedSale.quantitySold;
      
      if (quantityDifference > 0) { 
        increaseProductQuantity(product.id, quantityDifference);
      } else if (quantityDifference < 0) {
        decreaseProductQuantity(product.id, -quantityDifference);
      }
      setProduct(getProductById(product.id)); // Refresh product state

      toast({
        title: "نجاح",
        description: `تم تعديل عملية البيع للمنتج "${editedSale.productNameSnapshot}" بنجاح.`,
        variant: "default",
      });
    } else {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل عملية البيع.",
        variant: "destructive",
      });
    }
    setIsEditSaleModalOpen(false);
    setSaleToEdit(null);
  };

  const handleDeleteSaleTrigger = (sale: Sale) => {
    setSaleToDelete(sale);
    setIsDeleteSaleDialogOpen(true);
  };

  const handleConfirmDeleteSale = () => {
    if (saleToDelete && product) {
      const deleted = deleteSale(saleToDelete.id);
      if (deleted) {
        increaseProductQuantity(product.id, saleToDelete.quantitySold);
        setProduct(getProductById(product.id)); // Refresh product state
        toast({
          title: "نجاح",
          description: `تم حذف عملية البيع للمنتج "${saleToDelete.productNameSnapshot}" بنجاح.`,
          variant: "default",
        });
      } else {
         toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حذف عملية البيع.",
          variant: "destructive",
        });
      }
    }
    setIsDeleteSaleDialogOpen(false);
    setSaleToDelete(null);
  };


  if (!productsLoaded || !isSalesLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار تحميل تفاصيل المنتج...</p>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <Package className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">المنتج غير موجود</h1>
          <p className="text-muted-foreground mb-6">
            لم نتمكن من العثور على المنتج الذي تبحث عنه. ربما تم حذفه أو أن الرابط غير صحيح.
          </p>
          <Button onClick={() => router.push('/products')}>العودة إلى قائمة المنتجات</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow p-4 md:p-8 space-y-6">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">{product.name}</CardTitle>
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm" onClick={handleOpenEditProductModal}>
                <Edit3 className="me-2 h-4 w-4" />
                تعديل
              </Button>
              <AlertDialog open={isDeleteProductDialogOpen} onOpenChange={setIsDeleteProductDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
                    <Trash2 className="me-2 h-4 w-4" />
                    حذف
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد حذف المنتج</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد أنك تريد حذف المنتج "{product.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDeleteProduct} className={cn(buttonVariants({variant: "destructive"}))}>
                      تأكيد الحذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">النوع</p>
                <p className="font-medium">{productTypeLabels[product.type]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">سعر الجملة</p>
                <p className="font-medium">
                  {typeof product.wholesalePrice === 'number' 
                    ? product.wholesalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : '0.00'} د.ج / {unitSuffix[product.type]}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">سعر البيع (التجزئة)</p>
                <p className="font-medium">
                  {typeof product.retailPrice === 'number' 
                    ? product.retailPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : '0.00'} د.ج / {unitSuffix[product.type]}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">الكمية في المخزون</p>
                <p className="font-medium">{product.quantity.toLocaleString()} {unitSuffix[product.type]}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-muted-foreground">آخر تحديث</p>
                <p className="font-medium">{format(new Date(product.timestamp), 'PPpp', { locale: arSA })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
             <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">مبيعات المنتج عبر الزمن</CardTitle>
            </div>
            <CardDescription>الكمية المباعة من هذا المنتج.</CardDescription>
          </CardHeader>
          <CardContent>
            {productSales.length > 0 ? (
              <div className="h-[300px] w-full">
                <ChartContainer config={salesChartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesChartData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: -20, 
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={['auto', 'auto']}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={<CustomSalesTooltip />}
                        cursor={{ strokeDasharray: '3 3' }}
                      />
                       <Legend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="quantitySold"
                        stroke="var(--color-quantitySold)"
                        strokeWidth={2}
                        dot={{
                          fill: "var(--color-quantitySold)",
                          r: 4,
                          strokeWidth: 2,
                          stroke: "hsl(var(--background))"
                        }}
                        activeDot={{
                           r: 6,
                           fill: "var(--color-quantitySold)",
                           stroke: "hsl(var(--background))",
                           strokeWidth: 2,
                        }}
                        name="الكمية المباعة"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                <p>لا توجد بيانات مبيعات لعرضها لهذا المنتج حتى الآن.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ListOrdered className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">سجل مبيعات المنتج</CardTitle>
            </div>
            <CardDescription>جميع عمليات البيع المسجلة لهذا المنتج.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-4">
            <SalesTable 
                sales={productSales} 
                showActions={true}
                onEditSaleTrigger={handleEditSaleTrigger}
                onDeleteSaleTrigger={handleDeleteSaleTrigger}
            />
          </CardContent>
        </Card>
      </main>

      {product && (
        <EditProductModal
          isOpen={isEditProductModalOpen}
          onClose={handleCloseEditProductModal}
          onSaveEdit={handleSaveEditedProduct}
          productToEdit={product}
        />
      )}

      {saleToEdit && product && (
        <EditSaleModal
          isOpen={isEditSaleModalOpen}
          onClose={() => {
            setIsEditSaleModalOpen(false);
            setSaleToEdit(null);
          }}
          onSaveEdit={handleSaveEditedSale}
          saleToEdit={saleToEdit}
          productForSale={product} // The current page's product
        />
      )}

      {saleToDelete && (
        <AlertDialog open={isDeleteSaleDialogOpen} onOpenChange={setIsDeleteSaleDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف البيع</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف عملية البيع للمنتج "{saleToDelete.productNameSnapshot}"؟ 
                سيتم إعادة الكمية المباعة ({saleToDelete.quantitySold.toLocaleString()}) إلى المخزون.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteSale} className={cn(buttonVariants({variant: "destructive"}))}>
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
