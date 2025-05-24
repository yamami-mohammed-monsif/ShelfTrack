
export type ProductType = 'powder' | 'liquid' | 'unit';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  wholesalePrice: number; // This is the purchase price per unit
  quantity: number;
  timestamp: number; // Unix timestamp (milliseconds) of last update/creation
}

export interface ProductFormData {
  name: string;
  type: ProductType;
  wholesalePrice: number;
  quantity: number;
}

export interface Sale {
  id:string;
  productId: string;
  productNameSnapshot: string; // Snapshot of product name at time of sale
  quantitySold: number;
  salePricePerUnit: number; // Price per unit at which it was sold (snapshot of product.wholesalePrice at sale time)
  totalSaleAmount: number;
  saleTimestamp: number; // Unix timestamp (milliseconds)
}

export interface SaleFormData {
  productId: string;
  quantitySold: number;
  saleTimestamp: string; // Expected format for datetime-local input: "YYYY-MM-DDTHH:mm"
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
  timestamp: number;
  read: boolean;
  productId?: string; // To link to a product for specific notifications like low stock
  href?: string; // Optional link for the notification (e.g., to product page)
}
