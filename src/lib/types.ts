
export type ProductType = 'powder' | 'unit'; // Removed 'liquid'

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  wholesalePrice: number;
  retailPrice: number;
  quantity: number;
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
}

export interface ProductFormData {
  name: string;
  type: ProductType;
  wholesalePrice: number;
  retailPrice: number;
  quantity: number;
}

// Represents an individual item added to the cart client-side
export interface CartItem {
  tempId: string; // Temporary ID for client-side list management (e.g., removal)
  product_id: string;
  productNameSnapshot: string;
  quantitySold: number;
  wholesalePricePerUnitSnapshot: number; // For profit calculation
  retailPricePerUnitSnapshot: number; // Price at which it's sold
  itemTotalAmount: number; // Calculated: retailPricePerUnitSnapshot * quantitySold
  productType: ProductType; // To know if quantity can be fractional
  availableStock: number; // To validate against during cart adjustments if needed
}

// Represents an individual item within a finalized sale transaction (stored)
export interface SaleItem {
  id: string; // uuid for the sale_item record itself
  sale_id: string; // Foreign key to Sale transaction
  product_id: string;
  productNameSnapshot: string;
  quantitySold: number;
  wholesalePricePerUnitSnapshot: number;
  retailPricePerUnitSnapshot: number;
  itemTotalAmount: number; // Calculated: retailPricePerUnitSnapshot * quantitySold
  productType: ProductType; // Stored for easier display/logic if needed
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


// Form data for adding a single item to the current sale/cart
export interface AddToCartFormData {
  productId: string;
  quantity: number; // Renamed from quantitySold for clarity in this context
}

// This is no longer directly used by RecordSaleModal for its main operation
// but might be useful for other contexts if single item sales are re-introduced.
export interface SaleFormData {
  productId: string;
  quantitySold: number;
  saleTimestamp: string;
}


// Form data for finalizing a sale (currently only timestamp, items are from cart state)
export interface FinalizeSaleFormData {
  saleTimestamp: string;
}

// This will need to be re-thought for editing items within a transaction or the transaction itself.
export interface EditSaleFormData {
  quantitySold: number;
  saleTimestamp: string;
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
