import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://moiiawoxpkxodkncmfxz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaWlhd294cGt4b2RrbmNtZnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTEyOTEsImV4cCI6MjA5MTM4NzI5MX0.Rap30IEKCH9BbdijSMoblIsg96FuxTYT9R2HH5E4Ukc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'stitchflow-v2',
    storage: window.localStorage,
  },
});
