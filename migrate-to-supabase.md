# Supabase Migration Instructions

## 🔧 Database Setup Required

Since automatic schema creation failed, you need to manually set up the database schema in Supabase:

### Step 1: Access Supabase SQL Editor
1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `pzcctsqmnfrtvhihtmhv`
3. Click on **SQL Editor** in the left sidebar

### Step 2: Execute Schema SQL
Copy and paste the following SQL into the SQL Editor and click **Run**:

```sql
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

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lead_id VARCHAR NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    quote_number VARCHAR NOT NULL UNIQUE,
    contact_name VARCHAR NOT NULL,
    contact_email VARCHAR NOT NULL,
    contact_phone VARCHAR NOT NULL,
    vehicle_year VARCHAR,
    vehicle_make VARCHAR,
    vehicle_model VARCHAR,
    vehicle_type VARCHAR,
    transport_type VARCHAR DEFAULT 'open' NOT NULL,
    origin VARCHAR NOT NULL,
    destination VARCHAR NOT NULL,
    pickup_date TIMESTAMP NOT NULL,
    delivery_date TIMESTAMP,
    total_price VARCHAR NOT NULL DEFAULT '0',
    carrier_rate VARCHAR,
    broker_fee VARCHAR,
    status VARCHAR DEFAULT 'draft' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Demo customer data
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

-- Demo leads data
INSERT INTO leads (id, customer_id, lead_number, contact_name, contact_email, contact_phone, vehicle_year, vehicle_make, vehicle_model, vehicle_type, transport_type, origin, destination, pickup_date, status, priority) 
VALUES 
    ('demo-lead-001', 'demo-vehicle-broker-123', 'L-202408-0001', 'John Smith', 'john@email.com', '555-0123', '2023', 'Tesla', 'Model 3', 'sedan', 'enclosed', 'Los Angeles, CA', 'New York, NY', '2024-09-01 10:00:00', 'lead', 'high'),
    ('demo-lead-002', 'demo-vehicle-broker-123', 'L-202408-0002', 'Mary Johnson', 'mary@email.com', '555-0456', '2022', 'Ford', 'F-150', 'truck', 'open', 'Chicago, IL', 'Miami, FL', '2024-09-02 14:00:00', 'lead', 'normal')
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Verify Tables Created
After running the SQL, check the **Table Editor** tab to confirm these tables exist:
- `sessions`
- `users` 
- `customers`
- `customer_users`
- `leads`
- `quotes`

## ✅ Migration Status
- ✅ Supabase client connections configured
- ✅ Environment variables set (using fallback values for development)
- ✅ Database schema prepared
- 🔄 **Next: Execute the SQL above to complete the migration**
- 🔄 Update frontend components to use Supabase directly
- 🔄 Test vehicle brokerage features with real-time updates

## 📝 Environment Variables
Add these to Replit Secrets for production:
- `VITE_SUPABASE_URL=https://pzcctsqmnfrtvhihtmhv.supabase.co`
- `VITE_SUPABASE_ANON_KEY=your_anon_key`

The system is currently using fallback values for development but will use the VITE_ prefixed environment variables when available.