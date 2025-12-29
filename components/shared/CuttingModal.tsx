/**
 * components/shared/CuttingModal.tsx
 * Purpose: Finalize cutting quantities (used by Manager & Master)
 */

import React, { useState, useEffect } from 'react';
import { Batch, SizeQty } from '../../types';
import { SIZE_OPTIONS } from '../../constants';
import { Button, Modal } from '../Shared';

interface CuttingModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch;
  onSubmit: (batchId: string, actualQty: SizeQty) => void;
}

export const CuttingModal: React.FC<CuttingModalProps> = ({
  isOpen,
  onClose,
  batch,
  onSubmit
}) => {
  const [cutForm, setCutForm] = useState<SizeQty>(batch.plannedQty || {});

  // Update form when batch changes
  useEffect(() => {
    if (batch) {
      setCutForm(batch.plannedQty || {});
    }
  }, [batch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(batch.id, cutForm);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalize Cutting">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
          <p className="text-sm text-blue-800">
            <strong>{batch.styleName}</strong> - Enter actual cut quantities
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {SIZE_OPTIONS.map(size => (
            <div key={size}>
              <label className="block text-xs font-medium text-gray-700 truncate mb-1">
                {size}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full border rounded p-2 text-center" 
                value={cutForm[size] || ''} 
                onChange={e => setCutForm({...cutForm, [size]: Number(e.target.value)})} 
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Confirm Cutting</Button>
        </div>
      </form>
    </Modal>
  );
};
