import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use the provided PostgreSQL connection string
const DATABASE_URL = "postgresql://postgres:Rioxqxzq123@@db.pzcctsqmnfrtvhihtmhv.supabase.co:5432/postgres";

// Create a postgres client with the direct connection string
const client = postgres(DATABASE_URL, {
  prepare: false, // Disable prepared statements for compatibility
});

export const db = drizzle(client, { schema });