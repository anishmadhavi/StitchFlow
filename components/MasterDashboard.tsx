/**
 * components/MasterDashboard.tsx (Updated with Shared Components)
 * Purpose: Master (Cutter) Interface - Uses shared modals
 */

import React, { useState } from 'react';
import { Scissors, UserPlus, ZoomIn, X } from 'lucide-react';
import { Batch, BatchStatus, User, SizeQty } from '../types';
import { Card, Badge } from './Shared'; // We will use standard HTML buttons for specific colors

// Shared Modal Components
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
  const [cutModalOpen, setCutModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [viewImg, setViewImg] = useState<string | null>(null);

  const pendingBatches = (batches || []).filter(b => b.status === BatchStatus.PENDING_MATERIAL);
  const assignableBatches = (batches || []).filter(b => 
    b.status === BatchStatus.CUTTING_DONE || b.status === BatchStatus.IN_PRODUCTION
  );

  const handleOpenCutModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setCutModalOpen(true);
  };

  const handleOpenAssignModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setAssignModalOpen(true);
  };

  const calculateTotalAvailable = (availableQty: SizeQty) => {
    return Object.values(availableQty || {}).reduce((sum, val) => sum + (val as number), 0);
  };

  return (
    <div className="space-y-10 max-w-xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="bg-indigo-100 p-3 rounded-full">
          <Scissors className="text-indigo-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Master Dashboard</h1>
          <p className="text-sm text-gray-500">Track and allocate production</p>
        </div>
      </div>

      {/* 1. PENDING CUTTING SECTION */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 px-2 uppercase tracking-wider">
          <Scissors size={18} className="text-green-600" /> 1. New Jobs (Pending Cut)
        </h3>
        <div className="space-y-6">
          {pendingBatches.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed">
              No batches pending cutting.
            </p>
          )}
          {pendingBatches.map(batch => (
            <Card key={batch.id} className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
              {/* Image Section (70% Look) */}
              <div className="relative aspect-[4/5] w-full">
                <img 
                  src={batch.imageUrl} 
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer" 
                  alt={batch.styleName}
                  onClick={() => setViewImg(batch.imageUrl)}
                />
                <button 
                  onClick={() => setViewImg(batch.imageUrl)}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-full p-3 shadow-lg"
                >
                  <ZoomIn size={20} className="text-gray-800" />
                </button>
              </div>

              {/* Info Section */}
              <div className="p-6 space-y-4">
                <h4 className="text-2xl font-black text-gray-900">{batch.styleName}</h4>
                
                {/* Stats Table */}
                <div className="flex flex-wrap gap-2 py-2">
                  {Object.entries(batch.plannedQty || {})
                    .filter(([_, q]) => (q as number) > 0)
                    .map(([k, v]) => (
                      <span key={k} className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-gray-700 border">
                        {k}: {v as number}
                      </span>
                    ))}
                </div>

                {/* ✅ FINALIZE BUTTON (GREEN) */}
                <button 
                  onClick={() => handleOpenCutModal(batch)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Scissors size={20} /> Finalize Cutting
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. ALLOCATE TO KARIGAR SECTION */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 px-2 uppercase tracking-wider">
          <UserPlus size={18} className="text-blue-600" /> 2. Allocate to Karigar
        </h3>
        <div className="space-y-6">
          {assignableBatches.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed">
              No stock available for assignment.
            </p>
          )}
          {assignableBatches.map(batch => {
            const totalAvailable = calculateTotalAvailable(batch.availableQty || {});
            if (totalAvailable <= 0) return null;

            return (
              <Card key={batch.id} className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
                {/* Image Section */}
                <div className="relative aspect-[4/5] w-full">
                  <img 
                    src={batch.imageUrl} 
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer" 
                    alt={batch.styleName}
                    onClick={() => setViewImg(batch.imageUrl)}
                  />
                  <div className="absolute top-4 left-4">
                    <Badge color="blue" className="px-4 py-1 text-xs uppercase font-black shadow-lg">
                      {batch.status}
                    </Badge>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-2xl font-black text-gray-900">{batch.styleName}</h4>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black border border-blue-100 uppercase">
                      Ready: {totalAvailable} Pcs
                    </span>
                  </div>

                  {/* ✅ ASSIGN BUTTON (BLUE) */}
                  <button 
                    onClick={() => handleOpenAssignModal(batch)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    <UserPlus size={20} /> Assign Stock
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* MODALS */}
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

      {/* Image Viewer */}
      {viewImg && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => setViewImg(null)}>
          <button className="absolute top-6 right-6 text-white"><X size={40} /></button>
          <img src={viewImg} alt="View" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
