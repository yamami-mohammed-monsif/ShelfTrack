
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Sale, Product } from '@/lib/types';

const SALES_STORAGE_KEY = 'bouzid_store_sales';

export function useSalesStorage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isSalesLoaded, setIsSalesLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
      if (storedSales) {
        setSales(JSON.parse(storedSales));
      }
    } catch (error) {
      console.error("Failed to load sales from localStorage:", error);
    }
    setIsSalesLoaded(true);
  }, []);

  useEffect(() => {
    if (isSalesLoaded) {
      try {
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
      } catch (error) {
        console.error("Failed to save sales to localStorage:", error);
      }
    }
  }, [sales, isSalesLoaded]);

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
      salePricePerUnit: productSold.wholesalePrice, // Assuming selling at wholesale price for now
      totalSaleAmount: productSold.wholesalePrice * quantitySold,
      saleTimestamp,
    };
    setSales((prevSales) => [...prevSales, newSale].sort((a, b) => b.saleTimestamp - a.saleTimestamp));
    return newSale;
  }, []);

  const getSales = useCallback((): Sale[] => {
    return sales;
  }, [sales]);

  return { sales, addSale, getSales, isSalesLoaded };
}
