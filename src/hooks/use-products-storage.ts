
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductFormData, ProductType } from '@/lib/types';
import { useNotificationsStorage, NotificationActionTypes } from './use-notifications-storage';
import { isLowStock, wasLowStock, unitSuffix, productTypeLabels } from '@/lib/product-utils';

const PRODUCTS_STORAGE_KEY = 'shelftrack_products';

interface ProductsState {
  products: Product[];
  isLoaded: boolean;
}

// --- Module-level shared state and logic ---
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
  addNotificationFn?: (product: Product) => void,
  deleteNotificationsByProductIdFn?: (productId: string) => void
): Product[] {
  switch (action.type) {
    case ProductActionTypes.SET_LOADED:
      return action.payload
        .map(p => ({ // Sanitize loaded products
          ...p,
          name: p.name || 'Unknown Product',
          type: p.type || 'unit', // Default to 'unit' if type is missing
          quantity: typeof p.quantity === 'number' ? p.quantity : 0,
          wholesalePrice: typeof p.wholesalePrice === 'number' ? p.wholesalePrice : 0,
          retailPrice: typeof p.retailPrice === 'number' ? p.retailPrice : 0,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        }))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    case ProductActionTypes.ADD: {
      const { newProduct } = action.payload;
      const productsWithNew = [newProduct, ...currentProducts];
      if (addNotificationFn && isLowStock(newProduct)) {
        addNotificationFn(newProduct);
      }
      return productsWithNew.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    case ProductActionTypes.EDIT: {
      const productBeforeUpdate = currentProducts.find(p => p.id === action.payload.productId);
      let productAfterUpdate: Product | undefined;
      
      const newProducts = currentProducts.map((product) => {
        if (product.id === action.payload.productId) {
          productAfterUpdate = {
            ...product,
            ...action.payload.updatedData,
            updated_at: new Date().toISOString(),
          };
          return productAfterUpdate;
        }
        return product;
      });

      if (productAfterUpdate && productBeforeUpdate && addNotificationFn) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          addNotificationFn(productAfterUpdate);
        }
      }
      return newProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    case ProductActionTypes.DECREASE_QUANTITY: {
      const productBeforeUpdate = currentProducts.find(p => p.id === action.payload.productId);
      let productAfterUpdate: Product | undefined;

      const newProducts = currentProducts.map((product) => {
        if (product.id === action.payload.productId) {
          const currentQuantity = typeof product.quantity === 'number' ? product.quantity : 0;
          const decreasedQuantity = Math.max(0, currentQuantity - action.payload.quantityToDecrease);
          productAfterUpdate = {
            ...product,
            quantity: decreasedQuantity,
            updated_at: new Date().toISOString(),
          };
          return productAfterUpdate;
        }
        return product;
      });
      
      if (productAfterUpdate && productBeforeUpdate && addNotificationFn) {
        // Ensure productAfterUpdate has valid type for wasLowStock/isLowStock comparison
        const validProductAfterUpdate = {
            ...productAfterUpdate,
            type: productAfterUpdate.type || productBeforeUpdate.type || 'unit' // Fallback if type is somehow missing
        };

        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(validProductAfterUpdate); 

        if (isNowLow && !wasPreviouslyLow) {
           addNotificationFn(validProductAfterUpdate);
        }
      }
      return newProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
     case ProductActionTypes.INCREASE_QUANTITY: {
      const newProducts = currentProducts.map((product) => {
        if (product.id === action.payload.productId) {
          return {
            ...product,
            quantity: (typeof product.quantity === 'number' ? product.quantity : 0) + action.payload.quantityToIncrease,
            updated_at: new Date().toISOString(),
          };
        }
        return product;
      });
      return newProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
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

function dispatch(
  action: ProductAction,
  addNotificationFn?: (product: Product) => void,
  deleteNotificationsByProductIdFn?: (productId: string) => void
) {
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
// --- End of Module-level shared state and logic ---


export function useProductsStorage() {
  const [state, setState] = useState<ProductsState>(memoryState);
  const { addNotification, deleteNotificationsByProductId } = useNotificationsStorage();


  const createLowStockNotification = useCallback((product: Product) => {
    // Guard against missing essential data before creating notification message
    if (typeof product.quantity !== 'number' || !product.type || !(product.type in unitSuffix) || !product.name) {
      console.error("Skipping low stock notification due to incomplete product data:", product);
      return;
    }
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
        initialProducts = []; // Ensure it's an array on error
      }
      dispatch({ type: ProductActionTypes.SET_LOADED, payload: initialProducts }, createLowStockNotification, deleteNotificationsByProductId);
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
  }, [state.isLoaded, createLowStockNotification, deleteNotificationsByProductId]); 

  const addProduct = useCallback((productData: ProductFormData): Product | null => {
    const existingProduct = memoryState.products.find(
      p => p.name.toLowerCase() === productData.name.toLowerCase() && p.type === productData.type
    );

    if (existingProduct) {
      return null; 
    }
    const nowISO = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      created_at: nowISO,
      updated_at: nowISO,
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
    // Ensure the products from state are also sanitized, though SET_LOADED should handle initial load
    return state.products.find(p => p.id === productId && typeof p.quantity === 'number');
  }, [state.products]);

  const clearAllProducts = useCallback(() => {
    dispatch({ type: ProductActionTypes.CLEAR_ALL });
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

    