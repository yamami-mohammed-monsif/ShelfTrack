
import type { Product, ProductType } from './types';

export const productTypeLabels: Record<ProductType, string> = {
  powder: 'مسحوق',
  liquid: 'سائل',
  unit: 'وحدة',
};

export const unitSuffix: Record<ProductType, string> = {
  powder: 'كجم',
  liquid: 'لتر',
  unit: 'قطعة',
};

export const lowStockThresholds: Record<ProductType, number> = {
  powder: 1, // Highlight if quantity is less than 1 kg
  liquid: 2, // Highlight if quantity is less than 2 liters
  unit: 3,   // Highlight if quantity is less than 3 items
};

/**
 * Checks if a product is currently low on stock based on its type and quantity.
 */
export const isLowStock = (product: Product): boolean => {
  if (!product || typeof product.quantity !== 'number' || !product.type) {
    return false;
  }
  const threshold = lowStockThresholds[product.type];
  return product.quantity < threshold;
};

/**
 * Checks if a product was low on stock based on its type and a previous quantity.
 */
export const wasLowStock = (productType: ProductType, prevQuantity: number): boolean => {
  if (typeof prevQuantity !== 'number' || !productType) {
    return false;
  }
  const threshold = lowStockThresholds[productType];
  return prevQuantity < threshold;
};
