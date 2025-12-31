/**
 * components/MasterDashboard.tsx (Updated with Shared Components)
 * Purpose: Master (Cutter) Interface - Uses shared modals
 */

import React, { useState } from 'react';
import { Scissors, UserPlus, ZoomIn, X } from 'lucide-react';
import { Batch, BatchStatus, User, SizeQty } from '../types';
import { Button, Card, Badge } from './Shared';

// Shared Modal Components (Used by multiple roles)
import { CuttingModal } from './shared/CuttingModal';
import { AssignToKarigarModal } from './shared/AssignToKarigarModal';

interface MasterDashboardProps {
  batches: Batch[];
  karigars: User[];
  onFinalizeCut: (batchId: string, actualQty: SizeQty) => void;
  onAssignToKarigar: (batchId: string, karigarId: string, qty: SizeQty) => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({
  batches,
  karigars,
  onFinalizeCut,
  onAssignToKarigar
}) => {
  // Modal states
  const [cutModalOpen, setCutModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // Image Viewer State
  const [viewImg, setViewImg] = useState<string | null>(null);

  // Filtered batches
  const pendingBatches = batches.filter(b => b.status === BatchStatus.PENDING_MATERIAL);
  const assignableBatches = batches.filter(b => 
    b.status === BatchStatus.CUTTING_DONE || b.status === BatchStatus.IN_PRODUCTION
  );

  // Handlers
  const handleOpenCutModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setCutModalOpen(true);
  };

  const handleOpenAssignModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setAssignModalOpen(true);
  };

  const calculateTotalAvailable = (availableQty: SizeQty) => {
    return Object.values(availableQty).reduce((sum, val) => sum + (val as number), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scissors className="text-indigo-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Dashboard</h1>
          <p className="text-gray-500">Cutting room management and floor allocation</p>
        </div>
      </div>

      {/* Pending Cutting Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Scissors size={18} /> Pending Cutting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingBatches.length === 0 && (
            <p className="text-sm text-gray-500 col-span-full">No batches pending cutting.</p>
          )}
          {pendingBatches.map(batch => (
            <Card key={batch.id} className="p-4 border-l-4 border-l-indigo-500">
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <img 
                    src={batch.imageUrl} 
                    className="w-20 h-20 rounded object-cover bg-gray-100 cursor-pointer hover:opacity-75 transition-opacity" 
                    alt=""
                    onClick={() => setViewImg(batch.imageUrl)}
                  />
                  <button 
                    onClick={() => setViewImg(batch.imageUrl)}
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-sm hover:bg-white"
                  >
                    <ZoomIn size={12} className="text-gray-600" />
                  </button>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{batch.styleName}</h4>
                  <p className="text-xs text-gray-500 mb-2">SKU: {batch.sku}</p>
                  <div className="flex flex-wrap gap-1 text-xs font-mono bg-gray-50 p-2 rounded mb-2">
                    {Object.entries(batch.plannedQty)
                      .filter(([_, q]) => (q as number) > 0)
                      .map(([k, v]) => (
                        <span key={k} className="border px-1 bg-white rounded">
                          {k}: {v as number}
                        </span>
                      ))}
                  </div>
                  <Button size="sm" onClick={() => handleOpenCutModal(batch)}>
                    Finalize Cut
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Allocate to Karigar Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus size={18} /> Allocate to Karigar
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {assignableBatches.length === 0 && (
            <p className="text-sm text-gray-500">No stock available for assignment.</p>
          )}
          {assignableBatches.map(batch => {
            const totalAvailable = calculateTotalAvailable(batch.availableQty || {});
            if (totalAvailable <= 0) return null;

            return (
              <Card key={batch.id} className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative shrink-0">
                  <img 
                    src={batch.imageUrl} 
                    className="w-16 h-16 rounded object-cover bg-gray-100 cursor-pointer hover:opacity-75 transition-opacity" 
                    alt=""
                    onClick={() => setViewImg(batch.imageUrl)}
                  />
                  <button 
                    onClick={() => setViewImg(batch.imageUrl)}
                    className="absolute -top-1 -right-1 bg-white/90 rounded-full p-1 shadow-sm hover:bg-white"
                  >
                    <ZoomIn size={10} className="text-gray-600" />
                  </button>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{batch.styleName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color="blue">{batch.status}</Badge>
                    <span className="text-xs text-gray-500">Available: {totalAvailable} pcs</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleOpenAssignModal(batch)}>
                  Assign
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Modals - Using Shared Components */}
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

      {/* Image Viewer Modal */}
      {viewImg && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setViewImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setViewImg(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <img 
              src={viewImg} 
              alt="Design" 
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
