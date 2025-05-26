import { createClient } from '@supabase/supabase-js';

// Ensure your environment variables are correctly named and accessible.
// For client-side Supabase access, these should be prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is missing. Make sure to set NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is missing. Make sure to set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Example of how you might define types for your tables,
// which you can generate from your Supabase schema later.
// export interface ProductRow {
//   id: string; // or number, depending on your Supabase schema
//   name: string;
//   type: 'powder' | 'liquid' | 'unit';
//   wholesale_price: number;
//   retail_price: number;
//   quantity: number;
//   created_at: string; // Supabase typically uses ISO 8601 for timestamps
//   updated_at: string;
//   // user_id?: string; // If you add user authentication
// }

// export interface SaleRow {
//   id: string; // or number
//   product_id: string; // or number, foreign key to products table
//   product_name_snapshot: string;
//   quantity_sold: number;
//   wholesale_price_per_unit_snapshot: number;
//   retail_price_per_unit_snapshot: number;
//   total_sale_amount: number;
//   sale_timestamp: string; // ISO 8601
//   created_at: string;
//   // user_id?: string;
// }

// ... other types for notifications, backup_logs etc.
