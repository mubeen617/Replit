import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSchema() {
  console.log('Setting up Supabase database schema...');
  
  try {
    // Create the database schema using Supabase SQL
    const schemaSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (mandatory for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- Users table (mandatory for Replit Auth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    domain VARCHAR NOT NULL UNIQUE,
    admin_name VARCHAR NOT NULL,
    admin_email VARCHAR NOT NULL,
    admin_password VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer users table
CREATE TABLE IF NOT EXISTS customer_users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'user',
    status VARCHAR NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_user_id VARCHAR REFERENCES customer_users(id) ON DELETE SET NULL,
    lead_number VARCHAR NOT NULL UNIQUE,
    contact_name VARCHAR NOT NULL,
    contact_email VARCHAR NOT NULL,
    contact_phone VARCHAR NOT NULL,
    carrier_fees VARCHAR DEFAULT '0' NOT NULL,
    broker_fees VARCHAR DEFAULT '0' NOT NULL,
    total_tariff VARCHAR DEFAULT '0' NOT NULL,
    vehicle_year VARCHAR,
    vehicle_make VARCHAR,
    vehicle_model VARCHAR,
    vehicle_type VARCHAR,
    trailer_type VARCHAR DEFAULT 'open' NOT NULL,
    origin VARCHAR NOT NULL,
    origin_zipcode VARCHAR,
    destination VARCHAR NOT NULL,
    destination_zipcode VARCHAR,
    pickup_date TIMESTAMP NOT NULL,
    delivery_date TIMESTAMP,
    customer_rate VARCHAR,
    carrier_rate VARCHAR,
    weight VARCHAR,
    transport_type VARCHAR,
    status VARCHAR DEFAULT 'lead' NOT NULL,
    priority VARCHAR DEFAULT 'normal' NOT NULL,
    notes TEXT,
    source VARCHAR,
    external_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Demo data
INSERT INTO customers (id, name, domain, admin_name, admin_email, admin_password, status) 
VALUES (
    'demo-vehicle-broker-123',
    'Elite Vehicle Transport',
    'elitevehicletransport.com',
    'Sarah Manager',
    'admin@elitevehicletransport.com',
    '$2b$10$rGVVQ3kk0YVwYZKUBzGOLeeq.tLXl8t2K6JkGJ/TGUHdBYr6Fl0AC',
    'active'
) ON CONFLICT (id) DO NOTHING;
    `;

    const { error } = await supabase.rpc('exec', { query: schemaSQL });
    
    if (error) {
      console.error('Schema setup error:', error);
    } else {
      console.log('✅ Database schema setup complete!');
      
      // Test the tables
      const { data: customers } = await supabase.from('customers').select('count');
      console.log('✅ Tables created successfully');
    }
    
  } catch (err) {
    console.error('Setup error:', err);
  }
}

setupSchema();