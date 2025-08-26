import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use the environment variables for PostgreSQL connection
const PGUSER = process.env.PGUSER;
const PGPASSWORD = process.env.PGPASSWORD;
const PGHOST = process.env.PGHOST;
const PGPORT = process.env.PGPORT;
const PGDATABASE = process.env.PGDATABASE;

if (!PGUSER || !PGPASSWORD || !PGHOST || !PGPORT || !PGDATABASE) {
  throw new Error('PostgreSQL environment variables are not properly set');
}

// Construct the DATABASE_URL with SSL configuration
const DATABASE_URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;

// Create a postgres client with the connection string
const client = postgres(DATABASE_URL, {
  ssl: 'require',
  prepare: false, // Disable prepared statements for compatibility
});

export const db = drizzle(client, { schema });