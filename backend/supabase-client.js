import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Supabase features will be disabled.');
  console.warn('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables to enable.');
}

// Create Supabase client
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

let supabaseConnected = false;

// Test connection
if (supabase) {
  supabase
    .from('users')
    .select('count')
    .limit(1)
    .then(() => {
      supabaseConnected = true;
      console.log('✅ Supabase connected successfully');
    })
    .catch((error) => {
      console.warn('⚠️  Supabase connection test failed:', error.message);
      console.warn('   This is normal if tables don\'t exist yet. Run the schema migration.');
      supabaseConnected = false;
    });
} else {
  console.warn('⚠️  Supabase client not initialized. Proceeding with SQLite only.');
}

export { supabase, supabaseConnected };
export default supabase;

