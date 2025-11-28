import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use the environment variables for PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a postgres client with the connection string
const client = postgres(DATABASE_URL, {
  prepare: false, // Disable prepared statements for compatibility
});

export const db = drizzle(client, { schema });