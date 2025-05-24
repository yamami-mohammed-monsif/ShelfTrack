
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
      } catch (error) {
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
      ...productData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setProducts((prevProducts) => [...prevProducts, newProduct]);
    
    // For newly added products, there's no "before" state of it being not low-stock.
    // We just check if it's low-stock upon creation.
    if (isLowStock(newProduct)) {
      createLowStockNotification(newProduct);
    }
    return newProduct;
  }, [createLowStockNotification]);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    let returnedProduct: Product | undefined;

    setProducts((currentProducts) => {
      const productBeforeUpdate = currentProducts.find(p => p.id === productId);
      let productAfterUpdate: Product | undefined;

      const newProducts = currentProducts.map((product) => {
        if (product.id === productId) {
          const updatedProductInstance = {
            ...product,
            ...updatedData,
            timestamp: Date.now(),
          };
          productAfterUpdate = updatedProductInstance; // Capture the state after update
          return updatedProductInstance;
        }
        return product;
      });

      // Perform check and notify from within the updater
      if (productAfterUpdate && productBeforeUpdate) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotification(productAfterUpdate);
        }
      }
      returnedProduct = productAfterUpdate; // Assign for return
      return newProducts;
    });
    
    return returnedProduct; // Returns the product state captured during this update cycle
  }, [createLowStockNotification]);

  const decreaseProductQuantity = useCallback((productId: string, quantityToDecrease: number): Product | undefined => {
    let returnedProduct: Product | undefined;

    setProducts((currentProducts) => {
      const productBeforeUpdate = currentProducts.find(p => p.id === productId);
      let productAfterUpdate: Product | undefined;

      const newProducts = currentProducts.map((product) => {
        if (product.id === productId) {
          const updatedProductInstance = {
            ...product,
            quantity: Math.max(0, product.quantity - quantityToDecrease),
            timestamp: Date.now(),
          };
          productAfterUpdate = updatedProductInstance; // Capture the state after update
          return updatedProductInstance;
        }
        return product;
      });

      // Perform check and notify from within the updater
      if (productAfterUpdate && productBeforeUpdate) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotification(productAfterUpdate);
        }
      }
      returnedProduct = productAfterUpdate; // Assign for return
      return newProducts;
    });

    return returnedProduct; // Returns the product state captured during this update cycle
  }, [createLowStockNotification]);

  const getProducts = useCallback((): Product[] => {
    return products;
  }, [products]);
  
  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  return { products, addProduct, editProduct, getProducts, decreaseProductQuantity, getProductById, isLoaded };
}
