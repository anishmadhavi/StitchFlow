/**
 * hooks/useData.ts
 * Purpose: Manages data fetching and real-time subscriptions
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

    // Setup Real-time Subscription for Profiles
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        (payload) => {
          console.log('🔄 Profile changed:', payload);
          fetchData();
        }
      )
      .subscribe();

    // Setup Real-time Subscription for Batches
    const batchesChannel = supabase
      .channel('batches-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'batches' }, 
        (payload) => {
          console.log('🔄 Batch changed:', payload);
          fetchData();
        }
      )
      .subscribe();

    // Setup Real-time Subscription for Assignments
    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignments' }, 
        (payload) => {
          console.log('🔄 Assignment changed:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(profilesChannel).catch(err => console.error('Channel cleanup error:', err));
      supabase.removeChannel(batchesChannel).catch(err => console.error('Channel cleanup error:', err));
      supabase.removeChannel(assignmentsChannel).catch(err => console.error('Channel cleanup error:', err));
    };
  }, [currentUser]);

  return { users, batches, dataLoading };
}
