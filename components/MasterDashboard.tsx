/**
 * components/MasterDashboard.tsx
 * Purpose: Master (Cutter) Interface.
 * Description: Allows the MASTER to view batches pending cutting, finalize cutting quantities (Actual vs Planned), and allocate stock to Karigars.
 * Compatibility: Client-side React.
 */

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Scissors, UserPlus, ChevronLeft, ZoomIn, X, Layers } from 'lucide-react';
import { Batch, BatchStatus, Role, User, SizeQty } from '../types';
import { SIZE_OPTIONS } from '../constants';
import { Button, Card, Badge, Modal } from './Shared';

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
  const [cutModal, setCutModal] = useState<{ open: boolean; batchId: string | null }>({ open: false, batchId: null });
  const [assignModal, setAssignModal] = useState<{ open: boolean; batchId: string | null }>({ open: false, batchId: null });
  
  // Image Viewer State
  const [viewImg, setViewImg] = useState<string | null>(null);
  
  // --- Assignment State ---
  // Step 0: Select Karigar from Grid
  // Step 1: Enter Quantities
  const [assignStep, setAssignStep] = useState<0 | 1>(0);

  // Form State
  const [cutForm, setCutForm] = useState<SizeQty>({});
  const [assignForm, setAssignForm] = useState<{ karigarId: string; qty: SizeQty }>({ 
    karigarId: '', 
    qty: {} 
  });

  const pendingBatches = batches.filter(b => b.status === BatchStatus.PENDING_MATERIAL);
  const assignableBatches = batches.filter(b => b.status === BatchStatus.CUTTING_DONE || b.status === BatchStatus.IN_PRODUCTION);

  // Handlers
  const openCutModal = (batch: Batch) => {
    setCutForm(batch.plannedQty); // Default to planned
    setCutModal({ open: true, batchId: batch.id });
  };

const handleCutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutModal.batchId) return;

    // Update the batch in Supabase: Set status and actual cut quantities
    const { error } = await supabase
      .from('batches')
      .update({
        status: 'Cutting Done',
        actual_cut_qty: cutForm,
        available_qty: cutForm // When cut is done, all pieces are available for assignment
      })
      .eq('id', cutModal.batchId);

    if (error) alert("Error saving cut: " + error.message);
    else setCutModal({ open: false, batchId: null });
  };

  const openAssignModal = (batch: Batch) => {
    // Initialize with 0s for available keys
    const initialQty: SizeQty = {};
    Object.keys(batch.availableQty).forEach(key => initialQty[key] = 0);
    
    setAssignForm({ karigarId: '', qty: initialQty });
    setAssignStep(0); // Start at selection step
    setAssignModal({ open: true, batchId: batch.id });
  };

  const handleSelectKarigar = (karigarId: string) => {
    setAssignForm(prev => ({ ...prev, karigarId }));
    setAssignStep(1); // Move to quantity entry
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignModal.batchId && assignForm.karigarId) {
      onAssignToKarigar(assignModal.batchId, assignForm.karigarId, assignForm.qty);
    }
    setAssignModal({ open: false, batchId: null });
  };

  const selectedBatchForAssign = batches.find(b => b.id === assignModal.batchId);
  const selectedKarigar = karigars.find(k => k.id === assignForm.karigarId);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Full Screen Image Modal */}
      {viewImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewImg(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                <X size={28} />
            </button>
            <img src={viewImg} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} alt="Enlarged view" />
        </div>
      )}

      {/* Pending Cutting Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Scissors className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Pending Cutting</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingBatches.length === 0 && <p className="text-gray-500 text-sm italic pl-1">No batches pending cutting.</p>}
          {pendingBatches.map(batch => (
            <div key={batch.id} className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center backdrop-blur-sm">
              {/* Large Centered Image */}
              <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-sm mb-5 bg-white group">
                 <img src={batch.imageUrl} className="w-full h-full object-cover" alt="Design" />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                 <button 
                   onClick={() => setViewImg(batch.imageUrl)}
                   className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-blue-900 p-2.5 rounded-full shadow-lg transition-transform active:scale-95"
                 >
                   <ZoomIn size={20} />
                 </button>
              </div>

              {/* Sizes Grid */}
              <div className="w-full mb-5">
                 <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 text-left w-full flex items-center gap-1">
                    <Layers size={12} /> Planned Cuts
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                   {Object.entries(batch.plannedQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => {
                     // Extract just the size label (e.g. "36" from "36 - S") for simpler mobile view
                     const simpleLabel = k.split(' - ')[0]; 
                     return (
                       <div key={k} className="flex flex-col items-center bg-white rounded-lg p-2 border border-blue-100 shadow-sm">
                          <span className="text-[10px] text-gray-400 font-medium mb-0.5">{simpleLabel}</span>
                          <span className="font-bold text-gray-900 text-lg leading-none">{v as number}</span>
                       </div>
                     );
                   })}
                 </div>
              </div>

              <Button size="lg" className="w-full py-4 bg-blue-600 hover:bg-blue-700 shadow-md rounded-xl font-bold text-lg" onClick={() => openCutModal(batch)}>
                Finalize Cut
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Assign Stock Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <UserPlus className="text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Assign to Karigar</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignableBatches.length === 0 && <p className="text-gray-500 text-sm italic pl-1">No stock available for assignment.</p>}
          {assignableBatches.map(batch => {
             const totalAvailable = (Object.values(batch.availableQty) as number[]).reduce((a,b) => a + b, 0);
             if (totalAvailable <= 0) return null; // Hide fully assigned
             
             return (
              <div key={batch.id} className="bg-red-50/80 border border-red-200 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center backdrop-blur-sm">
                 {/* Large Centered Image */}
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-sm mb-5 bg-white group">
                   <img src={batch.imageUrl} className="w-full h-full object-cover" alt="Design" />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                   <button 
                     onClick={() => setViewImg(batch.imageUrl)}
                     className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-red-900 p-2.5 rounded-full shadow-lg transition-transform active:scale-95"
                   >
                     <ZoomIn size={20} />
                   </button>
                </div>

                {/* Available Stock Grid */}
                <div className="w-full mb-5">
                   <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2 text-left w-full flex items-center gap-1">
                      <Layers size={12} /> Available Stock
                   </div>
                   <div className="grid grid-cols-4 gap-2">
                     {Object.entries(batch.availableQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => {
                       const simpleLabel = k.split(' - ')[0];
                       return (
                         <div key={k} className="flex flex-col items-center bg-white rounded-lg p-2 border border-red-100 shadow-sm">
                            <span className="text-[10px] text-gray-400 font-medium mb-0.5">{simpleLabel}</span>
                            <span className="font-bold text-gray-900 text-lg leading-none">{v as number}</span>
                         </div>
                       );
                     })}
                   </div>
                </div>

                <Button size="lg" className="w-full py-4 bg-red-600 hover:bg-red-700 shadow-md rounded-xl font-bold text-lg" onClick={() => openAssignModal(batch)}>
                  Assign Stock
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modals */}
      <Modal 
        isOpen={cutModal.open} 
        onClose={() => setCutModal({open: false, batchId: null})} 
        title="Finalize Cutting Quantities"
      >
        <form onSubmit={handleCutSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">Enter the actual number of pieces cut for this batch.</p>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {SIZE_OPTIONS.map(size => (
              <div key={size}>
                <label className="block text-xs font-medium text-gray-700 truncate mb-1">{size}</label>
                <input 
                  type="number" min="0"
                  className="w-full border rounded p-2 text-center"
                  placeholder="0"
                  value={cutForm[size] || ''}
                  onChange={e => setCutForm({...cutForm, [size]: Number(e.target.value)})}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setCutModal({open: false, batchId: null})}>Cancel</Button>
            <Button type="submit">Confirm Cutting</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={assignModal.open} 
        onClose={() => setAssignModal({open: false, batchId: null})} 
        title={assignStep === 0 ? "Select Karigar" : "Assign Stock Quantities"}
      >
        {assignStep === 0 ? (
          /* STEP 0: KARIGAR GRID SELECTION */
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">Tap a photo to select a Karigar</p>
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2">
              {karigars.map(k => (
                <button
                  key={k.id}
                  onClick={() => handleSelectKarigar(k.id)}
                  className="bg-white border-2 border-gray-100 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center gap-3 transition-all shadow-sm hover:shadow-md active:scale-95 text-center"
                >
                  <img 
                    src={k.avatarUrl || `https://i.pravatar.cc/150?u=${k.id}`} 
                    className="w-32 h-32 rounded-full object-cover bg-gray-100 border-2 border-white shadow-sm" 
                    alt={k.name} 
                  />
                  <div>
                    <span className="block font-bold text-gray-900 text-sm leading-tight">{k.name}</span>
                    <span className="block text-xs text-gray-500 mt-1">ID: {k.mobile?.slice(-4) || '....'}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t pt-3 text-right">
                <Button variant="ghost" onClick={() => setAssignModal({open: false, batchId: null})}>Cancel</Button>
            </div>
          </div>
        ) : (
          /* STEP 1: QUANTITY INPUTS */
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            {/* Selected Karigar Preview */}
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
               <img src={selectedKarigar?.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white" alt="" />
               <div className="flex-1">
                 <p className="text-xs text-blue-600 font-bold uppercase">Assigning to:</p>
                 <p className="font-bold text-gray-900">{selectedKarigar?.name}</p>
               </div>
               <Button type="button" size="sm" variant="ghost" onClick={() => setAssignStep(0)}>Change</Button>
            </div>
            
            <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
              <p className="font-medium mb-2 sticky top-0 bg-gray-50 text-gray-600 text-xs uppercase">Stock Available:</p>
              {selectedBatchForAssign && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedBatchForAssign.availableQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => (
                      <span key={k} className="bg-white border px-1 rounded">{k}: {v as number}</span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-sm font-medium pt-2">Enter Quantities to Issue:</p>
            <div className="grid grid-cols-2 gap-3 max-h-[35vh] overflow-y-auto">
              {selectedBatchForAssign && Object.keys(selectedBatchForAssign.availableQty).filter(k => selectedBatchForAssign.availableQty[k] > 0).map(size => {
                const max = selectedBatchForAssign.availableQty[size] || 0;
                return (
                  <div key={size}>
                    <label className="block text-xs font-medium text-center truncate mb-1">{size} (Max: {max})</label>
                    <input 
                      type="number" min="0" max={max}
                      className="w-full border rounded-lg p-3 text-center text-lg font-bold"
                      placeholder="0"
                      value={assignForm.qty[size] || ''}
                      onChange={e => setAssignForm({
                        ...assignForm, 
                        qty: { ...assignForm.qty, [size]: Number(e.target.value) }
                      })}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button type="button" variant="ghost" className="text-gray-500" onClick={() => setAssignStep(0)}>
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button type="submit" size="lg" disabled={Object.values(assignForm.qty).reduce((a, b) => (a as number) + (b as number), 0) === 0}>
                Assign Stock
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
