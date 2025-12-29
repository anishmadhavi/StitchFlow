/**
 * components/admin/CreateBatchModal.tsx
 * Purpose: Form to create new production batch
 */

import React, { useState } from 'react';
import { supabase } from '../../src/supabaseClient';
import { RefreshCw, Upload } from 'lucide-react';
import { Batch, SizeQty } from '../../types';
import { SIZE_OPTIONS } from '../../constants';
import { Button, Modal } from '../Shared';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (batch: Partial<Batch>) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [form, setForm] = useState({
    styleName: '',
    sku: '',
    ratePerPiece: 0,
    imageUrl: '',
    plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
  });

  const handleShopifySync = () => {
    const randomQty = SIZE_OPTIONS.reduce((acc, size) => {
      if (Math.random() > 0.5) acc[size] = Math.floor(Math.random() * 50) + 10;
      else acc[size] = 0;
      return acc;
    }, {} as SizeQty);

    setForm({
      styleName: 'Summer Breeze Kurti',
      sku: `SBK-${Math.floor(Math.random() * 1000)}`,
      ratePerPiece: 140,
      imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 100}/400/600`,
      plannedQty: randomQty
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `design-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(filePath);

    setForm(prev => ({ ...prev, imageUrl: publicUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
    setForm({
      styleName: '',
      sku: '',
      ratePerPiece: 0,
      imageUrl: '',
      plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Production Batch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-end">
          <button 
            type="button" 
            onClick={handleShopifySync} 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <RefreshCw size={14} /> Sync from Shopify
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Style Name</label>
          <input 
            required
            type="text" 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            value={form.styleName}
            onChange={e => setForm({...form, styleName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU</label>
            <input 
              required
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={form.sku}
              onChange={e => setForm({...form, sku: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rate (₹/pc)</label>
            <input 
              required
              type="number" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={form.ratePerPiece}
              onChange={e => setForm({...form, ratePerPiece: Number(e.target.value)})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input 
              type="url" 
              placeholder="Paste Image URL (https://...)"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
              value={form.imageUrl}
              onChange={e => setForm({...form, imageUrl: e.target.value})}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-2 text-xs text-gray-500">OR UPLOAD FROM GALLERY</span>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Click to upload image</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            
            {form.imageUrl && (
              <p className="text-xs text-green-600 text-center">Image ready!</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Planned Quantity by Size</label>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {SIZE_OPTIONS.map(size => (
              <div key={size} className="flex items-center space-x-2">
                <input 
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-20 text-center border-gray-300 rounded-md border p-1"
                  value={form.plannedQty[size] || ''}
                  onChange={e => setForm({
                    ...form, 
                    plannedQty: { ...form.plannedQty, [size]: Number(e.target.value) }
                  })}
                />
                <label className="text-xs text-gray-600 truncate">{size}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create Batch</Button>
        </div>
      </form>
    </Modal>
  );
};
