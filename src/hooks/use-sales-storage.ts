
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Sale, SaleItem } from '@/lib/types';

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
} as const;

type SalesAction =
  | { type: typeof SalesActionTypes.SET_LOADED; payload: Sale[] }
  | { type: typeof SalesActionTypes.ADD_TRANSACTION; payload: { newTransaction: Sale } }
  | { type: typeof SalesActionTypes.CLEAR_ALL_SALES };


function salesReducer(currentTransactions: Sale[], action: SalesAction): Sale[] {
  switch (action.type) {
    case SalesActionTypes.SET_LOADED:
      const now = Date.now();
      return action.payload
        .map(sale => ({
          ...sale,
          id: sale.id || crypto.randomUUID(),
          sale_timestamp: typeof sale.sale_timestamp === 'number' && !isNaN(sale.sale_timestamp) ? sale.sale_timestamp : now,
          total_transaction_amount: typeof sale.total_transaction_amount === 'number' && !isNaN(sale.total_transaction_amount) ? sale.total_transaction_amount : 0,
          items: Array.isArray(sale.items) ? sale.items.map((item: SaleItem) => ({ // Added type annotation for item
            ...item,
            id: item.id || crypto.randomUUID(),
            product_id: item.product_id || 'unknown_product',
            productNameSnapshot: item.productNameSnapshot || 'Unknown Product',
            quantitySold: typeof item.quantitySold === 'number' && !isNaN(item.quantitySold) ? item.quantitySold : 0,
            wholesalePricePerUnitSnapshot: typeof item.wholesalePricePerUnitSnapshot === 'number' && !isNaN(item.wholesalePricePerUnitSnapshot) ? item.wholesalePricePerUnitSnapshot : 0,
            retailPricePerUnitSnapshot: typeof item.retailPricePerUnitSnapshot === 'number' && !isNaN(item.retailPricePerUnitSnapshot) ? item.retailPricePerUnitSnapshot : 0,
            itemTotalAmount: typeof item.itemTotalAmount === 'number' && !isNaN(item.itemTotalAmount) ? item.itemTotalAmount : 0,
            productType: item.productType || 'unit', // Default product type if missing
          })) : [],
          created_at: typeof sale.created_at === 'number' && !isNaN(sale.created_at) ? sale.created_at : now,
          updated_at: typeof sale.updated_at === 'number' && !isNaN(sale.updated_at) ? sale.updated_at : now,
        }))
        .sort((a, b) => b.sale_timestamp - a.sale_timestamp);
    case SalesActionTypes.ADD_TRANSACTION:
      const newTransactionWithIds = {
        ...action.payload.newTransaction,
        id: action.payload.newTransaction.id || crypto.randomUUID(),
        items: action.payload.newTransaction.items.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
        }))
      };
      return [newTransactionWithIds, ...currentTransactions].sort((a, b) => b.sale_timestamp - a.sale_timestamp);
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
        }
      } catch (error) {
        console.error("Failed to load sales from localStorage:", error);
        initialSales = [];
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


  const getSaleById = useCallback((saleId: string): Sale | undefined => {
    return state.sales.find(s => s.id === saleId);
  }, [state.sales]);

  const clearAllSales = useCallback(() => {
    dispatchSales({ type: SalesActionTypes.CLEAR_ALL_SALES });
  }, []);

  const salesDispatchHook = useCallback((action: SalesAction) => {
     dispatchSales(action);
  },[]);

  const allSalesTransactions = useMemo(() => {
    return state.sales;
  }, [state.sales]);

  return {
    sales: allSalesTransactions,
    addSaleTransaction,
    getSaleById,
    clearAllSales,
    dispatchSales: salesDispatchHook,
    isSalesLoaded: state.isSalesLoaded
  };
}
