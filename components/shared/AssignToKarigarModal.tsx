/**
 * components/admin/AssignModal.tsx
 * Purpose: Assign batch stock to karigar
 */

import React, { useState } from 'react';
import { Batch, User, SizeQty } from '../../types';
import { Button, Modal } from '../Shared';

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch;
  karigars: User[];
  onSubmit: (batchId: string, karigarId: string, qty: SizeQty) => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  onClose,
  batch,
  karigars,
  onSubmit
}) => {
  const [form, setForm] = useState<{ karigarId: string; qty: SizeQty }>({
    karigarId: '',
    qty: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.karigarId) {
      onSubmit(batch.id, form.karigarId, form.qty);
      onClose();
      setForm({ karigarId: '', qty: {} });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign to Karigar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <select 
          required 
          className="w-full border rounded p-2" 
          value={form.karigarId} 
          onChange={e => setForm({...form, karigarId: e.target.value})}
        >
          <option value="">-- Select Karigar --</option>
          {karigars.map(k => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>

        <div className="bg-gray-50 p-3 rounded text-sm grid grid-cols-2 gap-2 text-xs">
          {Object.entries(batch.availableQty || {})
            .filter(([_,v]) => (v as number) > 0)
            .map(([k,v]) => (
              <span key={k}>{k}: {v as number}</span>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto">
          {Object.keys(batch.availableQty || {})
            .filter(k => (batch.availableQty[k] || 0) > 0)
            .map(size => {
              const max = batch.availableQty[size] || 0;
              return (
                <div key={size}>
                  <label className="block text-xs font-medium text-center truncate mb-1">
                    {size} (Max: {max})
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max={max} 
                    className="w-full border rounded p-2 text-center" 
                    value={form.qty[size] || ''} 
                    onChange={e => setForm({
                      ...form, 
                      qty: { ...form.qty, [size]: Number(e.target.value) }
                    })} 
                  />
                </div>
              );
            })}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Assign Stock</Button>
        </div>
      </form>
    </Modal>
  );
};
