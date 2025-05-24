'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddProductButtonProps {
  onClick: () => void;
}

export function AddProductButton({ onClick }: AddProductButtonProps) {
  return (
    <div className="fixed bottom-0 start-0 end-0 p-4 bg-background border-t border-border shadow-top z-40">
      <Button
        onClick={onClick}
        className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
        aria-label="إضافة منتج جديد"
      >
        <Plus className="me-2 h-6 w-6" />
        منتج جديد
      </Button>
    </div>
  );
}
