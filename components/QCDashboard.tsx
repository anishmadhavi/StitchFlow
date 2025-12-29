/**
 * components/QCDashboard.tsx
 * Purpose: Quality Control (QC) Interface.
 * Description: Allows QC staff to inspect stitched garments, mark them as Passed or Rework, and triggers payment calculations for Karigars.
 * Compatibility: Client-side React.
 */

import React, { useState } from 'react';
import { supabase } from '../src/supabaseClient';
import { ClipboardCheck, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { Batch, AssignmentStatus, SizeQty } from '../types';
import { Button, Card, Badge, Modal } from './Shared';

interface QCDashboardProps {
  batches: Batch[];
  onSubmitQC: (batchId: string, assignmentId: string, passedQty: SizeQty) => void;
}

export const QCDashboard: React.FC<QCDashboardProps> = ({ batches, onSubmitQC }) => {
  const [inspectModal, setInspectModal] = useState<{ open: boolean; batchId: string | null; assignmentId: string | null }>({
    open: false, batchId: null, assignmentId: null
  });
  
  const [qcForm, setQcForm] = useState<SizeQty>({});
  const [currentInspectItem, setCurrentInspectItem] = useState<any>(null);

  // Filter for items ready for QC
  const pendingQCItems = batches.flatMap(b => 
    b.assignments
      .filter(a => a.status === AssignmentStatus.STITCHED)
      .map(a => ({ ...a, batch: b }))
  );

  const openInspectModal = (item: any) => {
    setQcForm(item.assignedQty); // Default to all passed
    setCurrentInspectItem(item);
    setInspectModal({ open: true, batchId: item.batch.id, assignmentId: item.id });
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectModal.assignmentId || !currentInspectItem) return;

    const totalPassedCount = Object.values(qcForm).reduce((a, b) => a + b, 0);
    const payoutAmount = totalPassedCount * currentInspectItem.batch.rate_per_piece;

    // 1. Update assignment status to QC Passed
    const { error: assignError } = await supabase
      .from('assignments')
      .update({ status: 'QC Passed' })
      .eq('id', inspectModal.assignmentId);

    // 2. Add entry to Ledger (Financial record)
    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert([{
        user_id: currentInspectItem.karigar_id,
        description: `QC Passed: ${currentInspectItem.batch.style_name} (${totalPassedCount} pcs)`,
        amount: payoutAmount,
        type: 'CREDIT',
        related_batch_id: currentInspectItem.batch_id
      }]);

    // 3. Update Karigar's Wallet Balance
    const { error: walletError } = await supabase.rpc('increment_wallet', { 
      user_id: currentInspectItem.karigar_id, 
      amount: payoutAmount 
    });

    if (assignError || ledgerError) alert("Error processing QC result");
    else setInspectModal({ open: false, batchId: null, assignmentId: null });
  };

  const handleQtyChange = (size: string, val: number) => {
    setQcForm(prev => ({ ...prev, [size]: val }));
  };

  // Calculate totals for UI summary
  const totalAssigned = currentInspectItem 
    ? (Object.values(currentInspectItem.assignedQty) as number[]).reduce((a, b) => a + b, 0)
    : 0;
  const totalPassed = (Object.values(qcForm) as number[]).reduce((a, b) => a + b, 0);
  const totalRework = totalAssigned - totalPassed;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardCheck className="text-purple-600 w-8 h-8" />
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
           <p className="text-gray-500">Inspect stitched garments before payout.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingQCItems.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No bundles pending inspection.</p>
          </div>
        )}
        
        {pendingQCItems.map(item => (
          <Card key={item.id} className="flex gap-4 p-4 border-l-4 border-l-purple-500">
             <img src={item.batch.imageUrl} className="w-24 h-24 rounded object-cover bg-gray-100" alt="" />
             <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-bold text-gray-900">{item.batch.styleName}</h3>
                  <span className="text-xs text-gray-500">{formatDate(item.completedAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Karigar: {item.karigarName}</p>
                <div className="flex flex-wrap gap-2 text-xs font-mono bg-gray-50 p-2 rounded mb-3">
                   {Object.entries(item.assignedQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => (
                      <span key={k} className="border px-1 bg-white rounded">{k}: {v as number}</span>
                   ))}
                </div>
                <Button size="sm" onClick={() => openInspectModal(item)} className="w-full bg-purple-600 hover:bg-purple-700">
                  Start Inspection
                </Button>
             </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={inspectModal.open} 
        onClose={() => setInspectModal({open: false, batchId: null, assignmentId: null})}
        title="Inspection Result"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-900 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>Enter the quantity that <strong>PASSED</strong> inspection. Any remaining quantity will be automatically marked as <strong>REWORK</strong> and sent back to the Karigar.</p>
          </div>
          
          <div className="max-h-[50vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4">
              {currentInspectItem && Object.keys(currentInspectItem.assignedQty).map(size => {
                const max = currentInspectItem.assignedQty[size] || 0;
                if (max === 0) return null;
                
                const passed = qcForm[size] !== undefined ? qcForm[size] : max;
                const rework = max - passed;

                return (
                  <div key={size} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-900">{size}</span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Total Stitched: {max}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-green-700 mb-1">Passed (Pay)</label>
                        <input 
                          type="number" min="0" max={max} required
                          className="w-full border-green-300 ring-green-200 focus:border-green-500 focus:ring-green-500 rounded-md border p-2 text-center"
                          value={passed}
                          onChange={e => {
                            const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), max);
                            handleQtyChange(size, val);
                          }}
                        />
                      </div>
                      
                      <ArrowRight size={16} className="text-gray-400 mt-5" />

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-red-700 mb-1">Rework (Return)</label>
                        <div className={`w-full p-2 text-center rounded-md border ${rework > 0 ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          {rework}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm mb-4 px-1">
               <span className="text-gray-500">Summary:</span>
               <div className="space-x-4 font-medium">
                 <span className="text-green-600">Passed: {totalPassed}</span>
                 <span className="text-red-600">Rework: {totalRework}</span>
               </div>
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
               Confirm QC Result
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}
