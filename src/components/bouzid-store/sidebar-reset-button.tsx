
'use client';

import React, { useState } from 'react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
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
import { RotateCcw } from 'lucide-react';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useNotificationsStorage } from '@/hooks/use-notifications-storage';
import { useBackupLogStorage } from '@/hooks/use-backup-log-storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function SidebarResetButton() {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { clearAllProducts } = useProductsStorage();
  const { clearAllSales } = useSalesStorage();
  const { clearAllNotifications } = useNotificationsStorage();
  const { clearAllBackupLogs } = useBackupLogStorage();
  const { toast } = useToast();

  const handleResetAllData = () => {
    clearAllProducts();
    clearAllSales();
    clearAllNotifications();
    clearAllBackupLogs();
    toast({
      title: "نجاح",
      description: "تمت إعادة تعيين جميع بيانات التطبيق بنجاح.",
      variant: "default",
    });
    setIsResetDialogOpen(false);
  };

  return (
    <>
      <SidebarMenuItem>
        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <AlertDialogTrigger asChild>
            <SidebarMenuButton
              variant="ghost"
              className="text-sidebar-foreground hover:bg-red-500/10 hover:text-destructive w-full justify-start"
              tooltip={{ children: "إعادة تعيين البيانات", side: "left" }}
              aria-label="إعادة تعيين البيانات"
            >
              <RotateCcw className="text-destructive" />
              <span className="text-destructive">إعادة تعيين</span>
            </SidebarMenuButton>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد إعادة التعيين</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد إعادة تعيين جميع بيانات التطبيق؟ سيتم حذف جميع المنتجات والمبيعات والإشعارات وسجل النسخ بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsResetDialogOpen(false)}>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAllData} className={cn(buttonVariants({variant: "destructive"}))}>
                تأكيد وإعادة التعيين
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </>
  );
}
