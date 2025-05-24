
'use client';

// This component is no longer used directly in page.tsx as of the latest update.
// The fixed footer buttons are now managed in src/app/page.tsx to accommodate multiple buttons.
// Keeping the file for now in case it's needed for other purposes or single-button footers.

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddProductButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ElementType;
  className?: string;
}

export function AddProductButton({ 
  onClick, 
  label = 'منتج جديد', 
  icon: Icon = Plus,
  className = "bg-primary hover:bg-primary/90 text-primary-foreground"
}: AddProductButtonProps) {
  return (
    <div className="fixed bottom-0 start-0 end-0 p-4 bg-background border-t border-border shadow-top z-40">
      <Button
        onClick={onClick}
        className={`w-full text-lg py-6 ${className}`}
        aria-label={label}
      >
        <Icon className="me-2 h-6 w-6" />
        {label}
      </Button>
    </div>
  );
}
