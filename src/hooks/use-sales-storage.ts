
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Sale, Product, EditSaleFormData } from '@/lib/types';

const SALES_STORAGE_KEY = 'bouzid_store_sales';

interface SalesState {
  sales: Sale[];
  isSalesLoaded: boolean;
}

// --- Module-level shared state and logic ---
let memoryStateSales: SalesState = {
  sales: [],
  isSalesLoaded: false,
};

const salesListeners: Array<(state: SalesState) => void> = [];

export const SalesActionTypes = {
  SET_LOADED: 'SET_LOADED_SALES',
  ADD_SALE: 'ADD_SALE',
  EDIT_SALE: 'EDIT_SALE',
  DELETE_SALE: 'DELETE_SALE',
  CLEAR_ALL_SALES: 'CLEAR_ALL_SALES',
} as const;

type SalesAction =
  | { type: typeof SalesActionTypes.SET_LOADED; payload: Sale[] }
  | { type: typeof SalesActionTypes.ADD_SALE; payload: { newSale: Sale } }
  | { type: typeof SalesActionTypes.EDIT_SALE; payload: { saleId: string; updatedData: EditSaleFormData } }
  | { type: typeof SalesActionTypes.DELETE_SALE; payload: { saleId: string } }
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
    case SalesActionTypes.EDIT_SALE: {
      return {
        ...state,
        sales: state.sales.map(sale => {
          if (sale.id === action.payload.saleId) {
            return {
              ...sale,
              quantitySold: action.payload.updatedData.quantitySold,
              saleTimestamp: new Date(action.payload.updatedData.saleTimestamp).getTime(),
              totalSaleAmount: sale.retailPricePerUnitSnapshot * action.payload.updatedData.quantitySold,
            };
          }
          return sale;
        }).sort((a, b) => b.saleTimestamp - a.saleTimestamp),
      };
    }
    case SalesActionTypes.DELETE_SALE:
      return {
        ...state,
        sales: state.sales.filter(s => s.id !== action.payload.saleId),
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

function dispatchSales(action: SalesAction) {
  memoryStateSales = salesReducer(memoryStateSales, action);
  if (memoryStateSales.isSalesLoaded) {
    try {
      if (action.type === SalesActionTypes.CLEAR_ALL_SALES) {
        localStorage.removeItem(SALES_STORAGE_KEY);
      } else {
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(memoryStateSales.sales));
      }
    } catch (error) {
      console.error("Failed to update sales in localStorage:", error);
    }
  }
  queueMicrotask(() => {
    salesListeners.forEach((listener) => listener(memoryStateSales));
  });
}
// --- End of Module-level shared state and logic ---

export function useSalesStorage() {
  const [state, setState] = useState<SalesState>(memoryStateSales);

  useEffect(() => {
    if (!memoryStateSales.isSalesLoaded) {
      let initialSales: Sale[] = [];
      try {
        const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
        if (storedSales) {
          initialSales = JSON.parse(storedSales);
        }
      } catch (error) {
        console.error("Failed to load sales from localStorage:", error);
      }
      dispatchSales({ type: SalesActionTypes.SET_LOADED, payload: initialSales });
    }

    const listener = (newState: SalesState) => setState(newState);
    salesListeners.push(listener);
    
    if (memoryStateSales.isSalesLoaded && !state.isSalesLoaded) {
        setState(memoryStateSales);
    }

    return () => {
      const index = salesListeners.indexOf(listener);
      if (index > -1) {
        salesListeners.splice(index, 1);
      }
    };
  }, [state.isSalesLoaded]);

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
    dispatchSales({ type: SalesActionTypes.ADD_SALE, payload: { newSale } });
    return newSale;
  }, []);

  const editSale = useCallback((saleId: string, updatedData: EditSaleFormData): Sale | undefined => {
    dispatchSales({ type: SalesActionTypes.EDIT_SALE, payload: { saleId, updatedData } });
    return memoryStateSales.sales.find(s => s.id === saleId);
  }, []);

  const deleteSale = useCallback((saleId: string): boolean => {
    const saleExists = memoryStateSales.sales.some(s => s.id === saleId);
    if (saleExists) {
      dispatchSales({ type: SalesActionTypes.DELETE_SALE, payload: { saleId } });
      return true;
    }
    return false;
  }, []);
  
  const getSaleById = useCallback((saleId: string): Sale | undefined => {
    return state.sales.find(s => s.id === saleId);
  }, [state.sales]);

  const clearAllSales = useCallback(() => {
    dispatchSales({ type: SalesActionTypes.CLEAR_ALL_SALES });
  }, []);

  const sortedSales = useMemo(() => {
    return state.sales; 
  }, [state.sales]);

  return { 
    sales: sortedSales, 
    addSale, 
    editSale,
    deleteSale,
    getSaleById,
    clearAllSales, 
    isSalesLoaded: state.isSalesLoaded 
  };
}

