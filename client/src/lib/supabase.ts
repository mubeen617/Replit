import { createClient } from '@supabase/supabase-js';

// Use VITE_ prefixed variables for frontend, fallback to server env for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pzcctsqmnfrtvhihtmhv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Y2N0c3FtbmZydHZoaWh0bWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDU1MDUsImV4cCI6MjA3MTc4MTUwNX0.Xbs0TSWfHyLBjoFVNOHuusxd23ECJw2zgnB1gey6DQs';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL environment variable not found. Using fallback for development.');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('VITE_SUPABASE_ANON_KEY environment variable not found. Using fallback for development.');
}

// Create Supabase client for frontend operations
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);