import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'SUPABASE_URL'; // Get this from Supabase Project Settings > API
const supabaseAnonKey = 'SUPABASE_ANON_KEY'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
