
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.DATABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function debugQuotes() {
    console.log("--- Debugging Quotes ---");

    // 1. List all Customers
    const { data: customers, error: customerError } = await supabaseAdmin
        .from('customers')
        .select('id, name, admin_email');

    if (customerError) {
        console.error("Error fetching customers:", customerError);
        return;
    }
    console.log(`Found ${customers.length} customers:`);
    customers.forEach(c => console.log(`- ${c.name} (${c.admin_email}): ${c.id}`));

    // 2. List all Users
    const { data: users, error: userError } = await supabaseAdmin
        .from('customer_users')
        .select('id, email, customer_id, role');

    if (userError) {
        console.error("Error fetching users:", userError);
        return;
    }
    console.log(`\nFound ${users.length} users:`);
    users.forEach(u => console.log(`- ${u.email} (${u.role}): ${u.id} (Customer: ${u.customer_id})`));

    // 3. List all Quotes
    const { data: quotes, error: quoteError } = await supabaseAdmin
        .from('quotes')
        .select('*');

    if (quoteError) {
        console.error("Error fetching quotes:", quoteError);
        return;
    }
    console.log(`\nFound ${quotes.length} quotes:`);
    quotes.forEach(q => {
        console.log(`- Quote ID: ${q.id}`);
        console.log(`  Customer ID: ${q.customer_id}`);
        console.log(`  Lead ID: ${q.lead_id}`);
        console.log(`  Status: ${q.status}`);
        console.log(`  Total Tariff: ${q.total_tariff}`);
    });

    // 4. Simulate API Query for each customer
    console.log("\n--- Simulating API Queries ---");
    for (const customer of customers) {
        console.log(`Querying quotes for Customer: ${customer.name} (${customer.id})`);
        const { data: customerQuotes, error: apiError } = await supabaseAdmin
            .from('quotes')
            .select('*, leads!inner(*)')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false });

        if (apiError) {
            console.error(`  Error: ${apiError.message}`);
        } else {
            console.log(`  Found ${customerQuotes.length} quotes.`);
        }
    }
}

debugQuotes().catch(console.error);
