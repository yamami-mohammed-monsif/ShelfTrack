
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Sale, Product, SaleItem, EditSaleFormData } from '@/lib/types';

const SALES_STORAGE_KEY = 'shelftrack_sales';

interface SalesState {
  sales: Sale[];
  isSalesLoaded: boolean;
}

let memoryStateSales: SalesState = {
  sales: [],
  isSalesLoaded: false,
};

const salesListeners: Array<(state: SalesState) => void> = [];

export const SalesActionTypes = {
  SET_LOADED: 'SET_LOADED_SALES',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  CLEAR_ALL_SALES: 'CLEAR_ALL_SALES',
  // EDIT_TRANSACTION and DELETE_TRANSACTION would be needed for full CRUD
} as const;

type SalesAction =
  | { type: typeof SalesActionTypes.SET_LOADED; payload: Sale[] }
  | { type: typeof SalesActionTypes.ADD_TRANSACTION; payload: { newTransaction: Sale } }
  | { type: typeof SalesActionTypes.CLEAR_ALL_SALES };


function salesReducer(currentTransactions: Sale[], action: SalesAction): Sale[] {
  switch (action.type) {
    case SalesActionTypes.SET_LOADED:
      return action.payload.sort((a, b) => b.sale_timestamp - a.sale_timestamp);
    case SalesActionTypes.ADD_TRANSACTION:
      return [action.payload.newTransaction, ...currentTransactions].sort((a, b) => b.sale_timestamp - a.sale_timestamp);
    case SalesActionTypes.CLEAR_ALL_SALES:
      return [];
    default:
      return currentTransactions;
  }
}

function dispatchSales(action: SalesAction) {
  memoryStateSales = {
      ...memoryStateSales,
      sales: salesReducer(memoryStateSales.sales, action),
  };

  if (action.type === SalesActionTypes.SET_LOADED) {
    memoryStateSales.isSalesLoaded = true;
  }

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

export function useSalesStorage() {
  const [state, setState] = useState<SalesState>(memoryStateSales);

  useEffect(() => {
    if (!memoryStateSales.isSalesLoaded) {
      let initialSales: Sale[] = [];
      try {
        const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
        if (storedSales) {
          initialSales = JSON.parse(storedSales);
          initialSales = initialSales.map(s => ({ ...s, items: Array.isArray(s.items) ? s.items : [] }));
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

  const addSaleTransaction = useCallback((newTransaction: Sale): Sale => {
    dispatchSales({ type: SalesActionTypes.ADD_TRANSACTION, payload: { newTransaction } });
    return newTransaction;
  }, []);


  // Edit/Delete logic for transactions needs careful design (e.g., edit item in transaction, delete item, delete whole transaction)
  // For now, these are placeholders and would need significant updates.
  // const editSale = useCallback((saleId: string, updatedData: EditSaleFormData): Sale | undefined => {
  //   console.warn("editSale functionality needs to be updated for multi-item transactions.");
  //   return memoryStateSales.sales.find(s => s.id === saleId);
  // }, []);

  // const deleteSale = useCallback((saleId: string): boolean => {
  //   console.warn("deleteSale functionality needs to be updated for multi-item transactions.");
  //   return false;
  // }, []);

  const getSaleById = useCallback((saleId: string): Sale | undefined => {
    return state.sales.find(s => s.id === saleId);
  }, [state.sales]);

  const clearAllSales = useCallback(() => {
    dispatchSales({ type: SalesActionTypes.CLEAR_ALL_SALES });
  }, []);

  const salesDispatchHook = useCallback((action: SalesAction) => { // Renamed to avoid conflict
     dispatchSales(action);
  },[]);

  const allSalesTransactions = useMemo(() => {
    return state.sales;
  }, [state.sales]);

  return {
    sales: allSalesTransactions,
    addSaleTransaction, // Exposed the correctly named function
    // editSale, // Needs rework
    // deleteSale, // Needs rework
    getSaleById,
    clearAllSales,
    dispatchSales: salesDispatchHook,
    isSalesLoaded: state.isSalesLoaded
  };
}
