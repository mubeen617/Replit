// Test Supabase connection directly
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SERVICE_KEY present:', !!supabaseServiceKey);
console.log('SERVICE_KEY first 20 chars:', supabaseServiceKey?.substring(0, 20));

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function test() {
    try {
        // Test reading from customers table
        console.log('\nTesting Supabase connection...');
        const { data, error } = await supabase.from('customers').select('*').limit(1);

        if (error) {
            console.error('Supabase error:', error);
        } else {
            console.log('Connection successful! Found', data?.length || 0, 'customers');
            console.log('Data:', data);
        }

        // Test insert
        console.log('\nTesting insert...');
        const { data: insertData, error: insertError } = await supabase
            .from('customers')
            .insert({
                name: 'Test Company',
                domain: 'testcompany' + Date.now() + '.com',
                admin_name: 'Test Admin',
                admin_email: 'admin' + Date.now() + '@test.com',
                admin_password: 'hashedpassword123',
                status: 'active'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
        } else {
            console.log('Insert successful!');
            console.log('Inserted:', insertData);
        }
    } catch (err) {
        console.error('Catch error:', err);
    }
}

test();
