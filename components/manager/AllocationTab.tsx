/**
 * components/manager/AllocationTab.tsx
 * Purpose: Floor allocation - cutting and karigar assignment
 */

import React from 'react';
import { Scissors, UserPlus, ZoomIn } from 'lucide-react';
import { Batch, BatchStatus, SizeQty } from '../../types';
import { Card, Badge } from '../Shared';

interface AllocationTabProps {
  pendingCuttingBatches: Batch[];
  assignableBatches: Batch[];
  onOpenCutModal: (batch: Batch) => void;
  onOpenAssignModal: (batch: Batch) => void;
}

export const AllocationTab: React.FC<AllocationTabProps> = ({
  pendingCuttingBatches,
  assignableBatches,
  onOpenCutModal,
  onOpenAssignModal
}) => {
  
  const calculateTotalAvailable = (availableQty: SizeQty) => {
    return Object.values(availableQty || {}).reduce((sum, val) => sum + (val as number), 0);
  };

  return (
    <div className="space-y-10 pb-20">
      
      {/* SECTION 1: CUTTING PENDING */}
      <section>
        <h3 className="text-sm font-black text-gray-400 mb-4 px-2 uppercase tracking-widest flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-green-500"></span> Pending Cutting
        </h3>
        
        <div className="space-y-6">
          {pendingCuttingBatches.length === 0 && (
             <p className="text-center text-gray-400 text-sm py-4 italic">No batches waiting for cutting.</p>
          )}
          
          {pendingCuttingBatches.map(batch => (
            <Card key={batch.id} className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
              <div className="relative aspect-[4/5] w-full">
                <img src={batch.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-20">
                  <h4 className="text-2xl font-black text-white">{batch.styleName}</h4>
                </div>
              </div>
              <div className="p-4">
                 <button 
                   onClick={() => onOpenCutModal(batch)}
                   className="w-full bg-green-600 text-white font-black py-4 rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                 >
                   <Scissors size={20} /> Finalize Cut
                 </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 2: ASSIGNMENT */}
      <section>
        <h3 className="text-sm font-black text-gray-400 mb-4 px-2 uppercase tracking-widest flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ready to Assign
        </h3>

        <div className="space-y-6">
          {assignableBatches.length === 0 && (
             <p className="text-center text-gray-400 text-sm py-4 italic">No stock available to assign.</p>
          )}

          {assignableBatches.map(batch => {
            const totalAvailable = calculateTotalAvailable(batch.availableQty || {});
            if (totalAvailable <= 0) return null;

            return (
              <Card key={batch.id} className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
                <div className="relative aspect-[4/5] w-full">
                  <img src={batch.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 backdrop-blur text-blue-800 px-3 py-1 rounded-full text-xs font-black shadow-sm border border-white">
                      {totalAvailable} Pcs Available
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-20">
                    <h4 className="text-2xl font-black text-white">{batch.styleName}</h4>
                  </div>
                </div>
                <div className="p-4">
                   <button 
                     onClick={() => onOpenAssignModal(batch)}
                     className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                   >
                     <UserPlus size={20} /> Assign Karigar
                   </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};
