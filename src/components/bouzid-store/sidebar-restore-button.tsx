
'use client';

import React, { useRef, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Upload, AlertTriangle } from 'lucide-react';
import { useProductsStorage, ProductActionTypes as ProductActions } from '@/hooks/use-products-storage';
import { useSalesStorage, SalesActionTypes as SalesActions } from '@/hooks/use-sales-storage';
import { useNotificationsStorage, NotificationActionTypes as NotificationActions } from '@/hooks/use-notifications-storage';
import { useToast } from '@/hooks/use-toast';
import type { Product, Sale, Notification } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface BackupData {
  products: Product[];
  sales: Sale[];
  notifications: Notification[];
  metadata?: {
    downloadedAt: string;
    periodStart?: string;
    periodEnd?: string;
    fileName?: string;
  };
}

export function SidebarRestoreButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const productsHook = useProductsStorage();
  const salesHook = useSalesStorage();
  const notificationsHook = useNotificationsStorage();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [parsedDataToRestore, setParsedDataToRestore] = useState<BackupData | null>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data: BackupData = JSON.parse(text);

        if (!data || !Array.isArray(data.products) || !Array.isArray(data.sales) || !Array.isArray(data.notifications)) {
          toast({
            variant: "destructive",
            title: "خطأ في استعادة البيانات",
            description: "ملف النسخ الاحتياطي غير صالح أو تالف.",
          });
          return;
        }
        
        setParsedDataToRestore(data);

        // Check if any current data exists
        const currentDataExists = productsHook.products.length > 0 || salesHook.sales.length > 0 || notificationsHook.notifications.length > 0;

        if (currentDataExists) {
          setIsConfirmDialogOpen(true);
        } else {
          // No existing data, proceed directly
          restoreData(data);
        }

      } catch (error) {
        console.error("Error processing backup file:", error);
        toast({
          variant: "destructive",
          title: "خطأ في استعادة البيانات",
          description: "لا يمكن قراءة أو معالجة ملف النسخ الاحتياطي. تأكد من أنه ملف JSON صالح.",
        });
      } finally {
        // Reset file input to allow selecting the same file again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const restoreData = (data: BackupData) => {
    // Dispatch SET_LOADED actions to replace existing data
    // The SET_LOADED actions in the hooks already handle updating memoryState and localStorage.
    // @ts-ignore
    productsHook.dispatch({ type: ProductActions.SET_LOADED, payload: data.products });
    // @ts-ignore
    salesHook.dispatchSales({ type: SalesActions.SET_LOADED, payload: data.sales });
    // @ts-ignore
    notificationsHook.dispatchNotification({ type: NotificationActions.SET_LOADED, payload: data.notifications });

    toast({
      title: "نجاح",
      description: "تم استعادة البيانات بنجاح!",
    });
  };

  const handleConfirmRestore = () => {
    if (parsedDataToRestore) {
      restoreData(parsedDataToRestore);
    }
    setIsConfirmDialogOpen(false);
    setParsedDataToRestore(null);
  };

  return (
    <>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="restore-file-input"
      />
      {/* This button is for the sidebar */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={triggerFileInput}
          tooltip={{ children: "استعادة البيانات", side: "left" }}
          aria-label="استعادة البيانات"
        >
          <Upload />
          <span>استعادة البيانات</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
            </div>
            <AlertDialogTitle className="text-center">تأكيد استعادة البيانات</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              هل أنت متأكد أنك تريد استعادة البيانات من هذا الملف؟ سيتم استبدال جميع المنتجات والمبيعات والإشعارات الحالية. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" onClick={() => {
              setIsConfirmDialogOpen(false);
              setParsedDataToRestore(null);
            }}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRestore} 
              className={cn("w-full sm:w-auto", buttonVariants({variant: "destructive"}))} // Use buttonVariants here
            >
              نعم، استبدل البيانات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper function to be callable from AppHeader for mobile menu
export const triggerRestoreFileInput = () => {
  const input = document.getElementById('restore-file-input') as HTMLInputElement | null;
  input?.click();
};
