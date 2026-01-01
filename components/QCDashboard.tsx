/**
 * components/QCDashboard.tsx
 * STATUS: UI REDESIGN (Vertical Staff Cards) ✅
 */
import React, { useState } from 'react';
import { ClipboardCheck, Search, User, Package } from 'lucide-react';
import { Batch, AssignmentStatus, SizeQty } from '../types';
import { Card } from './Shared';
import { QCInspectionModal } from './shared/QCInspectionModal';

interface QCDashboardProps {
  batches: Batch[];
  onSubmitQC: (batchId: string, assignmentId: string, passedQty: SizeQty) => void;
}

export const QCDashboard: React.FC<QCDashboardProps> = ({ batches, onSubmitQC }) => {
  const [qcModalOpen, setQCModalOpen] = useState(false);
  const [selectedQCItem, setSelectedQCItem] = useState<any>(null);

  const pendingQCItems = (batches || []).flatMap(b => 
    (b.assignments || [])
      .filter(a => a.status === AssignmentStatus.STITCHED)
      .map(a => ({ ...a, batch: b }))
  );

  const handleOpenInspectModal = (item: any) => {
    setSelectedQCItem(item);
    setQCModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="bg-purple-100 p-3 rounded-full">
          <ClipboardCheck className="text-purple-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quality Control</h1>
          <p className="text-sm text-gray-500">Inspect and approve finished work</p>
        </div>
      </div>

      {/* QC Items Grid */}
      <div className="space-y-6">
        {pendingQCItems.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No items waiting for QC</p>
          </div>
        )}
        
        {pendingQCItems.map(item => (
          <Card key={item.id} className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
            {/* LARGE PRODUCT IMAGE */}
            <div className="relative aspect-[4/5] w-full">
              <img 
                src={item.batch.imageUrl} 
                className="absolute inset-0 w-full h-full object-cover" 
                alt="" 
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border">
                <User size={12} className="text-purple-600" />
                <span className="text-xs font-black text-gray-800 uppercase">{item.karigarName}</span>
              </div>
            </div>

            {/* INFO SECTION */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="text-2xl font-black text-gray-900">{item.batch.styleName}</h4>
              </div>

              {/* BUNDLE SUMMARY */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(item.assignedQty)
                  .filter(([_, v]) => (v as number) > 0)
                  .map(([size, qty]) => (
                    <span key={size} className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-gray-700 border">
                      {size}: {qty as number}
                    </span>
                  ))}
              </div>
              
              {/* INSPECTION BUTTON */}
              <button 
                onClick={() => handleOpenInspectModal(item)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Search size={20} /> Start Inspection
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* QC Inspection Modal */}
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
