
import React, { Suspense } from 'react';
import ProductsClientContent from './products-client-content';
// import { AppHeader } from '@/components/bouzid-store/app-header'; // No longer needed here

function ProductsLoadingFallback() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* <AppHeader /> Removed, handled globally */}
      <main className="flex-grow flex items-center justify-center">
        <p className="text-foreground text-xl">جار تحميل قائمة المنتجات...</p>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoadingFallback />}>
      <ProductsClientContent />
    </Suspense>
  );
}
