
import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductFormData } from '@/lib/types';
import { useNotificationsStorage } from './use-notifications-storage';
import { isLowStock, wasLowStock, unitSuffix } from '@/lib/product-utils';

const PRODUCTS_STORAGE_KEY = 'bouzid_store_products';

export function useProductsStorage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addNotification } = useNotificationsStorage();

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    } catch (error) {
      console.error("Failed to load products from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      } catch (error)        {
        console.error("Failed to save products to localStorage:", error);
      }
    }
  }, [products, isLoaded]);

  const createLowStockNotification = useCallback((product: Product) => {
    const message = `"${product.name}" أوشك على النفاد. الكمية المتبقية: ${product.quantity.toLocaleString()} ${unitSuffix[product.type]}.`;
    addNotification(message, product.id, `/products/${product.id}`);
  }, [addNotification]);

  const addProduct = useCallback((productData: ProductFormData): Product => {
    const newProduct: Product = {
      ...productData, // wholesalePrice and retailPrice are included here
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    let productToReturn: Product | undefined;

    setProducts((currentProducts) => {
      const updatedProducts = [...currentProducts, newProduct];
      productToReturn = newProduct;

      if (isLowStock(newProduct)) {
        createLowStockNotification(newProduct);
      }
      return updatedProducts;
    });
    return productToReturn!;
  }, [createLowStockNotification]);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    let productToReturn: Product | undefined;

    setProducts((currentProducts) => {
      const productBeforeUpdate = currentProducts.find(p => p.id === productId);
      let productAfterUpdate: Product | undefined;

      const newProducts = currentProducts.map((product) => {
        if (product.id === productId) {
          productAfterUpdate = {
            ...product,
            ...updatedData, // wholesalePrice and retailPrice are updated here
            timestamp: Date.now(),
          };
          return productAfterUpdate;
        }
        return product;
      });

      if (productAfterUpdate && productBeforeUpdate) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotification(productAfterUpdate);
        }
      }
      productToReturn = productAfterUpdate;
      return newProducts;
    });
    return productToReturn;
  }, [createLowStockNotification]);

  const decreaseProductQuantity = useCallback((productId: string, quantityToDecrease: number): Product | undefined => {
    let productToReturn: Product | undefined;
    setProducts((currentProducts) => {
      const productBeforeUpdate = currentProducts.find(p => p.id === productId);
      let productAfterUpdate: Product | undefined;

      const newProducts = currentProducts.map((product) => {
        if (product.id === productId) {
          productAfterUpdate = {
            ...product,
            quantity: Math.max(0, product.quantity - quantityToDecrease),
            timestamp: Date.now(),
          };
          return productAfterUpdate;
        }
        return product;
      });

      if (productAfterUpdate && productBeforeUpdate) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotification(productAfterUpdate);
        }
      }
      productToReturn = productAfterUpdate;
      return newProducts;
    });
    return productToReturn;
  }, [createLowStockNotification]);

  const getProducts = useCallback((): Product[] => {
    return products;
  }, [products]);
  
  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  const clearAllProducts = useCallback(() => {
    setProducts([]);
    try {
      localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove products from localStorage:", error);
    }
  }, []);

  return { products, addProduct, editProduct, getProducts, decreaseProductQuantity, getProductById, clearAllProducts, isLoaded };
}
