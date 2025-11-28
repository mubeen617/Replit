// Test Supabase connection
import { supabaseAdmin } from './server/supabase.ts';
(async () => {
    try {
        const { data, error } = await supabaseAdmin.from('customers').select('*');
        if (error) throw error;
        console.log('Customers:', data);
    } catch (e) {
        console.error('Error:', e);
    }
})();
