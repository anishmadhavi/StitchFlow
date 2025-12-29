/**
 * App.tsx
 * Purpose: Main Application Component.
 * Description: Handles persistent state via Supabase, Authentication, and Role-Based Routing.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from './src/supabaseClient'; // Ensure this path is correct for your build
import { AppState, Role, Batch, SizeQty, User, AssignmentStatus, BatchStatus, LedgerEntry, Assignment } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { KarigarDashboard } from './components/KarigarDashboard';
import { QCDashboard } from './components/QCDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { Login } from './components/Login';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { SIZE_OPTIONS } from './constants';

export default function App() {
  // Debug: Log when App mounts
  console.log('🚀 App component mounting...');
  console.log('📦 localStorage stitchflow-v2:', localStorage.getItem('stitchflow-v2') ? 'EXISTS' : 'MISSING');

  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    batches: []
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 🔐 Restore session on page reload
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('🔍 Initializing auth...');
      
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setAuthError("Session error: " + sessionError.message);
          setAuthLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Session found:', session.user.id);
          console.log('📡 Fetching profile...');
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;
          
          if (profileError) {
            console.error('❌ Profile error:', profileError);
            setAuthError(`Profile error: ${profileError.message}`);
            setState(prev => ({ ...prev, currentUser: null }));
            setAuthLoading(false);
          } else {
            console.log('✅ Profile loaded:', profile.name);
            setState(prev => ({ ...prev, currentUser: profile }));
            setAuthError(null);
            setAuthLoading(false);
          }
        } else {
          console.log('ℹ️ No session found');
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('💥 Init error:', error);
        setAuthLoading(false);
      }
    };

    // Initialize immediately
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth event:', event, 'Session exists:', !!session);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setState(prev => ({ ...prev, currentUser: null }));
        setAuthError(null);
        setAuthLoading(false);
        return;
      }
      
      // Handle INITIAL_SESSION, SIGNED_IN, and TOKEN_REFRESHED
      if (session?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log('👤 User authenticated:', session.user.id);
        console.log('📡 Fetching profile for event:', event);
        
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;
          
          if (error) {
            console.error('❌ Profile fetch error:', error);
            setAuthError(`Profile error: ${error.message}`);
            setState(prev => ({ ...prev, currentUser: null }));
          } else {
            console.log('✅ Profile set:', profile.name);
            setState(prev => ({ ...prev, currentUser: profile }));
            setAuthError(null);
          }
        } catch (error) {
          console.error('💥 Profile fetch exception:', error);
          setAuthError('Failed to load profile');
        } finally {
          setAuthLoading(false);
        }
      } else if (event === 'INITIAL_SESSION' && !session) {
        // No session on initial load
        console.log('ℹ️ Initial session: no user');
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- 1. Real-time Data Fetching ---
  useEffect(() => {
    // Only fetch data if a user is logged in
    if (!state.currentUser) return;

    const fetchData = async () => {
       // Fetch Profiles (Users)
       const { data: profiles } = await supabase
         .from('profiles')
         .select('*');

       // Fetch Batches with their Assignments (Nested join)
       const { data: batches } = await supabase
         .from('batches')
         .select('*, assignments(*)')
         .order('created_at', { ascending: false });
       
       setState(prev => ({ 
         ...prev, 
         users: profiles || [], 
         batches: batches || [] 
       }));
    };

    fetchData();

    // Setup Real-time Subscription to auto-refresh UI on any DB change
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [state.currentUser]);

  // --- 2. Authentication Handlers ---
  
const handleLogin = async (identifier: string, secret: string) => {
    setAuthLoading(true);
    setAuthError(null);

    const email = identifier.includes('@') ? identifier : `${identifier}@stitchflow.app`;

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: secret,
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
    // Don't stop loading here - the onAuthStateChange listener will handle it
    // and set the profile, which will stop the loading spinner
  };

const handleSignUp = async (name: string, email: string, secret: string) => {
  setAuthLoading(true);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: secret,
    options: {
      // The SQL Trigger looks EXACTLY for these keys: 'name' and 'role'
      data: { 
        name: name,
        role: 'ADMIN', // Hardcoded as ADMIN for this signup route
      }
    }
  });

  if (error) {
    setAuthError(error.message);
  } else {
    alert("Admin account created! Please log in.");
  }
  setAuthLoading(false);
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // --- 3. User & Staff Management ---

const addUser = async (name: string, role: Role, mobile: string, pin: string) => {
    // 1. Log the attempt locally for tracking
    console.log("Invoking Add-User for:", name);

    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { name, role, mobile, pin }
    });

    // 2. Check for connection errors (e.g., wrong function name)
    if (error) {
      console.error("Connection Error:", error);
      alert("Network error: " + error.message);
      return;
    }

    // 3. Check for database errors returned INSIDE the function response
    if (data?.error) {
      console.error("Database Error from Function:", data.error);
      alert("Database Error: " + data.error);
      return;
    }

    console.log("Success:", data);
    alert("Staff member created successfully!");
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    // Map CamelCase back to snake_case for Supabase
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) alert("Update failed: " + error.message);
  };

  const deleteUser = async (userId: string) => {
    if (userId === state.currentUser?.id) return; 
    
    // Note: Deleting from 'profiles' won't delete the Auth user unless 
    // you have an Edge Function or Trigger. For now, we update the profile.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) alert("Delete failed: " + error.message);
  };

  // --- 4. Production & Batch Logic ---

  const createBatch = async (batchData: Partial<Batch>) => {
    const { error } = await supabase
      .from('batches')
      .insert([{
        style_name: batchData.styleName,
        sku: batchData.sku,
        image_url: batchData.imageUrl,
        rate_per_piece: batchData.ratePerPiece,
        planned_qty: batchData.plannedQty,
        available_qty: batchData.plannedQty, // Full initial stock
        status: 'Pending Material'
      }]);

    if (error) alert("Error creating batch: " + error.message);
  };

  const finalizeCut = async (batchId: string, actualQty: SizeQty) => {
    const { error } = await supabase
      .from('batches')
      .update({
        actual_cut_qty: actualQty,
        available_qty: actualQty,
        status: 'Cutting Done'
      })
      .eq('id', batchId);

    if (error) alert("Error finalizing cut: " + error.message);
  };

  const assignToKarigar = async (batchId: string, karigarId: string, qty: SizeQty) => {
    const karigar = state.users.find(u => u.id === karigarId);
    if (!karigar) return;

    // 1. Calculate remaining stock
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch) return;

    const newAvailable = { ...batch.availableQty };
    Object.entries(qty).forEach(([size, amount]) => {
      newAvailable[size] = (newAvailable[size] || 0) - amount;
    });

    // 2. Insert Assignment
    const { error: assignError } = await supabase
      .from('assignments')
      .insert([{
        batch_id: batchId,
        karigar_id: karigarId,
        karigar_name: karigar.name,
        assigned_qty: qty,
        status: 'Assigned'
      }]);

    // 3. Update Batch Available Stock
    const { error: batchError } = await supabase
      .from('batches')
      .update({ 
        available_qty: newAvailable,
        status: 'In Production' 
      })
      .eq('id', batchId);

    if (assignError || batchError) alert("Error during assignment");
  };

  const updateAssignmentStatus = async (batchId: string, assignmentId: string, newStatus: AssignmentStatus) => {
    const { error } = await supabase
      .from('assignments')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'Stitched' ? new Date().toISOString() : null
      })
      .eq('id', assignmentId);

    if (error) alert("Update failed: " + error.message);
  };

  const handleQCSubmit = async (batchId: string, assignmentId: string, passedQty: SizeQty) => {
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch) return;
    const assignment = batch.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const totalPassedCount = Object.values(passedQty).reduce((a, b) => a + (b as number), 0);
    const amount = totalPassedCount * batch.ratePerPiece;

    // 1. Mark current assignment as QC Passed
    const { error: assignError } = await supabase
      .from('assignments')
      .update({ status: 'QC Passed' })
      .eq('id', assignmentId);

    // 2. Add to Ledger and Wallet
    if (amount > 0) {
      await supabase.from('ledger_entries').insert([{
        user_id: assignment.karigarId,
        description: `QC Passed: ${batch.styleName} (${totalPassedCount} pcs)`,
        amount: amount,
        type: 'CREDIT',
        related_batch_id: batchId
      }]);

      await supabase.rpc('increment_wallet', { 
        user_id: assignment.karigarId, 
        amount: amount 
      });
    }

    if (assignError) alert("QC processing error");
  };

  const handleTransaction = async (userId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') => {
    const signedAmount = type === 'CREDIT' ? amount : -amount;

    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert([{
        user_id: userId,
        description: remark || (type === 'CREDIT' ? 'Manual Credit' : 'Manual Debit'),
        amount: amount,
        type: type
      }]);

    const { error: walletError } = await supabase.rpc('increment_wallet', { 
      user_id: userId, 
      amount: signedAmount 
    });

    if (ledgerError || walletError) alert("Transaction failed");
  };

  const handleArchive = async (batchId: string) => {
    const { error } = await supabase
      .from('batches')
      .update({ status: 'Archived' })
      .eq('id', batchId);
    
    if (error) alert("Archive failed");
  };

  // --- Render ---

  if (!state.currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
        onSignUp={handleSignUp}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg"><LayoutDashboard className="text-white w-5 h-5" /></div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">StitchFlow</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <img src={state.currentUser.avatarUrl || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full border object-cover" alt="" />
                 <div className="text-sm hidden sm:block">
                    <p className="font-medium text-gray-900">{state.currentUser.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{state.currentUser.role}</p>
                 </div>
             </div>
             <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 p-2"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {state.currentUser.role === Role.ADMIN && (
          <AdminDashboard 
            batches={state.batches} users={state.users}
            onCreateBatch={createBatch} onPayKarigar={handleTransaction}
            onArchiveBatch={handleArchive} onAddUser={addUser}
            onDeleteUser={deleteUser} onAssignToKarigar={assignToKarigar}
          />
        )}

        {state.currentUser.role === Role.MANAGER && (
          <ManagerDashboard 
            batches={state.batches} users={state.users}
            onCreateBatch={createBatch} onFinalizeCut={finalizeCut}
            onAssignToKarigar={assignToKarigar} onSubmitQC={handleQCSubmit}
          />
        )}

        {state.currentUser.role === Role.MASTER && (
          <MasterDashboard 
            batches={state.batches}
            karigars={state.users.filter(u => u.role === Role.KARIGAR)}
            onFinalizeCut={finalizeCut} onAssignToKarigar={assignToKarigar}
          />
        )}

        {state.currentUser.role === Role.KARIGAR && (
          <KarigarDashboard 
            currentUser={state.currentUser} batches={state.batches}
            onAcceptAssignment={(bid, aid) => updateAssignmentStatus(bid, aid, AssignmentStatus.ACCEPTED)}
            onRejectAssignment={(bid, aid) => updateAssignmentStatus(bid, aid, AssignmentStatus.REJECTED)}
            onMarkComplete={(bid, aid) => updateAssignmentStatus(bid, aid, AssignmentStatus.STITCHED)}
            onUpdateUser={updateUser}
          />
        )}

        {state.currentUser.role === Role.QC && (
          <QCDashboard 
            batches={state.batches} onSubmitQC={handleQCSubmit}
          />
        )}
      </main>
    </div>
  );
}
