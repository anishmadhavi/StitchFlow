/**
 * hooks/useData.ts
 * STATUS: FULLY MAPPED (Ensures Passbook & Rework visibility) ✅
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/supabaseClient';
import { User, Batch } from '../types';

export function useData(currentUser: User | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // 1. Define fetchData as a reusable function
  const fetchData = useCallback(async () => {
    try {
      // Fetch Profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      // Fetch Batches with Nested Assignments
      const { data: rawBatches, error: batchesError } = await supabase
        .from('batches')
        .select('*, assignments(*)')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      if (batchesError) throw batchesError;
      
      // 2. Map Users (Critical for Passbook visibility)
      const formattedUsers = (profiles || []).map((u: any) => ({
        ...u,
        walletBalance: u.wallet_balance || 0, // Ensure snake_case maps to camelCase
        avatarUrl: u.avatar_url,
        displayPin: u.display_pin,
        ledger: u.ledger || [] // Ensure ledger is never null
      }));
      setUsers(formattedUsers);

      // 3. Map Batches & Assignments (Critical for Rework visibility)
      const formattedBatches = (rawBatches || []).map((b: any) => ({
        ...b,
        styleName: b.style_name,
        ratePerPiece: b.rate_per_piece,
        imageUrl: b.image_url,
        plannedQty: b.planned_qty,
        actualCutQty: b.actual_cut_qty,
        availableQty: b.available_qty,
        
        // Map Nested Assignments so KarigarDashboard sees the status changes
        assignments: (b.assignments || []).map((a: any) => ({
          ...a,
          batchId: a.batch_id,
          karigarId: a.karigar_id,
          karigarName: a.karigar_name,
          assignedQty: a.assigned_qty,
          assignedAt: a.assigned_at,
          qcNotes: a.qc_notes // Used to tell Karigar what to fix in Rework
        }))
      }));

      setBatches(formattedBatches);

    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // 4. Initial Fetch & Real-time Subscriptions
  useEffect(() => {
    if (!currentUser) {
      setDataLoading(false);
      return;
    }

    fetchData();

    // Re-fetch on any database change to keep UI in sync
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe();

    const batchesChannel = supabase
      .channel('batches-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => fetchData())
      .subscribe();

    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchData())
      .subscribe();

    return () => { 
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(batchesChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [currentUser, fetchData]);

  return { users, batches, dataLoading, refreshData: fetchData };
}
