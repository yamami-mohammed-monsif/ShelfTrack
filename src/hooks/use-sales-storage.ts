
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Sale, Product } from '@/lib/types';

const SALES_STORAGE_KEY = 'bouzid_store_sales';

interface SalesState {
  sales: Sale[];
  isSalesLoaded: boolean;
}

// --- Module-level shared state and logic ---
let memoryState: SalesState = {
  sales: [],
  isSalesLoaded: false,
};

const listeners: Array<(state: SalesState) => void> = [];

const SalesActionTypes = {
  SET_LOADED: 'SET_LOADED_SALES',
  ADD_SALE: 'ADD_SALE',
  CLEAR_ALL_SALES: 'CLEAR_ALL_SALES',
} as const;

type SalesAction =
  | { type: typeof SalesActionTypes.SET_LOADED; payload: Sale[] }
  | { type: typeof SalesActionTypes.ADD_SALE; payload: { newSale: Sale } }
  | { type: typeof SalesActionTypes.CLEAR_ALL_SALES };

function salesReducer(state: SalesState, action: SalesAction): SalesState {
  switch (action.type) {
    case SalesActionTypes.SET_LOADED:
      return {
        sales: action.payload.sort((a, b) => b.saleTimestamp - a.saleTimestamp),
        isSalesLoaded: true,
      };
    case SalesActionTypes.ADD_SALE:
      return {
        ...state,
        sales: [action.payload.newSale, ...state.sales].sort((a, b) => b.saleTimestamp - a.saleTimestamp),
      };
    case SalesActionTypes.CLEAR_ALL_SALES:
      return {
        sales: [],
        isSalesLoaded: state.isSalesLoaded,
      };
    default:
      return state;
  }
}

function dispatch(action: SalesAction) {
  memoryState = salesReducer(memoryState, action);
  if (memoryState.isSalesLoaded) {
    try {
      if (action.type === SalesActionTypes.CLEAR_ALL_SALES) {
        localStorage.removeItem(SALES_STORAGE_KEY);
      } else {
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(memoryState.sales));
      }
    } catch (error) {
      console.error("Failed to update sales in localStorage:", error);
    }
  }
  queueMicrotask(() => {
    listeners.forEach((listener) => listener(memoryState));
  });
}
// --- End of Module-level shared state and logic ---

export function useSalesStorage() {
  const [state, setState] = useState<SalesState>(memoryState);

  useEffect(() => {
    if (!memoryState.isSalesLoaded) {
      let initialSales: Sale[] = [];
      try {
        const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
        if (storedSales) {
          initialSales = JSON.parse(storedSales);
        }
      } catch (error) {
        console.error("Failed to load sales from localStorage:", error);
      }
      dispatch({ type: SalesActionTypes.SET_LOADED, payload: initialSales });
    }

    const listener = (newState: SalesState) => setState(newState);
    listeners.push(listener);
    
    // If global state is already loaded but this hook instance's state isn't, sync it.
    if (memoryState.isSalesLoaded && !state.isSalesLoaded) {
        setState(memoryState);
    }

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state.isSalesLoaded]); // Depend on local isSalesLoaded to sync if necessary

  const addSale = useCallback((
    productSold: Product,
    quantitySold: number,
    saleTimestamp: number
  ): Sale => {
    const newSale: Sale = {
      id: crypto.randomUUID(),
      productId: productSold.id,
      productNameSnapshot: productSold.name,
      quantitySold,
      wholesalePricePerUnitSnapshot: productSold.wholesalePrice,
      retailPricePerUnitSnapshot: productSold.retailPrice,
      totalSaleAmount: productSold.retailPrice * quantitySold,
      saleTimestamp,
    };
    dispatch({ type: SalesActionTypes.ADD_SALE, payload: { newSale } });
    return newSale;
  }, []);

  const getSales = useCallback((): Sale[] => {
    return state.sales; // Return from the local state which is synced
  }, [state.sales]);

  const clearAllSales = useCallback(() => {
    dispatch({ type: SalesActionTypes.CLEAR_ALL_SALES });
  }, []);

  // Use useMemo for sorted sales to prevent re-sorting on every render if sales array instance hasn't changed
  const sortedSales = useMemo(() => {
    return state.sales; // The reducer already sorts, so state.sales is sorted
  }, [state.sales]);

  return { 
    sales: sortedSales, 
    addSale, 
    getSales, 
    clearAllSales, 
    isSalesLoaded: state.isSalesLoaded 
  };
}
