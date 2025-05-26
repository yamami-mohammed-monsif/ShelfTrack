
export type ProductType = 'powder' | 'liquid' | 'unit';

export interface Product {
  id: string; // uuid from Supabase
  name: string;
  type: ProductType;
  wholesalePrice: number;
  retailPrice: number;
  quantity: number;
  created_at: string; // ISO 8601 string from Supabase
  updated_at: string; // ISO 8601 string from Supabase
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
  id: string; // uuid from Supabase, for the sale_item record itself
  sale_id: string; // Foreign key to Sale
  product_id: string; // Foreign key to Product
  productNameSnapshot: string; // Snapshot of product name at time of sale
  quantitySold: number;
  wholesalePricePerUnitSnapshot: number;
  retailPricePerUnitSnapshot: number;
  itemTotalAmount: number; // Calculated: retailPricePerUnitSnapshot * quantitySold
  created_at: string; // ISO 8601 string from Supabase
  updated_at: string; // ISO 8601 string from Supabase
  // Client-side only, not in DB, for displaying in cart
  productType?: ProductType; 
}

// Represents the overall sale transaction (invoice/receipt)
export interface Sale {
  id: string; // uuid from Supabase, for the sale transaction
  sale_timestamp: string; // ISO 8601 string for the actual sale transaction time
  total_transaction_amount: number; // Sum of all itemTotalAmounts for this sale
  created_at: string; // ISO 8601 string from Supabase
  updated_at: string; // ISO 8601 string from Supabase
  items?: SaleItem[]; // Optional: if fetched/displayed together, not a DB column in 'sales'
}


// Form data for adding a single item to the current sale/cart
export interface AddToCartFormData {
  productId: string;
  quantitySold: number;
}

// Form data for the overall sale finalization (might just be timestamp if items are managed separately)
export interface FinalizeSaleFormData {
  saleTimestamp: string; // Expected format for datetime-local input: "YYYY-MM-DDTHH:mm"
  // items will be taken from the client-side cart state
}

export interface EditSaleFormData { // This will likely need rethinking for multi-item sales.
                                    // Editing might happen at item level or sale level (e.g. timestamp)
  quantitySold: number; // If editing a specific item
  saleTimestamp: string; // If editing the overall sale timestamp
}


export type SalesTimeframe = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface SalesDataPoint {
  date: string; // Could be day, week start, month start, etc.
  profit: number;
  loss: number; // Or 'revenue' and 'cost'
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number; 
  read: boolean;
  productId?: string; 
  href?: string;
  // For Supabase, timestamps would likely be strings (ISO 8601)
  // created_at?: string;
  // updated_at?: string;
}

export interface BackupLogEntry {
  id: string;
  timestamp: number; 
  periodStart: number;
  periodEnd: number;
  fileName: string;
  // For Supabase, timestamps would likely be strings (ISO 8601)
  // created_at?: string; 
}
