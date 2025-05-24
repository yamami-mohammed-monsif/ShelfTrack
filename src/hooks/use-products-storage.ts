
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

  const createLowStockNotification = (product: Product) => {
    const message = `"${product.name}" أوشك على النفاد. الكمية المتبقية: ${product.quantity.toLocaleString()} ${unitSuffix[product.type]}.`;
    addNotification(message, product.id, `/products/${product.id}`);
  };

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
  }, [addNotification]);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    let originalProduct: Product | undefined;
    let editedProduct: Product | undefined;

    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        if (product.id === productId) {
          originalProduct = { ...product }; // Capture state before edit
          editedProduct = {
            ...product,
            ...updatedData,
            timestamp: Date.now(),
          };
          return editedProduct;
        }
        return product;
      });
    });
    
    if (originalProduct && editedProduct) {
      const wasPreviouslyLow = wasLowStock(originalProduct.type, originalProduct.quantity);
      const isNowLow = isLowStock(editedProduct);
      if (isNowLow && !wasPreviouslyLow) {
        createLowStockNotification(editedProduct);
      }
    }
    return editedProduct;
  }, [addNotification]);

  const decreaseProductQuantity = useCallback((productId: string, quantityToDecrease: number): Product | undefined => {
    let originalProduct: Product | undefined;
    let updatedProduct: Product | undefined;

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          originalProduct = { ...product };
          updatedProduct = {
            ...product,
            quantity: Math.max(0, product.quantity - quantityToDecrease),
            timestamp: Date.now(),
          };
          return updatedProduct;
        }
        return product;
      })
    );

    if (originalProduct && updatedProduct) {
      const wasPreviouslyLow = wasLowStock(originalProduct.type, originalProduct.quantity);
      const isNowLow = isLowStock(updatedProduct);
      if (isNowLow && !wasPreviouslyLow) {
        createLowStockNotification(updatedProduct);
      }
    }
    return updatedProduct;
  }, [addNotification]);

  const getProducts = useCallback((): Product[] => {
    return products;
  }, [products]);
  
  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  return { products, addProduct, editProduct, getProducts, decreaseProductQuantity, getProductById, isLoaded };
}
