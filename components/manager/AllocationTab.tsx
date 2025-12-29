/**
 * components/manager/AllocationTab.tsx
 * Purpose: Floor allocation - cutting and karigar assignment
 */

import React from 'react';
import { Scissors, UserPlus } from 'lucide-react';
import { Batch } from '../../types';
import { Button, Card } from '../Shared';

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
  return (
    <div className="space-y-8">
      {/* Pending Cutting Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Scissors size={18} /> Pending Cutting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingCuttingBatches.length === 0 && (
            <p className="text-sm text-gray-500">No batches waiting for cutting.</p>
          )}
          {pendingCuttingBatches.map(batch => (
            <Card key={batch.id} className="p-4 border-l-4 border-l-indigo-500">
              <div className="flex gap-4">
                <img 
                  src={batch.imageUrl} 
                  className="w-16 h-16 rounded object-cover" 
                  alt="" 
                />
                <div className="flex-1">
                  <h4 className="font-medium">{batch.styleName}</h4>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => onOpenCutModal(batch)}
                  >
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
            const totalAvailable = (Object.values(batch.availableQty) as number[])
              .reduce((a, b) => a + b, 0);
            
            if (totalAvailable <= 0) return null;
            
            return (
              <Card key={batch.id} className="p-4 flex flex-col md:flex-row items-center gap-4">
                <img 
                  src={batch.imageUrl} 
                  className="w-12 h-12 rounded object-cover" 
                  alt="" 
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{batch.styleName}</h4>
                  <div className="text-xs text-gray-500 mt-1">
                    Available: {totalAvailable} pcs
                  </div>
                </div>
                <Button size="sm" onClick={() => onOpenAssignModal(batch)}>
                  Assign
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};
