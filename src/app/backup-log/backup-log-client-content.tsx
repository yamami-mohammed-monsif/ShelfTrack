
'use client';

import React, { useState, useEffect } from 'react';
import { useBackupLogStorage } from '@/hooks/use-backup-log-storage';
import type { BackupLogEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

export default function BackupLogClientContent() {
  const { backupLogs, isLoaded } = useBackupLogStorage();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || !isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* AppHeader is handled globally in layout.tsx */}
        <main className="flex-grow flex items-center justify-center">
          <p className="text-foreground text-xl">جار تحميل سجل النسخ...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* AppHeader is handled globally in layout.tsx */}
      <main className="flex-grow p-4 md:p-8">
        <Card className="shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="bg-card border-b">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <History className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">سجل النسخ الاحتياطي</CardTitle>
            </div>
            <CardDescription>
              عرض تاريخ عمليات تصدير البيانات. كل عملية تصدير تنشئ نسخة احتياطية لجميع البيانات الحالية.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-4">
            {backupLogs.length === 0 ? (
              <div className="text-center py-10 px-4 text-muted-foreground">
                <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg mb-2">لم يتم تسجيل أي عمليات نسخ احتياطي حتى الآن.</p>
                <p className="text-sm">يمكنك تصدير البيانات من الزر الموجود في الشريط العلوي.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption className="py-4">
                    سجل بجميع عمليات النسخ الاحتياطي للبيانات.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="rtl:text-right min-w-[180px]">تاريخ ووقت النسخ</TableHead>
                      <TableHead className="rtl:text-right min-w-[200px]">فترة النسخ</TableHead>
                      <TableHead className="rtl:text-right min-w-[250px]">اسم الملف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium rtl:text-right">
                          {format(new Date(log.timestamp), 'PPpp', { locale: arSA })}
                        </TableCell>
                        <TableCell className="rtl:text-right">
                          {format(new Date(log.periodStart), 'yyyy-MM-dd', { locale: arSA })} إلى {format(new Date(log.periodEnd), 'yyyy-MM-dd', { locale: arSA })}
                        </TableCell>
                        <TableCell className="rtl:text-right">{log.fileName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
