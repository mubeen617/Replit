-- Vehicle Brokerage CRM Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (mandatory for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create index for session expiration
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

-- Leads table for vehicle shipping opportunities
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_user_id VARCHAR REFERENCES customer_users(id) ON DELETE SET NULL,
    lead_number VARCHAR NOT NULL UNIQUE,
    
    -- Contact Details
    contact_name VARCHAR NOT NULL,
    contact_email VARCHAR NOT NULL,
    contact_phone VARCHAR NOT NULL,
    
    -- Financial Details
    carrier_fees VARCHAR DEFAULT '0' NOT NULL,
    broker_fees VARCHAR DEFAULT '0' NOT NULL,
    total_tariff VARCHAR DEFAULT '0' NOT NULL,
    
    -- Vehicle Details
    vehicle_year VARCHAR,
    vehicle_make VARCHAR,
    vehicle_model VARCHAR,
    vehicle_type VARCHAR,
    trailer_type VARCHAR DEFAULT 'open' NOT NULL,
    
    -- Location and Timing
    origin VARCHAR NOT NULL,
    origin_zipcode VARCHAR,
    destination VARCHAR NOT NULL,
    destination_zipcode VARCHAR,
    pickup_date TIMESTAMP NOT NULL,
    delivery_date TIMESTAMP,
    
    -- Legacy fields
    customer_rate VARCHAR,
    carrier_rate VARCHAR,
    weight VARCHAR,
    transport_type VARCHAR,
    
    -- Workflow Status
    status VARCHAR DEFAULT 'lead' NOT NULL,
    priority VARCHAR DEFAULT 'normal' NOT NULL,
    notes TEXT,
    source VARCHAR,
    external_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_by_user_id VARCHAR NOT NULL REFERENCES customer_users(id) ON DELETE SET NULL,
    
    -- Tariff Details
    carrier_fees VARCHAR NOT NULL,
    broker_fees VARCHAR NOT NULL,
    total_tariff VARCHAR NOT NULL,
    
    -- Pickup Details
    pickup_person_name VARCHAR NOT NULL,
    pickup_person_phone VARCHAR NOT NULL,
    pickup_address TEXT NOT NULL,
    
    -- Drop-off Details
    dropoff_person_name VARCHAR NOT NULL,
    dropoff_person_phone VARCHAR NOT NULL,
    dropoff_address TEXT NOT NULL,
    
    -- Payment Details
    card_details TEXT,
    
    -- Terms and Conditions
    special_terms TEXT,
    standard_terms TEXT,
    
    status VARCHAR DEFAULT 'draft' NOT NULL,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id VARCHAR NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    lead_id VARCHAR NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    order_number VARCHAR NOT NULL UNIQUE,
    
    -- Contract Details
    contract_type VARCHAR DEFAULT 'standard' NOT NULL,
    contract_sent BOOLEAN DEFAULT FALSE,
    contract_sent_at TIMESTAMP,
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMP,
    signature_data TEXT,
    
    -- Change Orders
    change_orders JSONB,
    
    status VARCHAR DEFAULT 'pending_signature' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dispatch table
CREATE TABLE IF NOT EXISTS dispatch (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    lead_id VARCHAR NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    dispatch_number VARCHAR NOT NULL UNIQUE,
    
    -- Carrier Details
    carrier_name VARCHAR,
    carrier_phone VARCHAR,
    carrier_email VARCHAR,
    driver_name VARCHAR,
    driver_phone VARCHAR,
    truck_info VARCHAR,
    
    -- Dispatch Status
    status VARCHAR DEFAULT 'assigned' NOT NULL,
    pickup_date TIMESTAMP,
    delivery_date TIMESTAMP,
    actual_pickup_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    
    -- Final Financials
    final_carrier_fees VARCHAR,
    final_broker_fees VARCHAR,
    final_total_tariff VARCHAR,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create demo data
INSERT INTO customers (id, name, domain, admin_name, admin_email, admin_password, status) 
VALUES (
    'demo-vehicle-broker-123',
    'Elite Vehicle Transport',
    'elitevehicletransport.com',
    'Sarah Manager',
    'admin@elitevehicletransport.com',
    '$2b$10$rGVVQ3kk0YVwYZKUBzGOLeeq.tLXl8t2K6JkGJ/TGUHdBYr6Fl0AC', -- password: demo123
    'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_users (customer_id, email, first_name, last_name, password, role, status)
VALUES 
(
    'demo-vehicle-broker-123',
    'manager@elitevehicletransport.com',
    'Sarah',
    'Manager',
    '$2b$10$rGVVQ3kk0YVwYZKUBzGOLeeq.tLXl8t2K6JkGJ/TGUHdBYr6Fl0AC', -- password: demo123
    'admin',
    'active'
),
(
    'demo-vehicle-broker-123',
    'agent@elitevehicletransport.com',
    'Mike',
    'Agent',
    '$2b$10$rGVVQ3kk0YVwYZKUBzGOLeeq.tLXl8t2K6JkGJ/TGUHdBYr6Fl0AC', -- password: demo123
    'user',
    'active'
) ON CONFLICT DO NOTHING;