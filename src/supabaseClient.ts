import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdrvifpydrlykhbnvtxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcnZpZnB5ZHJseWtoYm52dHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NTE3MjIsImV4cCI6MjA4MjQyNzcyMn0.7ADcYdm1NzJBeOgoKRAbh7q86upbM_54UXWGMDoGpHY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
auth: {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  storageKey: 'stitchflow-v1',
  storage: window.localStorage,
},
