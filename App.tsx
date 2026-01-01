/**
 * App.tsx
 * STATUS: FIXED (Instant Force Logout) 🛠️
 */

import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { userService } from './services/userService';
import { batchService } from './services/batchService';
import { assignmentService } from './services/assignmentService';
import { Role, AssignmentStatus } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { KarigarDashboard } from './components/KarigarDashboard';
import { QCDashboard } from './components/QCDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { Login } from './components/Login';
import { LayoutDashboard, LogOut } from 'lucide-react';

export default function App() {
  console.log('🚀 App component mounting...');
  
  // Custom hooks
  const { currentUser, authLoading, authError, handleLogin, handleSignUp, handleLogout } = useAuth();
  cconst { users, batches, dataLoading } = useData(currentUser);

// ✅ FIND MAPPED USER: This gets the version with updated Wallet & Ledger
const mappedUser = users.find(u => u.id === currentUser?.id) || currentUser;

  // ✅ INSTANT FORCE LOGOUT (No Waiting)
  const handleForceLogout = () => {
    console.log("👋 Logout Triggered - FORCE MODE");
    
    // 1. Clear Local Data IMMEDIATELY
    // We do not wait for the server. We just delete the keys.
    localStorage.removeItem('stitchflow-v2');
    localStorage.removeItem('sb-access-token'); // Clear Supabase defaults if any
    localStorage.clear(); // Nuclear option: Clear everything

    // 2. Fire Supabase logout in background (Don't wait/await for it!)
    // This tells the server "I'm leaving", but we don't care about the reply.
    try {
      handleLogout().catch(err => console.warn("Background logout error:", err));
    } catch (e) {
      console.warn("Logout trigger failed", e);
    }

    // 3. Force Hard Reload to Login Page
    window.location.href = '/'; 
  };

  // Show login screen if not authenticated
  if (!currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
        onSignUp={handleSignUp}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Show loading screen while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">StitchFlow</h1>
          </div>
          
          <div className="flex items-center gap-4">
  {/* ✅ DISPLAY NAME ONLY - NO IMAGE */}
  <div className="text-right">
    <p className="font-bold text-black text-base leading-none">
      {currentUser.name}
    </p>
    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">
      {currentUser.role}
    </p>
  </div>
            
            {/* ✅ INSTANT LOGOUT BUTTON */}
            <button 
              onClick={handleForceLogout} 
              className="text-gray-400 hover:text-red-600 p-2 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Role-based Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {currentUser.role === Role.ADMIN && (
          <AdminDashboard 
            batches={batches}
            users={users}
            onCreateBatch={batchService.createBatch}
            onPayKarigar={userService.handleTransaction}
            onArchiveBatch={batchService.handleArchive}
            onAddUser={userService.addUser}
            onDeleteUser={(userId) => userService.deleteUser(userId, currentUser.id)}
            onUpdateUser={userService.updateUser}
            onDeleteBatch={batchService.deleteBatch}
            onAssignToKarigar={(bId, kId, qty) => batchService.assignToKarigar(bId, kId, qty, batches, users)}
          />
        )}

        {currentUser.role === Role.MANAGER && (
          <ManagerDashboard 
            batches={batches}
            users={users}
            onCreateBatch={batchService.createBatch}
            onFinalizeCut={batchService.finalizeCut}
            onDeleteBatch={batchService.deleteBatch}
            onAssignToKarigar={(bId, kId, qty) => batchService.assignToKarigar(bId, kId, qty, batches, users)}
            onSubmitQC={(bId, aId, qty) => assignmentService.handleQCSubmit(bId, aId, qty, batches)}
          />
        )}

        {currentUser.role === Role.MASTER && (
          <MasterDashboard 
            batches={batches}
            karigars={users.filter(u => u.role === Role.KARIGAR)}
            onFinalizeCut={batchService.finalizeCut}
            onAssignToKarigar={(bId, kId, qty) => batchService.assignToKarigar(bId, kId, qty, batches, users)}
          />
        )}

        {currentUser.role === Role.KARIGAR && (
          <KarigarDashboard 
            currentUser={mappedUser as User}
            batches={batches}
            onAcceptAssignment={(_, aId) => assignmentService.updateAssignmentStatus(aId, AssignmentStatus.ACCEPTED)}
            onRejectAssignment={(_, aId) => assignmentService.updateAssignmentStatus(aId, AssignmentStatus.REJECTED)}
            onMarkComplete={(_, aId) => assignmentService.updateAssignmentStatus(aId, AssignmentStatus.STITCHED)}
            onUpdateUser={userService.updateUser}
          />
        )}

        {currentUser.role === Role.QC && (
          <QCDashboard 
            batches={batches}
            onSubmitQC={(bId, aId, qty) => assignmentService.handleQCSubmit(bId, aId, qty, batches)}
          />
        )}
      </main>
    </div>
  );
}
