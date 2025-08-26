import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a postgres client for Supabase
const client = postgres(process.env.DATABASE_URL, {
  prepare: false, // Disable prepared statements for compatibility
});

export const db = drizzle(client, { schema });