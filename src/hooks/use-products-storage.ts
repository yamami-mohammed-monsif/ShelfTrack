
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, ProductFormData } from '@/lib/types';
import { useNotificationsStorage } from './use-notifications-storage';
import { isLowStock, wasLowStock, unitSuffix } from '@/lib/product-utils';

const PRODUCTS_STORAGE_KEY = 'bouzid_store_products';

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

const ProductActionTypes = {
  SET_LOADED: 'SET_LOADED_PRODUCTS',
  ADD: 'ADD_PRODUCT',
  EDIT: 'EDIT_PRODUCT',
  DECREASE_QUANTITY: 'DECREASE_PRODUCT_QUANTITY',
  DELETE: 'DELETE_PRODUCT',
  CLEAR_ALL: 'CLEAR_ALL_PRODUCTS',
} as const;

type ProductAction =
  | { type: typeof ProductActionTypes.SET_LOADED; payload: Product[] }
  | { type: typeof ProductActionTypes.ADD; payload: { newProduct: Product } }
  | { type: typeof ProductActionTypes.EDIT; payload: { productId: string; updatedData: ProductFormData } }
  | { type: typeof ProductActionTypes.DECREASE_QUANTITY; payload: { productId: string; quantityToDecrease: number } }
  | { type: typeof ProductActionTypes.DELETE; payload: { productId: string } }
  | { type: typeof ProductActionTypes.CLEAR_ALL };

// This function will be defined outside the hook and passed to dispatch
// It needs access to `addNotification` from `useNotificationsStorage`
// We'll pass `createLowStockNotificationImpl` to dispatch for actions that might trigger it.
const createLowStockNotificationCallback = (
  product: Product,
  addNotification: (message: string, productId?: string, href?: string) => void
) => {
  const message = `"${product.name}" أوشك على النفاد. الكمية المتبقية: ${product.quantity.toLocaleString()} ${unitSuffix[product.type]}.`;
  addNotification(message, product.id, `/products/${product.id}`);
};


function productsReducer(
  state: ProductsState,
  action: ProductAction,
  // Pass the actual addNotification function for use inside the reducer for relevant actions
  createLowStockNotificationFn?: (product: Product) => void
): ProductsState {
  switch (action.type) {
    case ProductActionTypes.SET_LOADED:
      return {
        products: action.payload.sort((a, b) => b.timestamp - a.timestamp),
        isLoaded: true,
      };
    case ProductActionTypes.ADD: {
      const { newProduct } = action.payload;
      const updatedProducts = [newProduct, ...state.products].sort((a, b) => b.timestamp - a.timestamp);
      if (isLowStock(newProduct) && createLowStockNotificationFn) {
        createLowStockNotificationFn(newProduct);
      }
      return { ...state, products: updatedProducts };
    }
    case ProductActionTypes.EDIT: {
      let productAfterUpdate: Product | undefined;
      const productBeforeUpdate = state.products.find(p => p.id === action.payload.productId);
      
      const newProducts = state.products.map((product) => {
        if (product.id === action.payload.productId) {
          productAfterUpdate = {
            ...product,
            ...action.payload.updatedData,
            timestamp: Date.now(),
          };
          return productAfterUpdate;
        }
        return product;
      }).sort((a, b) => b.timestamp - a.timestamp);

      if (productAfterUpdate && productBeforeUpdate && createLowStockNotificationFn) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotificationFn(productAfterUpdate);
        }
      }
      return { ...state, products: newProducts };
    }
    case ProductActionTypes.DECREASE_QUANTITY: {
      let productAfterUpdate: Product | undefined;
      const productBeforeUpdate = state.products.find(p => p.id === action.payload.productId);

      const newProducts = state.products.map((product) => {
        if (product.id === action.payload.productId) {
          productAfterUpdate = {
            ...product,
            quantity: Math.max(0, product.quantity - action.payload.quantityToDecrease),
            timestamp: Date.now(),
          };
          return productAfterUpdate;
        }
        return product;
      }).sort((a, b) => b.timestamp - a.timestamp);
      
      if (productAfterUpdate && productBeforeUpdate && createLowStockNotificationFn) {
        const wasPreviouslyLow = wasLowStock(productBeforeUpdate.type, productBeforeUpdate.quantity);
        const isNowLow = isLowStock(productAfterUpdate);
        if (isNowLow && !wasPreviouslyLow) {
          createLowStockNotificationFn(productAfterUpdate);
        }
      }
      return { ...state, products: newProducts };
    }
    case ProductActionTypes.DELETE:
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload.productId),
      };
    case ProductActionTypes.CLEAR_ALL:
      return {
        products: [],
        isLoaded: state.isLoaded,
      };
    default:
      return state;
  }
}

