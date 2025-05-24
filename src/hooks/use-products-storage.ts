import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductFormData } from '@/lib/types';

const PRODUCTS_STORAGE_KEY = 'bouzid_store_products';

export function useProductsStorage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const addProduct = useCallback((productData: ProductFormData): Product => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setProducts((prevProducts) => [...prevProducts, newProduct]);
    return newProduct;
  }, []);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    let editedProduct: Product | undefined;
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          editedProduct = {
            ...product,
            ...updatedData,
            timestamp: Date.now(), // Update timestamp on edit
          };
          return editedProduct;
        }
        return product;
      })
    );
    return editedProduct;
  }, []);

  const getProducts = useCallback((): Product[] => {
    return products;
  }, [products]);

  return { products, addProduct, editProduct, getProducts, isLoaded };
}
