import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are loaded
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("supabaseUrl or supabaseKey is missing");
}

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
