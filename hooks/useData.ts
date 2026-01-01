/**
 * hooks/useData.ts
 * STATUS: FIXED (Added Snake_case -> CamelCase mapping) ✅
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
        // 1. Fetch Profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        // 2. Fetch Batches with Assignments
        const { data: rawBatches, error: batchesError } = await supabase
          .from('batches')
          .select('*, assignments(*)')
          .order('created_at', { ascending: false });
        
        if (profilesError) console.error('Profiles fetch error:', profilesError);
        if (batchesError) console.error('Batches fetch error:', batchesError);
        
        // 3. Map Users (Profiles) - FIX: Added Snake_case -> CamelCase mapping
        const formattedUsers = (profiles || []).map((u: any) => ({
          ...u,
          walletBalance: u.wallet_balance || 0, // Map DB to UI
          avatarUrl: u.avatar_url,
          displayPin: u.display_pin,
          ledger: u.ledger || []
        }));
        setUsers(formattedUsers);

        // 4. ✅ FIX: Map Batches (Snake_case -> CamelCase)
        const formattedBatches = (rawBatches || []).map((b: any) => ({
          ...b,
          // Map Database Columns -> UI Properties
          styleName: b.style_name,      // 👈 Critical Fix
          ratePerPiece: b.rate_per_piece,
          imageUrl: b.image_url,
          plannedQty: b.planned_qty,    // 👈 Critical Fix (Prevents Crash)
          actualCutQty: b.actual_cut_qty,
          availableQty: b.available_qty,
          
          // Map Nested Assignments
          assignments: (b.assignments || []).map((a: any) => ({
            ...a,
            batchId: a.batch_id,
            karigarId: a.karigar_id,
            karigarName: a.karigar_name,
            assignedQty: a.assigned_qty,
            assignedAt: a.assigned_at,
            qcNotes: a.qc_notes
          }))
        }));

        setBatches(formattedBatches);

      } catch (error) {
        console.error('Data fetch error:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();

    // --- Real-time Subscriptions (Keep these as they were) ---
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => fetchData() // Simple reload on change
      )
      .subscribe();

    const batchesChannel = supabase
      .channel('batches-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'batches' }, 
        () => fetchData()
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assignments' }, 
        () => fetchData()
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(batchesChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [currentUser]);

  return { users, batches, dataLoading };
}
