import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://duwaekjgdpacseitcydb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1d2Fla2pnZHBhY3NlaXRjeWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzEwMDYsImV4cCI6MjA5NDAwNzAwNn0.ByTSemhp5yLeucwDldPzJ9dtPNp-7aUjDPUj027lTzM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Database = {
  public: {
    Tables: {
      memories: {
        Row: {
          id: string;
          type: 'image' | 'video';
          url: string;
          storage_path: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          start_time: number | null;
          end_time: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memories']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['memories']['Insert']>;
      };
      config: {
        Row: { key: string; value: string; updated_at: string };
        Insert: { key: string; value: string };
        Update: { value?: string };
      };
    };
  };
};
