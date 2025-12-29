import React, { useState, useEffect } from 'react';
import { AppState, Role, Batch, SizeQty, User, AssignmentStatus, BatchStatus, LedgerEntry, Assignment } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { KarigarDashboard } from './components/KarigarDashboard';
import { QCDashboard } from './components/QCDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { Login } from './components/Login';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient'; // Ensure this file exists

export default function App() {
  const [state, setState] = useState<AppState>({
    currentUser: null, 
    users: [],
    batches: []
  });
  
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Real-time Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
       // Fetch Profiles
       const { data: profiles } = await supabase.from('profiles').select('*');
       // Fetch Batches
       const { data: batches } = await supabase.from('batches').select('*, assignments(*)').order('created_at', { ascending: false });
       
       setState(prev => ({ 
         ...prev, 
         users: profiles || [], 
         batches: batches || [] 
       }));
    };

    fetchData();

    // Optional: Setup real-time subscription to auto-refresh UI
    const batchSubscription = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(batchSubscription); };
  }, []);

  // --- Login Handler ---
  const handleLogin = async (mobile: string, pin: string) => {
    setAuthLoading(true);
    setAuthError(null);

    // Append dummy domain for Supabase Auth compatibility
    const email = `${mobile}@stitchflow.app`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pin,
    });

    if (error) {
      setAuthError("Login failed: " + error.message);
      setAuthLoading(false);
      return;
    }

    // Fetch the full profile of the logged-in user
    const { data: profile } = await supabase
      .from('profiles')
      .underline()
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      setState(prev => ({ ...prev, currentUser: profile }));
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // --- Database Actions ---

  const createBatch = async (batchData: Partial<Batch>) => {
    const { data, error } = await supabase
      .from('batches')
      .insert([{
        style_name: batchData.styleName,
        sku: batchData.sku,
        image_url: batchData.imageUrl,
        rate_per_piece: batchData.ratePerPiece,
        status: BatchStatus.PENDING_MATERIAL,
        planned_qty: batchData.plannedQty,
        available_qty: {},
        actual_cut_qty: {}
      }])
      .select();

    if (error) alert("Error creating batch: " + error.message);
  };

  const addUser = async (name: string, role: Role, mobile: string, pin: string) => {
    // Calls the Edge Function you shared
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { name, role, mobile, pin }
    });

    if (error) alert("Error creating staff: " + error.message);
    else alert("Staff created successfully");
  };

  // ... (Other functions like finalizeCut, assignToKarigar would similarly 
  // use supabase.from('batches').update() instead of setState locally)

  if (!state.currentUser) {
    return <Login onLogin={handleLogin} onSignUp={() => {}} loading={authLoading} error={authError} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg"><LayoutDashboard className="text-white w-5 h-5" /></div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">StitchFlow</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <img src={state.currentUser.avatarUrl || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full border" alt="" />
                 <div className="text-sm hidden sm:block text-right">
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
            onCreateBatch={createBatch} onAddUser={addUser}
            onPayKarigar={() => {}} onArchiveBatch={() => {}} onDeleteUser={() => {}} onAssignToKarigar={() => {}}
          />
        )}
        {/* ... Other dashboards remain similar */}
      </main>
    </div>
  );
}
