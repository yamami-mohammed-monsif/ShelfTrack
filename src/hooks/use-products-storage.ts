
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductFormData } from '@/lib/types';
import { useNotificationsStorage, NotificationActionTypes } from './use-notifications-storage';
import { isLowStock, wasLowStock, unitSuffix } from '@/lib/product-utils';

const PRODUCTS_STORAGE_KEY = 'shelftrack_products';

interface ProductsState {
  products: Product[];
  isLoaded: boolean;
}

let memoryState: ProductsState = {
  products: [],
  isLoaded: false,
};

const listeners: Array<(state: ProductsState) => void> = [];

export const ProductActionTypes = {
  SET_LOADED: 'SET_LOADED_PRODUCTS',
  ADD: 'ADD_PRODUCT',
  EDIT: 'EDIT_PRODUCT',
  DECREASE_QUANTITY: 'DECREASE_PRODUCT_QUANTITY',
  INCREASE_QUANTITY: 'INCREASE_PRODUCT_QUANTITY',
  DELETE: 'DELETE_PRODUCT',
  CLEAR_ALL: 'CLEAR_ALL_PRODUCTS',
} as const;

type ProductAction =
  | { type: typeof ProductActionTypes.SET_LOADED; payload: Product[] }
  | { type: typeof ProductActionTypes.ADD; payload: { newProduct: Product } }
  | { type: typeof ProductActionTypes.EDIT; payload: { productId: string; updatedData: ProductFormData } }
  | { type: typeof ProductActionTypes.DECREASE_QUANTITY; payload: { productId: string; quantityToDecrease: number } }
  | { type: typeof ProductActionTypes.INCREASE_QUANTITY; payload: { productId: string; quantityToIncrease: number } }
  | { type: typeof ProductActionTypes.DELETE; payload: { productId: string } }
  | { type: typeof ProductActionTypes.CLEAR_ALL };

function productsReducer(
  currentProducts: Product[],
  action: ProductAction,
  addNotificationFn?: (message: string, productId?: string, href?: string) => void,
  deleteNotificationsByProductIdFn?: (productId: string) => void
): Product[] {
  switch (action.type) {
    case ProductActionTypes.SET_LOADED:
      return action.payload.sort((a, b) => b.timestamp - a.timestamp);
    case ProductActionTypes.ADD: {
      const { newProduct } = action.payload;
      if (isLowStock(newProduct) && addNotificationFn) {
        const message = `"${newProduct.name}" أوشك على النفاد. الكمية المتبقية: ${newProduct.quantity.toLocaleString()} ${unitSuffix[newProduct.type]}.`;
        addNotificationFn(message, newProduct.id, `/products/${newProduct.id}`);
      }
      return [newProduct, ...currentProducts].sort((a, b) => b.timestamp - a.timestamp);
    }
    case ProductActionTypes.EDIT: {
      const productBeforeUpdate = currentProducts.find(p => p.id === action.payload.productId);
      let productAfterUpdate: Product | undefined;
      
      const newProducts = currentProducts.map((product) => {
        if (product.id === action.payload.productId) {
          productAfterUpdate = {
            ...product,
            ...action.payload.updatedData,
            timestamp: Date.now(),
          };
          return productAfterUpdate;
        }
        return product;
      });

      if (productAfterUpdate && productBeforeUpdate && addNotificationFn) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          const message = `"${productAfterUpdate.name}" أوشك على النفاد. الكمية المتبقية: ${productAfterUpdate.quantity.toLocaleString()} ${unitSuffix[productAfterUpdate.type]}.`;
          addNotificationFn(message, productAfterUpdate.id, `/products/${productAfterUpdate.id}`);
        }
      }
      return newProducts.sort((a, b) => b.timestamp - a.timestamp);
    }
    case ProductActionTypes.DECREASE_QUANTITY: {
      const productBeforeUpdate = currentProducts.find(p => p.id === action.payload.productId);
      let productAfterUpdate: Product | undefined;

      const newProducts = currentProducts.map((product) => {
        if (product.id === action.payload.productId) {
          productAfterUpdate = {
            ...product,
            quantity: Math.max(0, product.quantity - action.payload.quantityToDecrease),
            timestamp: Date.now(),
          };
          return productAfterUpdate;
        }
        return product;
      });
      
      if (productAfterUpdate && productBeforeUpdate && addNotificationFn) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
           const message = `"${productAfterUpdate.name}" أوشك على النفاد. الكمية المتبقية: ${productAfterUpdate.quantity.toLocaleString()} ${unitSuffix[productAfterUpdate.type]}.`;
           addNotificationFn(message, productAfterUpdate.id, `/products/${productAfterUpdate.id}`);
        }
      }
      return newProducts.sort((a, b) => b.timestamp - a.timestamp);
    }
     case ProductActionTypes.INCREASE_QUANTITY: {
      const newProducts = currentProducts.map((product) => {
        if (product.id === action.payload.productId) {
          return {
            ...product,
            quantity: product.quantity + action.payload.quantityToIncrease,
            timestamp: Date.now(),
          };
        }
        return product;
      });
      return newProducts.sort((a, b) => b.timestamp - a.timestamp);
    }
    case ProductActionTypes.DELETE:
      if (deleteNotificationsByProductIdFn) {
        deleteNotificationsByProductIdFn(action.payload.productId);
      }
      return currentProducts.filter(p => p.id !== action.payload.productId);
    case ProductActionTypes.CLEAR_ALL:
      return [];
    default:
      return currentProducts;
  }
}

