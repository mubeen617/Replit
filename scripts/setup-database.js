import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up database with Supabase...');
  
  try {
    // Test the connection
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('Creating database schema...');
      
      // Enable UUID extension
      await supabase.rpc('exec', {
        query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
      });
      
      console.log('Database setup attempted. Check Supabase dashboard for table creation.');
    } else {
      console.log('Database connection successful! Tables exist.');
    }
    
  } catch (err) {
    console.error('Database setup error:', err);
  }
}

setupDatabase();