// addNotificationFn will be bound to the specific instance of useNotificationsStorage().addNotification
function dispatch(action: ProductAction, addNotificationFn?: (message: string, productId?: string, href?: string) => void, deleteNotificationsByProductIdFn?: (productId: string) => void) {
  const createLowStockNotificationForReducer = addNotificationFn 
    ? (product: Product) => createLowStockNotificationCallback(product, addNotificationFn)
    : undefined;

  memoryState = productsReducer(memoryState, action, createLowStockNotificationForReducer);
  
  if (action.type === ProductActionTypes.DELETE && deleteNotificationsByProductIdFn) {
    deleteNotificationsByProductIdFn(action.payload.productId);
  }
  if (action.type === ProductActionTypes.CLEAR_ALL && deleteNotificationsByProductIdFn) {
    // This is tricky, if we clear all products, we should ideally clear all product-related notifications
    // For now, let's assume this implies clearing all notifications, handled by the AppHeader's reset.
    // If more granular control is needed, this would need adjustment.
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
      // Pass addNotification here for initial load checks if any product is already low stock
      // However, notifications for existing low-stock items on load might be too noisy.
      // Typically, notifications are for *changes*. Let's omit createLowStock for SET_LOADED.
      dispatch({ type: ProductActionTypes.SET_LOADED, payload: initialProducts });
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
  }, [state.isLoaded]); // addNotification, deleteNotificationsByProductId are stable due to their own hook's listener pattern


  const addProduct = useCallback((productData: ProductFormData): Product => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    dispatch({ type: ProductActionTypes.ADD, payload: { newProduct } }, addNotification);
    return newProduct;
  }, [addNotification]);

  const editProduct = useCallback((productId: string, updatedData: ProductFormData): Product | undefined => {
    dispatch({ type: ProductActionTypes.EDIT, payload: { productId, updatedData } }, addNotification);
    // The actual return of the edited product now happens via state update.
    // To get the product immediately, one would need to find it in memoryState.products after dispatch,
    // but typically UI updates based on the new state.
    return memoryState.products.find(p => p.id === productId);
  }, [addNotification]);

  const decreaseProductQuantity = useCallback((productId: string, quantityToDecrease: number): Product | undefined => {
    dispatch({ type: ProductActionTypes.DECREASE_QUANTITY, payload: { productId, quantityToDecrease } }, addNotification);
    return memoryState.products.find(p => p.id === productId);
  }, [addNotification]);

  const deleteProduct = useCallback((productId: string) => {
    dispatch({ type: ProductActionTypes.DELETE, payload: { productId } }, undefined, deleteNotificationsByProductId);
  }, [deleteNotificationsByProductId]);
  
  const getProductById = useCallback((productId: string): Product | undefined => {
    return state.products.find(p => p.id === productId);
  }, [state.products]);

  const clearAllProducts = useCallback(() => {
    // For clearing all, we might also want to clear related notifications.
    // This is a bit complex as it would require iterating or a general "clear product notifications"
    // The reset in AppHeader already calls clearAllNotifications.
    dispatch({ type: ProductActionTypes.CLEAR_ALL });
  }, []);
  
  const sortedProducts = useMemo(() => {
    return state.products; // Reducer already sorts
  }, [state.products]);

  return { 
    products: sortedProducts, 
    addProduct, 
    editProduct, 
    decreaseProductQuantity, 
    getProductById, 
    deleteProduct,
    clearAllProducts, 
    isLoaded: state.isLoaded 
  };
}
