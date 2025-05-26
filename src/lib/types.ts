
export type ProductType = 'powder' | 'liquid' | 'unit';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  wholesalePrice: number;
  retailPrice: number;
  quantity: number;
  created_at: string; // ISO 8601 string from Supabase (or client-side Date.now())
  updated_at: string; // ISO 8601 string
}

export interface ProductFormData {
  name: string;
  type: ProductType;
  wholesalePrice: number;
  retailPrice: number;
  quantity: number;
}

// Represents an individual item within a sale transaction
export interface SaleItem {
  id: string; // uuid for the sale_item record itself
  sale_id: string; // Foreign key to Sale transaction
  product_id: string;
  productNameSnapshot: string;
  quantitySold: number;
  wholesalePricePerUnitSnapshot: number;
  retailPricePerUnitSnapshot: number;
  itemTotalAmount: number; // Calculated: retailPricePerUnitSnapshot * quantitySold
  // created_at and updated_at for SaleItem can be managed if needed,
  // but for localStorage, the parent Sale's timestamp might suffice for sorting/display.
  // For Supabase, these would be standard:
  // created_at: string;
  // updated_at: string;

  // Client-side only, not in DB, for displaying in cart if we build a cart UI
  productType?: ProductType;
}

// Represents the overall sale transaction (invoice/receipt)
export interface Sale {
  id: string; // uuid for the sale transaction
  sale_timestamp: number; // Unix timestamp (milliseconds) for the actual sale transaction time
  total_transaction_amount: number; // Sum of all itemTotalAmounts for this sale
  items: SaleItem[]; // Array of items in this transaction
  created_at: number; // Unix timestamp for when the sale record was created
  updated_at: number; // Unix timestamp for when the sale record was last updated
}


// Form data for adding a single item to the current sale/cart in a future cart UI
export interface AddToCartFormData {
  productId: string;
  quantitySold: number;
}

// Form data for the current single-item sale recording modal
export interface SaleFormData {
  productId: string;
  quantitySold: number;
  saleTimestamp: string; // Expected format for datetime-local input: "YYYY-MM-DDTHH:mm"
}


// Form data for finalizing a sale in a future cart UI
export interface FinalizeSaleFormData {
  saleTimestamp: string;
  // items will be taken from the client-side cart state
}

// This will need to be re-thought for editing items within a transaction or the transaction itself.
export interface EditSaleFormData {
  quantitySold: number; // If editing a specific item's quantity
  saleTimestamp: string; // If editing the overall sale timestamp
}


export type SalesTimeframe = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface SalesDataPoint {
  date: string;
  profit: number;
  loss: number;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
  productId?: string;
  href?: string;
}

export interface BackupLogEntry {
  id: string;
  timestamp: number;
  periodStart: number;
  periodEnd: number;
  fileName: string;
}
