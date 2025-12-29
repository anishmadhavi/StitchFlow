/**
 * hooks/useData.ts
 * Purpose: Manages data fetching and real-time subscriptions, Fetches users and batches from DB, Sets up real-time subscriptions, **Exports:** `useData(currentUser)` hook
 */

import { useState, useEffect } from 'react';
import { supabase } from '../src/supabaseClient';
import { User, Batch } from '../types';

export function useData(currentUser: User | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setDataLoading(false);
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch Profiles (Users)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        // Fetch Batches with their Assignments (Nested join)
        const { data: batches, error: batchesError } = await supabase
          .from('batches')
          .select('*, assignments(*)')
          .order('created_at', { ascending: false });
        
        if (profilesError) console.error('Profiles fetch error:', profilesError);
        if (batchesError) console.error('Batches fetch error:', batchesError);
        
        setUsers(profiles || []);
        setBatches((batches || []).map(batch => ({
          ...batch,
          assignments: batch.assignments || []
        })));
      } catch (error) {
        console.error('Data fetch error:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();

    // Setup Real-time Subscription
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();

    return () => { 
      supabase.removeChannel(channel).catch(err => console.error('Channel cleanup error:', err));
    };
  }, [currentUser]);

  return { users, batches, dataLoading };
}
