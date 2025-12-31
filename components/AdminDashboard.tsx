/**
 * components/AdminDashboard.tsx (Updated with Shared Components)
 * Purpose: Admin Interface - Uses shared modals
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Batch, BatchStatus, Role, User, SizeQty, AssignmentStatus } from '../types';
import { Button } from './Shared';

// Tab Components (Admin-specific)
import { BatchesTab } from './admin/BatchesTab';
import { StaffTab } from './admin/StaffTab';
import { PaymentsTab } from './admin/PaymentsTab';
import { SettingsTab } from './admin/SettingsTab';

// Modal Components (Admin-specific)
import { BatchDetailsModal } from './admin/BatchDetailsModal';
import { CreateUserModal } from './admin/CreateUserModal';
import { PassbookModal } from './admin/PassbookModal';

// Shared Modal Components (Used by multiple roles)
import { CreateBatchModal } from './shared/CreateBatchModal';
import { AssignToKarigarModal } from './shared/AssignToKarigarModal';

interface AdminDashboardProps {
  batches: Batch[];
  users: User[];
  onCreateBatch: (batch: Partial<Batch>) => void;
  onPayKarigar: (karigarId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') => void;
  onArchiveBatch: (batchId: string) => void;
  onAddUser: (name: string, role: Role, mobile: string, pin: string) => void;
  onDeleteUser: (userId: string) => void;
  onAssignToKarigar: (batchId: string, karigarId: string, qty: SizeQty) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  batches,
  users,
  onCreateBatch,
  onPayKarigar,
  onArchiveBatch,
  onAddUser,
  onDeleteUser,
  onAssignToKarigar
}) => {
  // 🔍 TEMPORARY DEBUG LOGS
  console.log('🔍 AdminDashboard rendered');
  console.log('📦 batches:', batches);
  console.log('👥 users:', users);
  console.log('📊 batches type:', typeof batches, Array.isArray(batches));
  
  const [activeTab, setActiveTab] = useState<'batches' | 'staff' | 'payments' | 'settings'>('batches');
  
  // Modal states
  const [createBatchModalOpen, setCreateBatchModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [batchDetailsModalOpen, setBatchDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [passbookModalOpen, setPassbookModalOpen] = useState(false);
  
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filtered data
  const activeBatches = (batches || []).filter(b => b.status !== BatchStatus.ARCHIVED);
  const staffUsers = (users || []).filter(u => u.role !== Role.ADMIN);
  const karigars = users.filter(u => u.role === Role.KARIGAR);

  // Helper
  const getActiveAssignments = (userId: string) => {
    return batches.flatMap(b => 
      b.assignments
        .filter(a => a.karigarId === userId && 
          [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.QC_REWORK].includes(a.status))
        .map(a => ({ ...a, batchStyle: b.styleName }))
    );
  };

  // Handlers
  const handleOpenBatchDetails = (batch: Batch) => {
    setSelectedBatch(batch);
    setBatchDetailsModalOpen(true);
  };

  const handleOpenAssignModal = () => {
    setBatchDetailsModalOpen(false);
    setAssignModalOpen(true);
  };

  const handleOpenPassbook = (userId: string) => {
    setSelectedUserId(userId);
    setPassbookModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage production, staff, and finances</p>
        </div>
        <Button onClick={() => setCreateBatchModalOpen(true)}>
          <Plus size={18} className="mr-2" /> New Batch
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {['batches', 'staff', 'payments', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'batches' && (
        <BatchesTab 
          batches={activeBatches}
          onOpenDetails={handleOpenBatchDetails}
          onArchiveBatch={onArchiveBatch}
        />
      )}

      {activeTab === 'staff' && (
        <StaffTab
          staffUsers={staffUsers}
          getActiveAssignments={getActiveAssignments}
          onAddStaff={() => setCreateUserModalOpen(true)}
          onDeleteUser={onDeleteUser}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsTab
          staffUsers={staffUsers}
          onOpenPassbook={handleOpenPassbook}
        />
      )}

      {activeTab === 'settings' && <SettingsTab />}

      {/* Modals - Using Shared Components */}
      <CreateBatchModal
        isOpen={createBatchModalOpen}
        onClose={() => setCreateBatchModalOpen(false)}
        onSubmit={onCreateBatch}
      />

      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSubmit={onAddUser}
      />

      {selectedBatch && (
        <>
          <BatchDetailsModal
            isOpen={batchDetailsModalOpen}
            onClose={() => setBatchDetailsModalOpen(false)}
            batch={selectedBatch}
            onOpenAssignModal={handleOpenAssignModal}
          />

          <AssignToKarigarModal
            isOpen={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            batch={selectedBatch}
            karigars={karigars}
            onSubmit={onAssignToKarigar}
          />
        </>
      )}

      <PassbookModal
        isOpen={passbookModalOpen}
        onClose={() => setPassbookModalOpen(false)}
        userId={selectedUserId}
        users={users}
        onPayment={onPayKarigar}
      />
    </div>
  );
};
