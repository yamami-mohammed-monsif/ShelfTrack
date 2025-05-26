
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Sale, Product, SaleItem, EditSaleFormData } from '@/lib/types';

const SALES_STORAGE_KEY = 'shelftrack_sales';

interface SalesState {
  sales: Sale[]; // Now an array of Sale (transaction) objects
  isSalesLoaded: boolean;
}

let memoryStateSales: SalesState = {
  sales: [],
  isSalesLoaded: false,
};

const salesListeners: Array<(state: SalesState) => void> = [];

export const SalesActionTypes = {
  SET_LOADED: 'SET_LOADED_SALES',
  ADD_TRANSACTION: 'ADD_TRANSACTION', // Changed from ADD_SALE
  // EDIT_SALE and DELETE_SALE need significant rework for transaction/item model
  // Temporarily, we might disable them or simplify.
  // For now, let's assume edit/delete will be handled later.
  CLEAR_ALL_SALES: 'CLEAR_ALL_SALES',
} as const;

type SalesAction =
  | { type: typeof SalesActionTypes.SET_LOADED; payload: Sale[] }
  | { type: typeof SalesActionTypes.ADD_TRANSACTION; payload: { newTransaction: Sale } }
  | { type: typeof SalesActionTypes.CLEAR_ALL_SALES };
  // | { type: typeof SalesActionTypes.EDIT_SALE; payload: { saleId: string; itemId: string; updatedData: EditSaleFormData } } // Example for future
  // | { type: typeof SalesActionTypes.DELETE_SALE; payload: { saleId: string; itemId?: string } }; // Example for future


function salesReducer(currentTransactions: Sale[], action: SalesAction): Sale[] {
  switch (action.type) {
    case SalesActionTypes.SET_LOADED:
      return action.payload.sort((a, b) => b.sale_timestamp - a.sale_timestamp);
    case SalesActionTypes.ADD_TRANSACTION:
      return [action.payload.newTransaction, ...currentTransactions].sort((a, b) => b.sale_timestamp - a.sale_timestamp);
    case SalesActionTypes.CLEAR_ALL_SALES:
      return [];
    // Placeholder for future EDIT_SALE / DELETE_SALE logic
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
          // Ensure loaded sales have an items array
          initialSales = initialSales.map(s => ({ ...s, items: s.items || [] }));
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

  const addSaleTransaction = useCallback(( // Renamed from addSale
    productSold: Product,
    quantitySold: number,
    saleTimestamp: number // Unix timestamp
  ): Sale => { // Returns the new transaction
    const saleItemId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const now = Date.now();

    const newSaleItem: SaleItem = {
      id: saleItemId,
      sale_id: transactionId,
      product_id: productSold.id,
      productNameSnapshot: productSold.name,
      quantitySold,
      wholesalePricePerUnitSnapshot: productSold.wholesalePrice,
      retailPricePerUnitSnapshot: productSold.retailPrice,
      itemTotalAmount: productSold.retailPrice * quantitySold,
      productType: productSold.type, // For client-side use if needed
    };

    const newTransaction: Sale = {
      id: transactionId,
      sale_timestamp: saleTimestamp,
      total_transaction_amount: newSaleItem.itemTotalAmount,
      items: [newSaleItem],
      created_at: now,
      updated_at: now,
    };

    dispatchSales({ type: SalesActionTypes.ADD_TRANSACTION, payload: { newTransaction } });
    return newTransaction;
  }, []);

  // editSale and deleteSale need significant rework for the new transaction/item model.
  // They are temporarily simplified/commented to avoid breaking changes.
  // A proper implementation will be part of a future update focused on cart/transaction management.

  const editSale = useCallback((saleId: string, updatedData: EditSaleFormData): Sale | undefined => {
    // This logic is now incorrect for multi-item sales.
    // Placeholder: In a real scenario, you'd identify the item within the transaction.
    console.warn("editSale functionality needs to be updated for multi-item transactions.");
    // dispatchSales({ type: SalesActionTypes.EDIT_SALE, payload: { saleId, updatedData } });
    return memoryStateSales.sales.find(s => s.id === saleId);
  }, []);

  const deleteSale = useCallback((saleId: string): boolean => {
    // This logic is now incorrect for multi-item sales.
    // Placeholder: In a real scenario, you'd delete the transaction and its items.
    console.warn("deleteSale functionality needs to be updated for multi-item transactions.");
    const saleExists = memoryStateSales.sales.some(s => s.id === saleId);
    // if (saleExists) {
    //   dispatchSales({ type: SalesActionTypes.DELETE_SALE, payload: { saleId } });
    //   return true;
    // }
    return false;
  }, []);

  const getSaleById = useCallback((saleId: string): Sale | undefined => {
    // This would return the whole transaction
    return state.sales.find(s => s.id === saleId);
  }, [state.sales]);

  const clearAllSales = useCallback(() => {
    dispatchSales({ type: SalesActionTypes.CLEAR_ALL_SALES });
  }, []);

  const salesDispatch = useCallback((action: SalesAction) => {
     dispatchSales(action);
  },[]);

  const allSalesTransactions = useMemo(() => {
    return state.sales;
  }, [state.sales]);

  return {
    sales: allSalesTransactions, // This is now an array of Sale (transaction) objects
    addSale: addSaleTransaction, // Keep 'addSale' as the public API name for now, but it adds a transaction
    editSale, // Needs rework
    deleteSale, // Needs rework
    getSaleById,
    clearAllSales,
    dispatchSales: salesDispatch,
    isSalesLoaded: state.isSalesLoaded
  };
}
