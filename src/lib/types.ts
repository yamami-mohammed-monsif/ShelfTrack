export type ProductType = 'powder' | 'liquid' | 'unit';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  wholesalePrice: number;
  quantity: number;
  timestamp: number; // Unix timestamp (milliseconds)
}

export interface ProductFormData {
  name: string;
  type: ProductType;
  wholesalePrice: number;
  quantity: number;
}

export type SalesTimeframe = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface SalesDataPoint {
  date: string; // Could be day, week start, month start, etc.
  profit: number;
  loss: number;
}
