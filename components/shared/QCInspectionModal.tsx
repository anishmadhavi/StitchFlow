/**
 * components/shared/QCInspectionModal.tsx
 * Purpose: QC inspection with pass/rework (NULL SAFE)
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { SizeQty } from '../../types';
import { Button, Modal } from '../Shared';

interface QCInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Assignment with batch info
  onSubmit: (batchId: string, assignmentId: string, passedQty: SizeQty) => void;
}

export const QCInspectionModal: React.FC<QCInspectionModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit
}) => {
  const [qcForm, setQcForm] = useState<SizeQty>({});

  // Initialize form with all passed (optimistic default) - NULL SAFE
  useEffect(() => {
    if (item?.assignedQty) {
      setQcForm(item.assignedQty);
    }
  }, [item]);

  const handleQtyChange = (size: string, val: number) => {
    setQcForm(prev => ({ ...prev, [size]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item?.batch?.id && item?.id) {
      onSubmit(item.batch.id, item.id, qcForm);
      onClose();
    }
  };

  if (!item) return null;

  // NULL SAFE calculations
  const assignedQty = item.assignedQty || {};
  const totalPassed = Object.values(qcForm).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalAssigned = Object.values(assignedQty).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalRework = totalAssigned - totalPassed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QC Inspection">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-900 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            Enter <strong>PASSED</strong> quantity for each size. 
            Remainder is automatically marked as <strong>REWORK</strong>.
          </p>
        </div>

        {/* Batch Info */}
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm">
            <strong>{item.batch?.styleName || 'Batch'}</strong> • 
            Karigar: {item.karigarName || 'Unknown'}
          </p>
        </div>

        {/* Size Inputs */}
        <div className="max-h-[50vh] overflow-y-auto pr-1 grid grid-cols-1 gap-4">
          {Object.entries(assignedQty).map(([size, maxValue]) => {
            const max = Number(maxValue) || 0;
            if (max === 0) return null;

            const passed = qcForm[size] !== undefined ? Number(qcForm[size]) : max;
            const rework = max - passed;

            return (
              <div key={size} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900">{size}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                    Total: {max}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-green-700 mb-1">
                      Passed (Pay)
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      max={max} 
                      required 
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
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Rework (Return)
                    </label>
                    <div className={`w-full p-2 text-center rounded-md border ${
                      rework > 0 
                        ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}>
                      {rework}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
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
  );
};
