
import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductFormData, ProductType } from '@/lib/types';
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
    if (isLowStock(newProduct)) {
      createLowStockNotification(newProduct);
    }
    return newProduct;
  }, [createLowStockNotification]);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    const productBeforeUpdate = products.find(p => p.id === productId);
    
    if (!productBeforeUpdate) {
      console.warn(`Product with ID ${productId} not found for editing.`);
      return undefined;
    }

    let productAfterUpdateGlobal: Product | undefined;

    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        if (product.id === productId) {
          const updatedProductInstance = {
            ...product,
            ...updatedData,
            timestamp: Date.now(),
          };
          productAfterUpdateGlobal = updatedProductInstance; // Capture the updated instance
          return updatedProductInstance;
        }
        return product;
      });
    });
    
    if (productAfterUpdateGlobal) {
      const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
      const isNowLow = isLowStock(productAfterUpdateGlobal);
      if (isNowLow && !wasPreviouslyLow) {
        createLowStockNotification(productAfterUpdateGlobal);
      }
    }
    return productAfterUpdateGlobal;
  }, [products, createLowStockNotification]);

  const decreaseProductQuantity = useCallback((productId: string, quantityToDecrease: number): Product | undefined => {
    const productBeforeUpdate = products.find(p => p.id === productId);

    if (!productBeforeUpdate) {
      console.warn(`Product with ID ${productId} not found for decreasing quantity.`);
      return undefined;
    }

    let productAfterUpdateGlobal: Product | undefined;

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          const updatedProductInstance = {
            ...product,
            quantity: Math.max(0, product.quantity - quantityToDecrease),
            timestamp: Date.now(),
          };
          productAfterUpdateGlobal = updatedProductInstance; // Capture the updated instance
          return updatedProductInstance;
        }
        return product;
      })
    );

    if (productAfterUpdateGlobal) {
      const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
      const isNowLow = isLowStock(productAfterUpdateGlobal);
      if (isNowLow && !wasPreviouslyLow) {
        createLowStockNotification(productAfterUpdateGlobal);
      }
    }
    return productAfterUpdateGlobal;
  }, [products, createLowStockNotification]);

  const getProducts = useCallback((): Product[] => {
    return products;
  }, [products]);
  
  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  return { products, addProduct, editProduct, getProducts, decreaseProductQuantity, getProductById, isLoaded };
}