function dispatch(action: ProductAction, addNotificationFn?: (message: string, productId?: string, href?: string) => void, deleteNotificationsByProductIdFn?: (productId: string) => void) {
  memoryState = {
    ...memoryState,
    products: productsReducer(memoryState.products, action, addNotificationFn, deleteNotificationsByProductIdFn),
  };
  
  if (action.type === ProductActionTypes.SET_LOADED) {
    memoryState.isLoaded = true;
  }

  if (memoryState.isLoaded) {
    try {
      if (action.type === ProductActionTypes.CLEAR_ALL) {
        localStorage.removeItem(PRODUCTS_STORAGE_KEY);
      } else {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(memoryState.products));
      }
    } catch (error) {
      console.error("Failed to update products in localStorage:", error);
    }
  }
  queueMicrotask(() => {
    listeners.forEach((listener) => listener(memoryState));
  });
}

export function useProductsStorage() {
  const [state, setState] = useState<ProductsState>(memoryState);
  const { addNotification, deleteNotificationsByProductId, dispatchNotification } = useNotificationsStorage();

  const createLowStockNotification = useCallback((product: Product) => {
    const message = `"${product.name}" أوشك على النفاد. الكمية المتبقية: ${product.quantity.toLocaleString()} ${unitSuffix[product.type]}.`;
    addNotification(message, product.id, `/products/${product.id}`);
  }, [addNotification]);

  useEffect(() => {
    if (!memoryState.isLoaded) {
      let initialProducts: Product[] = [];
      try {
        const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (storedProducts) {
          initialProducts = JSON.parse(storedProducts);
        }
      } catch (error) {
        console.error("Failed to load products from localStorage:", error);
      }
      dispatch({ type: ProductActionTypes.SET_LOADED, payload: initialProducts }, addNotification, deleteNotificationsByProductId);
    }
    
    const listener = (newState: ProductsState) => setState(newState);
    listeners.push(listener);

    if (memoryState.isLoaded && !state.isLoaded) {
        setState(memoryState);
    }

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state.isLoaded, addNotification, deleteNotificationsByProductId]); 

  const addProduct = useCallback((productData: ProductFormData): Product | null => {
    const existingProduct = memoryState.products.find(
      p => p.name.toLowerCase() === productData.name.toLowerCase() && p.type === productData.type
    );

    if (existingProduct) {
      return null; 
    }
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    dispatch({ type: ProductActionTypes.ADD, payload: { newProduct } }, createLowStockNotification);
    return newProduct;
  }, [createLowStockNotification]);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    dispatch({ type: ProductActionTypes.EDIT, payload: { productId, updatedData } }, createLowStockNotification);
    return memoryState.products.find(p => p.id === productId);
  }, [createLowStockNotification]);

  const decreaseProductQuantity = useCallback((productId: string, quantityToDecrease: number): Product | undefined => {
    dispatch({ type: ProductActionTypes.DECREASE_QUANTITY, payload: { productId, quantityToDecrease } }, createLowStockNotification);
    return memoryState.products.find(p => p.id === productId);
  }, [createLowStockNotification]);

  const increaseProductQuantity = useCallback((productId: string, quantityToIncrease: number): Product | undefined => {
    dispatch({ type: ProductActionTypes.INCREASE_QUANTITY, payload: { productId, quantityToIncrease } }, createLowStockNotification);
    return memoryState.products.find(p => p.id === productId);
  }, [createLowStockNotification]);

  const deleteProduct = useCallback((productId: string) => {
    dispatch({ type: ProductActionTypes.DELETE, payload: { productId } }, undefined, deleteNotificationsByProductId);
  }, [deleteNotificationsByProductId]);
  
  const getProductById = useCallback((productId: string): Product | undefined => {
    return state.products.find(p => p.id === productId);
  }, [state.products]);

  const clearAllProducts = useCallback(() => {
    dispatch({ type: ProductActionTypes.CLEAR_ALL });
    // Optionally, also clear all product-related notifications if desired
    // This depends on how you want reset to behave regarding notifications
  }, []);
  
  const productsDispatch = useCallback((action: ProductAction) => {
     dispatch(action, createLowStockNotification, deleteNotificationsByProductId);
  },[createLowStockNotification, deleteNotificationsByProductId]);

  return { 
    products: state.products, 
    addProduct, 
    editProduct, 
    decreaseProductQuantity,
    increaseProductQuantity, 
    getProductById, 
    deleteProduct,
    clearAllProducts,
    dispatch: productsDispatch, 
    isLoaded: state.isLoaded 
  };
}
