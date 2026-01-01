/**
 * components/shared/AssignToKarigarModal.tsx
 * STATUS: FIXED (Image Mapping + Vertical Card UI) ✅
 */

import React, { useState } from 'react';
import { Batch, User, SizeQty } from '../../types';
import { Modal } from '../Shared';
import { UserPlus, ChevronLeft, User as UserIcon } from 'lucide-react';

interface AssignToKarigarModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch;
  karigars: User[];
  onSubmit: (batchId: string, karigarId: string, qty: SizeQty) => void;
}

export const AssignToKarigarModal: React.FC<AssignToKarigarModalProps> = ({
  isOpen,
  onClose,
  batch,
  karigars,
  onSubmit
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedKarigar, setSelectedKarigar] = useState<User | null>(null);
  const [formQty, setFormQty] = useState<SizeQty>({});

  const handleSelectKarigar = (karigar: User) => {
    setSelectedKarigar(karigar);
    setStep(2);
  };

  const handleBack = () => {
    setSelectedKarigar(null);
    setStep(1);
  };

  const handleSubmit = () => {
    if (selectedKarigar) {
      onSubmit(batch.id, selectedKarigar.id, formQty);
      onClose();
      setStep(1);
      setSelectedKarigar(null);
      setFormQty({});
    }
  };

  const availableQty = batch?.availableQty || {};
  const availableEntries = Object.entries(availableQty).filter(([_, v]) => (v as number) > 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        onClose();
        setStep(1);
      }} 
      title={step === 1 ? "Select Karigar" : "Assign Quantity"}
    >
      <div className="space-y-4">
        
        {/* STEP 1: KARIGAR SELECTION (VERTICAL CARDS) */}
        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto p-1">
            {karigars.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No Karigars found.</p>
            ) : (
              karigars.map(k => {
                // ✅ FIX: Map both avatarUrl and avatar_url
                const kAvatar = k.avatarUrl || (k as any).avatar_url;
                
                return (
                  <div 
                    key={k.id}
                    onClick={() => handleSelectKarigar(k)}
                    className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:border-blue-500 transition-all cursor-pointer group active:scale-95"
                  >
                    <div className="flex flex-col items-center p-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 mb-3 shadow-md bg-gray-100">
                        {kAvatar ? (
                          <img src={kAvatar} className="w-full h-full object-cover" alt={k.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <UserIcon size={40} />
                          </div>
                        )}
                      </div>
                      <h4 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                        {k.name}
                      </h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                        Tap to select
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* STEP 2: QUANTITY INPUT */}
        {step === 2 && selectedKarigar && (
          <div className="space-y-8">
            {/* Karigar Preview Header */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <button onClick={handleBack} className="p-2 hover:bg-white rounded-full transition-colors">
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              {/* ✅ FIX: Map both for the header preview too */}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-200">
                {(selectedKarigar.avatarUrl || (selectedKarigar as any).avatar_url) ? (
                  <img 
                    src={selectedKarigar.avatarUrl || (selectedKarigar as any).avatar_url} 
                    className="w-full h-full object-cover" 
                    alt="" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Assigning to</p>
                <h4 className="text-lg font-black text-gray-900 leading-none">{selectedKarigar.name}</h4>
              </div>
            </div>

            {/* Quantity Inputs */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 max-h-[45vh] overflow-y-auto pr-1">
              {availableEntries.map(([size, max]) => (
                <div key={size} className="space-y-2">
                  <label className="block text-lg font-black text-gray-800 text-center uppercase tracking-tight">
                    {size} <span className="text-blue-600">(Max: {max as number})</span>
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max={max as number} 
                    className="w-full border-2 border-gray-100 rounded-xl p-4 text-center text-2xl font-black focus:border-blue-500 focus:outline-none transition-colors shadow-sm bg-white" 
                    placeholder="0"
                    value={formQty[size] || ''} 
                    onChange={e => setFormQty({
                      ...formQty, 
                      [size]: Math.min(Number(e.target.value), max as number) 
                    })} 
                  />
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button 
              onClick={handleSubmit}
              disabled={Object.values(formQty).every(v => !v || v === 0)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-xl shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50 disabled:active:scale-100 mt-4"
            >
              <UserPlus size={24} /> Confirm Assignment
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex justify-center pt-2">
            <button 
              onClick={onClose}
              className="text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
