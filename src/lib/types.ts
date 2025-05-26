
export type ProductType = 'powder' | 'liquid' | 'unit';

export interface Product {
  id: string; // uuid from Supabase
  name: string;
  type: ProductType;
  wholesalePrice: number; // This is the purchase price per unit
  retailPrice: number;    // This is the selling price per unit
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

export interface Sale {
  id: string; // uuid from Supabase
  product_id: string; // Foreign key to Product
  productNameSnapshot: string; // Snapshot of product name at time of sale
  quantitySold: number;
  wholesalePricePerUnitSnapshot: number; // Snapshot of product wholesale price at sale time
  retailPricePerUnitSnapshot: number; // Snapshot of product retail price at sale time
  totalSaleAmount: number; // Calculated based on retailPricePerUnitSnapshot * quantitySold
  saleTimestamp: string; // ISO 8601 string for the actual sale time
  created_at: string; // ISO 8601 string from Supabase
  updated_at: string; // ISO 8601 string from Supabase
}

export interface SaleFormData {
  productId: string;
  quantitySold: number;
  saleTimestamp: string; // Expected format for datetime-local input: "YYYY-MM-DDTHH:mm"
}

export interface EditSaleFormData {
  quantitySold: number;
  saleTimestamp: string; // ISO string for datetime-local
}


export type SalesTimeframe = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface SalesDataPoint {
  date: string; // Could be day, week start, month start, etc.
  profit: number;
  loss: number;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number; // Unix timestamp (milliseconds) - Will likely change to string for Supabase
  read: boolean;
  productId?: string; // To link to a product for specific notifications like low stock
  href?: string; // Optional link for the notification (e.g., to product page)
}

export interface BackupLogEntry {
  id: string;
  timestamp: number; // When the backup was made
  periodStart: number; // Timestamp for the start of the backup period (e.g., start of the week)
  periodEnd: number;   // Timestamp for the end of the backup period (e.g., end of the week)
  fileName: string;
}
