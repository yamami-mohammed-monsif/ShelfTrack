
import React, { Suspense } from 'react';
import BackupLogClientContent from './backup-log-client-content';

function BackupLogLoadingFallback() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* AppHeader is handled globally in layout.tsx */}
      <main className="flex-grow flex items-center justify-center">
        <p className="text-foreground text-xl">جار تحميل سجل النسخ...</p>
      </main>
    </div>
  );
}

export default function BackupLogPage() {
  return (
    <Suspense fallback={<BackupLogLoadingFallback />}>
      <BackupLogClientContent />
    </Suspense>
  );
}
