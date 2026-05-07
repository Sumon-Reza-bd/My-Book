import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

console.log('Supabase Init Info:', {
  hasUrl: !!supabaseUrl,
  urlLength: supabaseUrl.length,
  urlStart: supabaseUrl.substring(0, 15),
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey.length
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
