/**
 * App.tsx
 * Purpose: Main Application Component.
 * Description: Handles high-level state (User, Batches), Authentication flows, and Role-Based Routing (Admin vs Manager vs Karigar vs QC).
 * Compatibility: Client-side React, compatible with Cloudflare Pages.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { AppState, Role, Batch, SizeQty, User, AssignmentStatus, BatchStatus, LedgerEntry, Assignment } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { KarigarDashboard } from './components/KarigarDashboard';
import { QCDashboard } from './components/QCDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { Login } from './components/Login';
import { Users, LayoutDashboard, LogOut } from 'lucide-react';
import { SIZE_OPTIONS } from './constants';

export default function App() {
  const [state, setState] = useState<AppState>({
    currentUser: null, 
    users: [], // Initialized as empty for production
    batches: [] // Initialized as empty for production
  });
  
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Data Fetching (Production Placeholder) ---
  useEffect(() => {
    // TODO: Connect to Supabase here to fetch real Users and Batches
    // Example:
    // const fetchData = async () => {
    //    const { data: users } = await supabase.from('profiles').select('*');
    //    const { data: batches } = await supabase.from('batches').select('*');
    //    setState(prev => ({ ...prev, users: users || [], batches: batches || [] }));
    // };
    // fetchData();
  }, []);

  // --- Login Handler ---
const handleLogin = async (identifier: string, secret: string) => {
    setAuthLoading(true);
    setAuthError(null);

    // Bridge mobile-only UI with Supabase email-based Auth
    const email = identifier.includes('@') ? identifier : `${identifier}@stitchflow.app`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: secret,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profile) setState(prev => ({ ...prev, currentUser: profile }));
    }
    setAuthLoading(false);
  };

  const handleSignUp = async (name: string, email: string, secret: string) => {
    setAuthLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In Production: Call Supabase Auth SignUp here
    const newAdmin: User = {
      id: `admin_${Date.now()}`,
      name: name,
      role: Role.ADMIN,
      walletBalance: 0,
      ledger: [],
      mobile: email, // Using email field as identifier
      displayPin: secret
    };

    setState(prev => ({
      ...prev,
      users: [...prev.users, newAdmin],
      currentUser: newAdmin
    }));
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // --- Actions ---

  const addUser = (name: string, role: Role, mobile: string, pin: string) => {
    // In production, this calls supabase Edge Function
    const newUser: User = {
      id: `${role.toLowerCase().substring(0, 1)}${Date.now()}`,
      name,
      role,
      walletBalance: 0,
      ledger: [],
      avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
      mobile,
      displayPin: pin
    };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setState(prev => {
      const updatedUsers = prev.users.map(u => u.id === userId ? { ...u, ...updates } : u);
      // Also update currentUser if it matches the updated user
      const currentUser = prev.currentUser?.id === userId ? { ...prev.currentUser, ...updates } : prev.currentUser;
      return {
        ...prev,
        users: updatedUsers,
        currentUser
      };
    });
  };

  const deleteUser = (userId: string) => {
    if (userId === state.currentUser?.id) return; // Prevent self-delete
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }));
  };

  const createBatch = (batchData: Partial<Batch>) => {
    const newBatch: Batch = {
      id: `b${Date.now()}`,
      styleName: batchData.styleName!,
      sku: batchData.sku!,
      imageUrl: batchData.imageUrl!,
      ratePerPiece: batchData.ratePerPiece!,
      status: BatchStatus.PENDING_MATERIAL,
      createdAt: new Date().toISOString(),
      plannedQty: batchData.plannedQty!,
      actualCutQty: {},
      availableQty: {},
      assignments: []
    };
    setState(prev => ({ ...prev, batches: [newBatch, ...prev.batches] }));
  };

  const finalizeCut = (batchId: string, actualQty: SizeQty) => {
    setState(prev => ({
      ...prev,
      batches: prev.batches.map(b => {
        if (b.id !== batchId) return b;
        // Filter out 0 quantities to keep data clean
        const cleanQty: SizeQty = {};
        Object.entries(actualQty).forEach(([k,v]) => {
           if (v > 0) cleanQty[k] = v;
        });

        return {
          ...b,
          actualCutQty: cleanQty,
          availableQty: { ...cleanQty }, // Initial available is the full cut
          status: BatchStatus.CUTTING_DONE
        };
      })
    }));
  };

  const assignToKarigar = (batchId: string, karigarId: string, qty: SizeQty) => {
    const karigar = state.users.find(u => u.id === karigarId);
    if (!karigar) return;

    setState(prev => ({
      ...prev,
      batches: prev.batches.map(b => {
        if (b.id !== batchId) return b;
        
        // Decrement available qty
        const newAvailable = { ...b.availableQty };
        Object.entries(qty).forEach(([size, amount]) => {
          if (amount > 0) {
            newAvailable[size] = (newAvailable[size] || 0) - amount;
          }
        });

        // Filter out 0 assignment
        const cleanAssignedQty: SizeQty = {};
        Object.entries(qty).forEach(([k,v]) => { if(v>0) cleanAssignedQty[k] = v });

        const newAssignment = {
          id: `a${Date.now()}`,
          karigarId,
          karigarName: karigar.name,
          assignedQty: cleanAssignedQty,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: new Date().toISOString()
        };

        return {
          ...b,
          availableQty: newAvailable,
          assignments: [...b.assignments, newAssignment],
          status: BatchStatus.IN_PRODUCTION
        };
      })
    }));
  };

  const updateAssignmentStatus = (batchId: string, assignmentId: string, newStatus: AssignmentStatus) => {
    setState(prev => {
      let updatedBatches = prev.batches.map(b => {
        if (b.id !== batchId) return b;
        
        // Handle Rejection Logic (Return stock)
        let newAvailable = { ...b.availableQty };
        if (newStatus === AssignmentStatus.REJECTED) {
            const assignment = b.assignments.find(a => a.id === assignmentId);
            if (assignment) {
              Object.entries(assignment.assignedQty).forEach(([size, amount]) => {
                newAvailable[size] = (newAvailable[size] || 0) + amount;
              });
            }
        }

        return {
          ...b,
          availableQty: newAvailable,
          assignments: b.assignments.map(a => 
            a.id === assignmentId ? { ...a, status: newStatus, completedAt: newStatus === AssignmentStatus.STITCHED ? new Date().toISOString() : a.completedAt } : a
          )
        };
      });
      return { ...prev, batches: updatedBatches };
    });
  };

  const handleQCSubmit = (batchId: string, assignmentId: string, passedQty: SizeQty) => {
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch) return;
    const assignment = batch.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Calculate Split: Rework vs Passed
    const currentAssigned = assignment.assignedQty;
    const reworkQty: SizeQty = {};
    const finalPassedQty: SizeQty = {};
    
    let hasRework = false;
    let hasPassed = false;

    Object.entries(currentAssigned).forEach(([size, total]) => {
        const passed = passedQty[size] || 0;
        const rework = (total as number) - passed;
        
        if (passed > 0) {
            finalPassedQty[size] = passed;
            hasPassed = true;
        }
        if (rework > 0) {
            reworkQty[size] = rework;
            hasRework = true;
        }
    });

    const totalPassedCount = Object.values(finalPassedQty).reduce((a, b) => a + b, 0);
    const amount = totalPassedCount * batch.ratePerPiece;

    setState(prev => {
      // 1. Update User Ledger (Pay only for passed)
      const updatedUsers = prev.users.map(u => {
        if (u.id !== assignment.karigarId) return u;
        
        if (amount > 0) {
            const newLedgerEntry: LedgerEntry = {
              id: `l${Date.now()}`,
              date: new Date().toISOString(),
              description: `Work Completed: ${batch.styleName} (${totalPassedCount} pcs)`,
              amount: amount,
              type: 'CREDIT',
              relatedBatchId: batchId
            };
            return {
              ...u,
              walletBalance: u.walletBalance + amount,
              ledger: [...u.ledger, newLedgerEntry]
            };
        }
        return u;
      });

      // 2. Update Batch Assignments (Split logic)
      const updatedBatches = prev.batches.map(b => {
        if (b.id !== batchId) return b;
        
        let newAssignments = [...b.assignments];
        
        // CASE A: All Passed
        if (!hasRework && hasPassed) {
             newAssignments = newAssignments.map(a => 
                 a.id === assignmentId ? { ...a, status: AssignmentStatus.QC_PASSED } : a
             );
        }
        // CASE B: All Failed/Rework
        else if (hasRework && !hasPassed) {
             newAssignments = newAssignments.map(a => 
                 a.id === assignmentId ? { ...a, status: AssignmentStatus.QC_REWORK } : a
             );
        }
        // CASE C: Partial Split
        else if (hasRework && hasPassed) {
             // 1. Modify the EXISTING assignment to contain only the Rework items
             newAssignments = newAssignments.map(a => 
                 a.id === assignmentId ? { 
                     ...a, 
                     assignedQty: reworkQty, 
                     status: AssignmentStatus.QC_REWORK 
                 } : a
             );

             // 2. Create a NEW assignment for the Passed items (Archived/Completed state)
             const passedAssignment: Assignment = {
                 ...assignment,
                 id: `${assignment.id}_passed_${Date.now()}`,
                 assignedQty: finalPassedQty,
                 status: AssignmentStatus.QC_PASSED,
                 completedAt: new Date().toISOString()
             };
             newAssignments.push(passedAssignment);
        }

        return {
          ...b,
          assignments: newAssignments
        };
      });

      // SYNC CURRENT USER
      const currentUser = prev.currentUser && updatedUsers.find(u => u.id === prev.currentUser!.id) 
        ? updatedUsers.find(u => u.id === prev.currentUser!.id)! 
        : prev.currentUser;

      return {
        ...prev,
        currentUser,
        users: updatedUsers,
        batches: updatedBatches
      };
    });
  };

  const handleTransaction = (userId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') => {
    setState(prev => {
      const updatedUsers = prev.users.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          walletBalance: type === 'CREDIT' ? u.walletBalance + amount : u.walletBalance - amount,
          ledger: [...u.ledger, {
            id: `txn${Date.now()}`,
            date: new Date().toISOString(),
            description: remark || (type === 'CREDIT' ? 'Manual Credit / Opening Bal' : 'Manual Debit / Advance'),
            amount: amount,
            type: type
          }]
        };
      });

      // SYNC CURRENT USER
      const currentUser = prev.currentUser && updatedUsers.find(u => u.id === prev.currentUser!.id) 
        ? updatedUsers.find(u => u.id === prev.currentUser!.id)! 
        : prev.currentUser;

      return {
        ...prev,
        currentUser,
        users: updatedUsers
      };
    });
  };

  const handleArchive = (batchId: string) => {
    setState(prev => ({
      ...prev,
      batches: prev.batches.map(b => b.id === batchId ? { ...b, status: BatchStatus.ARCHIVED } : b)
    }));
  };

  // --- Render ---

  // 1. Show Login Screen if no user
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

  // 2. Show Main App
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">StitchFlow</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <img src={state.currentUser.avatarUrl || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-full border bg-gray-200 object-cover" alt="" />
                 <div className="text-sm hidden sm:block text-right">
                    <p className="font-medium text-gray-900">{state.currentUser.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{state.currentUser.role}</p>
                 </div>
             </div>
             <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-gray-100">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {state.currentUser.role === Role.ADMIN && (
          <AdminDashboard 
            batches={state.batches}
            users={state.users}
            onCreateBatch={createBatch}
            onPayKarigar={handleTransaction}
            onArchiveBatch={handleArchive}
            onAddUser={addUser}
            onDeleteUser={deleteUser}
            onAssignToKarigar={assignToKarigar}
          />
        )}

        {state.currentUser.role === Role.MANAGER && (
          <ManagerDashboard 
            batches={state.batches}
            users={state.users}
            onCreateBatch={createBatch}
            onFinalizeCut={finalizeCut}
            onAssignToKarigar={assignToKarigar}
            onSubmitQC={handleQCSubmit}
          />
        )}

        {state.currentUser.role === Role.MASTER && (
          <MasterDashboard 
            batches={state.batches}
            karigars={state.users.filter(u => u.role === Role.KARIGAR)}
            onFinalizeCut={finalizeCut}
            onAssignToKarigar={assignToKarigar}
          />
        )}

        {state.currentUser.role === Role.KARIGAR && (
          <KarigarDashboard 
            currentUser={state.currentUser}
            batches={state.batches}
            onAcceptAssignment={(bid, aid) => updateAssignmentStatus(bid, aid, AssignmentStatus.ACCEPTED)}
            onRejectAssignment={(bid, aid) => updateAssignmentStatus(bid, aid, AssignmentStatus.REJECTED)}
            onMarkComplete={(bid, aid) => updateAssignmentStatus(bid, aid, AssignmentStatus.STITCHED)}
            onUpdateUser={updateUser}
          />
        )}

        {state.currentUser.role === Role.QC && (
          <QCDashboard 
            batches={state.batches}
            onSubmitQC={handleQCSubmit}
          />
        )}
      </main>
    </div>
  );
}
