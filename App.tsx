/**
 * App.tsx (Refactored)
 * Purpose: Main Application Component -,  Clean routing logic only, Uses hooks for state, Uses services for operations
 * Description: Role-based routing with separated concerns
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
  console.log('📦 localStorage stitchflow-v2:', localStorage.getItem('stitchflow-v2') ? 'EXISTS' : 'MISSING');

  // Custom hooks handle all the heavy lifting
  const { currentUser, authLoading, authError, handleLogin, handleSignUp, handleLogout } = useAuth();
  const { users, batches, dataLoading } = useData(currentUser);

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
            <div className="flex items-center gap-2">
              <img 
                src={currentUser.avatarUrl || 'https://i.pravatar.cc/150'} 
                className="w-8 h-8 rounded-full border object-cover" 
                alt="" 
              />
              <div className="text-sm hidden sm:block">
                <p className="font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500 uppercase">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="text-gray-400 hover:text-red-600 p-2"
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
            onAssignToKarigar={(bId, kId, qty) => batchService.assignToKarigar(bId, kId, qty, batches, users)}
          />
        )}

        {currentUser.role === Role.MANAGER && (
          <ManagerDashboard 
            batches={batches}
            users={users}
            onCreateBatch={batchService.createBatch}
            onFinalizeCut={batchService.finalizeCut}
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
            currentUser={currentUser}
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
