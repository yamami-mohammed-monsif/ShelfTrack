
'use client';

import React from 'react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button'; // Though not directly used, SidebarMenuButton might be styled like Button
import { Download } from 'lucide-react';
import { useProductsStorage } from '@/hooks/use-products-storage';
import { useSalesStorage } from '@/hooks/use-sales-storage';
import { useNotificationsStorage } from '@/hooks/use-notifications-storage';
import { useBackupLogStorage } from '@/hooks/use-backup-log-storage';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, format as formatDateFns } from 'date-fns';
import { arSA } from 'date-fns/locale';

export function SidebarExportButton() {
  const { products } = useProductsStorage();
  const { sales } = useSalesStorage();
  const { notifications } = useNotificationsStorage();
  const { addLogEntry: addBackupLogEntry } = useBackupLogStorage();
  const { toast } = useToast();

  const handleDownloadData = () => {
    const now = new Date();
    // Ensure week starts on Saturday for arSA locale if that's the desired behavior
    // date-fns's startOfWeek with arSA locale already considers Saturday as the start if configured.
    // Default is Monday for startOfWeek if locale doesn't specify. Forcing weekStartsOn: 6 (Saturday)
    const weekStart = startOfWeek(now, { locale: arSA, weekStartsOn: 6 }); 
    const weekEnd = endOfWeek(now, { locale: arSA, weekStartsOn: 6 });

    const formattedStartDate = formatDateFns(weekStart, 'yyyy-MM-dd');
    const formattedEndDate = formatDateFns(weekEnd, 'yyyy-MM-dd');
    const fileName = `data-backup_${formattedStartDate}_to_${formattedEndDate}.json`;

    const dataToBackup = {
      metadata: {
        downloadedAt: now.toISOString(),
        periodStart: weekStart.toISOString(),
        periodEnd: weekEnd.toISOString(),
        fileName: fileName,
      },
      products: products,
      sales: sales,
      notifications: notifications,
      // Note: backupLogs are not included in the backup itself to avoid recursive backup data.
    };

    const jsonString = JSON.stringify(dataToBackup, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addBackupLogEntry({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      periodStart: weekStart.getTime(),
      periodEnd: weekEnd.getTime(),
      fileName: fileName,
    });

    toast({
      title: "نجاح",
      description: `تم تصدير البيانات بنجاح إلى الملف: ${fileName}`,
      variant: "default",
    });
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        onClick={handleDownloadData} 
        tooltip={{ children: "تصدير البيانات", side: "left" }} 
        aria-label="تصدير البيانات"
      >
        <Download />
        <span>تصدير البيانات</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
