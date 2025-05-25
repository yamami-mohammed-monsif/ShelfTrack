
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductFormData, ProductType } from '@/lib/types';
import { useNotificationsStorage } from './use-notifications-storage';
import { isLowStock, wasLowStock, unitSuffix } from '@/lib/product-utils';

const PRODUCTS_STORAGE_KEY = 'bouzid_store_products';

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
  currentProducts: Product[], // Changed from state to currentProducts array
  action: ProductAction,
  createLowStockNotificationFn?: (product: Product) => void
): Product[] { // Returns the new products array
  switch (action.type) {
    case ProductActionTypes.SET_LOADED:
      return action.payload.sort((a, b) => b.timestamp - a.timestamp);
    case ProductActionTypes.ADD: {
      const { newProduct } = action.payload;
      if (isLowStock(newProduct) && createLowStockNotificationFn) {
        createLowStockNotificationFn(newProduct);
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

      if (productAfterUpdate && productBeforeUpdate && createLowStockNotificationFn) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotificationFn(productAfterUpdate);
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
      
      if (productAfterUpdate && productBeforeUpdate && createLowStockNotificationFn) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotificationFn(productAfterUpdate);
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
      return currentProducts.filter(p => p.id !== action.payload.productId);
    case ProductActionTypes.CLEAR_ALL:
      return [];
    default:
      return currentProducts;
  }
}

function dispatch(action: ProductAction, addNotificationFn?: (message: string, productId?: string, href?: string) => void, deleteNotificationsByProductIdFn?: (productId: string) => void) {
  
  const createLowStockNotificationForReducer = addNotificationFn 
    ? (product: Product) => {
        const message = `"${product.name}" أوشك على النفاد. الكمية المتبقية: ${product.quantity.toLocaleString()} ${unitSuffix[product.type]}.`;
        addNotificationFn(message, product.id, `/products/${product.id}`);
      }
    : undefined;

  memoryState = {
    ...memoryState,
    products: productsReducer(memoryState.products, action, createLowStockNotificationForReducer),
  };
  
  if (action.type === ProductActionTypes.DELETE && deleteNotificationsByProductIdFn) {
    deleteNotificationsByProductIdFn(action.payload.productId);
  }
  
  // Ensure isLoaded is true after initial load or any modification
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
  const { addNotification, deleteNotificationsByProductId } = useNotificationsStorage();

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
      // Pass addNotification and deleteNotificationsByProductId for use in dispatch
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
    dispatch({ type: ProductActionTypes.ADD, payload: { newProduct } }, addNotification, deleteNotificationsByProductId);
    return newProduct;
  }, [addNotification, deleteNotificationsByProductId]);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    dispatch({ type: ProductActionTypes.EDIT, payload: { productId, updatedData } }, addNotification, deleteNotificationsByProductId);
    return memoryState.products.find(p => p.id === productId);
  }, [addNotification, deleteNotificationsByProductId]);

  const decreaseProductQuantity = useCallback((productId: string, quantityToDecrease: number): Product | undefined => {
    dispatch({ type: ProductActionTypes.DECREASE_QUANTITY, payload: { productId, quantityToDecrease } }, addNotification, deleteNotificationsByProductId);
    return memoryState.products.find(p => p.id === productId);
  }, [addNotification, deleteNotificationsByProductId]);

  const increaseProductQuantity = useCallback((productId: string, quantityToIncrease: number): Product | undefined => {
    dispatch({ type: ProductActionTypes.INCREASE_QUANTITY, payload: { productId, quantityToIncrease } }, addNotification, deleteNotificationsByProductId);
    return memoryState.products.find(p => p.id === productId);
  }, [addNotification, deleteNotificationsByProductId]);

  const deleteProduct = useCallback((productId: string) => {
    dispatch({ type: ProductActionTypes.DELETE, payload: { productId } }, addNotification, deleteNotificationsByProductId);
  }, [addNotification, deleteNotificationsByProductId]);
  
  const getProductById = useCallback((productId: string): Product | undefined => {
    return state.products.find(p => p.id === productId);
  }, [state.products]);

  const clearAllProducts = useCallback(() => {
    dispatch({ type: ProductActionTypes.CLEAR_ALL }, addNotification, deleteNotificationsByProductId);
  }, [addNotification, deleteNotificationsByProductId]);
  
  const productsDispatch = useCallback((action: ProductAction) => {
     dispatch(action, addNotification, deleteNotificationsByProductId);
  },[addNotification, deleteNotificationsByProductId]);


  return { 
    products: state.products, 
    addProduct, 
    editProduct, 
    decreaseProductQuantity,
    increaseProductQuantity, 
    getProductById, 
    deleteProduct,
    clearAllProducts,
    dispatch: productsDispatch, // Expose dispatch for direct use like SET_LOADED
    isLoaded: state.isLoaded 
  };
}

