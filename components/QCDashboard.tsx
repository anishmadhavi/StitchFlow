/**
 * components/QCDashboard.tsx (Updated with Shared Components)
 * Purpose: Quality Control Interface - Uses shared QC modal
 */

import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Batch, AssignmentStatus, SizeQty } from '../types';
import { Button, Card } from './Shared';

// Shared Modal Component
import { QCInspectionModal } from './shared/QCInspectionModal';

interface QCDashboardProps {
  batches: Batch[];
  onSubmitQC: (batchId: string, assignmentId: string, passedQty: SizeQty) => void;
}

export const QCDashboard: React.FC<QCDashboardProps> = ({ batches, onSubmitQC }) => {
  const [qcModalOpen, setQCModalOpen] = useState(false);
  const [selectedQCItem, setSelectedQCItem] = useState<any>(null);

  // Filter for items ready for QC
  const pendingQCItems = batches.flatMap(b => 
    b.assignments
      .filter(a => a.status === AssignmentStatus.STITCHED)
      .map(a => ({ ...a, batch: b }))
  );

  const handleOpenInspectModal = (item: any) => {
    setSelectedQCItem(item);
    setQCModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardCheck className="text-purple-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
          <p className="text-gray-500">Inspect stitched garments before payout.</p>
        </div>
      </div>

      {/* QC Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingQCItems.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No bundles pending inspection.</p>
          </div>
        )}
        
        {pendingQCItems.map(item => (
          <Card key={item.id} className="flex gap-4 p-4 border-l-4 border-l-purple-500">
            <img 
              src={item.batch.imageUrl} 
              className="w-24 h-24 rounded object-cover bg-gray-100" 
              alt="" 
            />
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-bold text-gray-900">{item.batch.styleName}</h3>
                <span className="text-xs text-gray-500">
                  {item.completedAt ? formatDate(item.completedAt) : ''}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Karigar: {item.karigarName}</p>
              
              <div className="flex flex-wrap gap-2 text-xs font-mono bg-gray-50 p-2 rounded mb-3">
                {Object.entries(item.assignedQty)
                  .filter(([_, v]) => (v as number) > 0)
                  .map(([k, v]) => (
                    <span key={k} className="border px-1 bg-white rounded">
                      {k}: {v as number}
                    </span>
                  ))}
              </div>
              
              <Button 
                size="sm" 
                onClick={() => handleOpenInspectModal(item)} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Start Inspection
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* QC Inspection Modal - Using Shared Component */}
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

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}
