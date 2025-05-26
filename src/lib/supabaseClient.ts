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

// Interface representing the structure of a row in your Supabase 'products' table
export interface ProductRow {
  id: string; // uuid, primary key
  name: string; // text, NOT NULL
  type: 'powder' | 'liquid' | 'unit'; // text, NOT NULL, CHECK constraint
  wholesale_price: number; // float8, NOT NULL, CHECK (>=0)
  retail_price: number; // float8, NOT NULL, CHECK (>=0)
  quantity: number; // float8, NOT NULL, CHECK (>=0)
  created_at: string; // timestamptz, NOT NULL, default now()
  updated_at: string; // timestamptz, NOT NULL, default now() (auto-updates via trigger)
  // user_id?: string; // Optional: uuid, foreign key to auth.users if implementing RLS
}

// Interface representing the structure of a row in your Supabase 'sales' table
export interface SaleRow {
  id: string; // uuid, primary key
  product_id: string; // uuid, foreign key to products.id, NOT NULL
  product_name_snapshot: string; // text, NOT NULL
  quantity_sold: number; // float8, NOT NULL, CHECK (>0)
  wholesale_price_per_unit_snapshot: number; // float8, NOT NULL, CHECK (>=0)
  retail_price_per_unit_snapshot: number; // float8, NOT NULL, CHECK (>=0)
  total_sale_amount: number; // float8, NOT NULL, CHECK (>=0)
  sale_timestamp: string; // timestamptz, NOT NULL (actual time of sale)
  created_at: string; // timestamptz, NOT NULL, default now()
  updated_at: string; // timestamptz, NOT NULL, default now() (auto-updates via trigger)
  // user_id?: string; // Optional: uuid, foreign key to auth.users if implementing RLS
}

// ... other types for notifications, backup_logs etc.
