/**
 * components/ManagerDashboard.tsx (Updated with Shared Components)
 * Purpose: Manager Interface - Uses shared modals
 */

import React, { useState } from 'react';
import { LayoutGrid, Scissors, ClipboardCheck } from 'lucide-react';
import { Batch, BatchStatus, Role, User, SizeQty, AssignmentStatus } from '../types';

// Tab Components (Manager-specific)
import { ProductionTab } from './manager/ProductionTab';
import { AllocationTab } from './manager/AllocationTab';
import { QCTab } from './manager/QCTab';

// Shared Modal Components (Used by multiple roles)
import { CreateBatchModal } from './shared/CreateBatchModal';
import { CuttingModal } from './shared/CuttingModal';
import { AssignToKarigarModal } from './shared/AssignToKarigarModal';
import { QCInspectionModal } from './shared/QCInspectionModal';

interface ManagerDashboardProps {
  batches: Batch[];
  users: User[];
  onCreateBatch: (batch: Partial<Batch>) => void;
  onFinalizeCut: (batchId: string, actualQty: SizeQty) => void;
  onAssignToKarigar: (batchId: string, karigarId: string, qty: SizeQty) => void;
  onSubmitQC: (batchId: string, assignmentId: string, passedQty: SizeQty) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  batches,
  users,
  onCreateBatch,
  onFinalizeCut,
  onAssignToKarigar,
  onSubmitQC
}) => {
  const [activeTab, setActiveTab] = useState<'production' | 'allocation' | 'qc'>('production');
  
  // Modal states
  const [createBatchModalOpen, setCreateBatchModalOpen] = useState(false);
  const [cutModalOpen, setCutModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [qcModalOpen, setQCModalOpen] = useState(false);
  
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedQCItem, setSelectedQCItem] = useState<any>(null);

  // Filtered data
  const activeBatches = (batches || []).filter(b => b.status !== BatchStatus.ARCHIVED);
  const pendingCuttingBatches = (batches || []).filter(b =>
    b.status === BatchStatus.PENDING_MATERIAL || b.status === 'Pending Material'
  );
  const assignableBatches = batches.filter(b => 
    b.status === BatchStatus.CUTTING_DONE || b.status === BatchStatus.IN_PRODUCTION
  );
  const pendingQCItems = batches.flatMap(b => 
    b.assignments
      .filter(a => a.status === AssignmentStatus.STITCHED)
      .map(a => ({ ...a, batch: b }))
  );
  const karigars = users.filter(u => u.role === Role.KARIGAR);

  // Handlers
  const handleOpenCutModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setCutModalOpen(true);
  };

  const handleOpenAssignModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setAssignModalOpen(true);
  };

  const handleOpenQCModal = (item: any) => {
    setSelectedQCItem(item);
    setQCModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-500">Production planning, floor allocation, and quality control</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('production')}
            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'production' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <LayoutGrid size={16} /> Production Batches
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'allocation' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Scissors size={16} /> Floor Allocation
          </button>
          <button
            onClick={() => setActiveTab('qc')}
            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'qc' 
                ? 'border-purple-500 text-purple-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardCheck size={16} /> Quality Control
            {pendingQCItems.length > 0 && (
              <span className="bg-purple-100 text-purple-600 py-0.5 px-2 rounded-full text-xs">
                {pendingQCItems.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'production' && (
        <ProductionTab 
          batches={activeBatches}
          onCreateBatch={() => setCreateBatchModalOpen(true)}
        />
      )}

      {activeTab === 'allocation' && (
        <AllocationTab
          pendingCuttingBatches={pendingCuttingBatches}
          assignableBatches={assignableBatches}
          onOpenCutModal={handleOpenCutModal}
          onOpenAssignModal={handleOpenAssignModal}
        />
      )}

      {activeTab === 'qc' && (
        <QCTab
          pendingQCItems={pendingQCItems}
          onOpenInspectModal={handleOpenQCModal}
        />
      )}

      {/* Modals - Using Shared Components */}
      <CreateBatchModal
        isOpen={createBatchModalOpen}
        onClose={() => setCreateBatchModalOpen(false)}
        onSubmit={onCreateBatch}
      />

      {selectedBatch && (
        <>
          <CuttingModal
            isOpen={cutModalOpen}
            onClose={() => setCutModalOpen(false)}
            batch={selectedBatch}
            onSubmit={onFinalizeCut}
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

      {selectedQCItem && (
        <QCInspectionModal
          isOpen={qcModalOpen}
          onClose={() => setQCModalOpen(false)}
          item={selectedQCItem}
          onSubmit={onSubmitQC}
        />
      )}
    </div>
  );
};
