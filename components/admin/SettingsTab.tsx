/**
 * components/admin/CreateBatchModal.tsx
 * STATUS: DEBUGGING MODE 🛠️
 * Fixes "Silent Failure" by removing <form> and using manual onClick
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';
import { RefreshCw, Upload } from 'lucide-react';
import { Batch, SizeQty } from '../../types';
import { SIZE_OPTIONS } from '../../constants';
import { Modal } from '../Shared';

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
  // DEBUG LOG: Prove the component loaded
  useEffect(() => {
    if (isOpen) console.log("🟢 CreateBatchModal Rendered & Open");
  }, [isOpen]);

  const [form, setForm] = useState({
    styleName: '',
    sku: '',
    ratePerPiece: 0,
    imageUrl: '',
    plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
  });

  const handleShopifySync = () => {
    console.log("🔄 Sync Triggered");
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

    console.log("📤 Uploading image...");
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `design-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, file);

    if (uploadError) {
      console.error("❌ Upload Failed:", uploadError);
      alert("Upload failed: " + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(filePath);

    console.log("✅ Image Uploaded:", publicUrl);
    setForm(prev => ({ ...prev, imageUrl: publicUrl }));
  };

  // ✅ MANUAL SUBMIT HANDLER
  const handleForceSubmit = () => {
    console.log("🚀 BUTTON CLICKED! Starting Force Submit...");
    console.log("📦 Form Data:", form);

    // 1. Simple Validation
    if (!form.styleName || !form.sku) {
      console.warn("⚠️ Validation Failed: Missing Name or SKU");
      alert("Please enter Style Name and SKU");
      return;
    }
    if (form.ratePerPiece <= 0) {
      console.warn("⚠️ Validation Failed: Rate is 0");
      alert("Rate must be greater than 0");
      return;
    }

    // 2. Call Parent
    console.log("✅ Validation Passed. Calling onSubmit...");
    try {
      onSubmit(form);
      console.log("🎉 onSubmit executed successfully.");
    } catch (err) {
      console.error("💥 Error in Parent onSubmit:", err);
      alert("System Error: " + err);
    }

    // 3. Close
    onClose();
    // Reset Form
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
      {/* 🛑 NO FORM TAG! Just a div. This prevents the browser from interfering. */}
      <div className="space-y-4">
        
        <div className="flex justify-end">
          <button 
            type="button" 
            onClick={handleShopifySync} 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <RefreshCw size={14} /> Sync from Shopify
          </button>
        </div>

        {/* INPUTS */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Style Name</label>
          <input 
            type="text" 
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            value={form.styleName}
            onChange={e => setForm({...form, styleName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
              value={form.sku}
              onChange={e => setForm({...form, sku: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rate (₹/pc)</label>
            <input 
              type="number" 
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
              value={form.ratePerPiece}
              onChange={e => setForm({...form, ratePerPiece: Number(e.target.value)})}
            />
          </div>
        </div>
        
        {/* IMAGE UPLOAD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input 
              type="url" 
              placeholder="Paste Image URL..."
              className="block w-full rounded-md border-gray-300 border p-2 text-sm"
              value={form.imageUrl}
              onChange={e => setForm({...form, imageUrl: e.target.value})}
            />
            
            <div className="relative flex justify-center py-2">
              <span className="bg-gray-50 px-2 text-xs text-gray-500">OR UPLOAD</span>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Click to upload</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* SIZES */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Planned Quantity</label>
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

        {/* ACTION BUTTONS */}
        <div className="pt-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          
          {/* ✅ TESTED BUTTON: type='button' + onClick */}
          <button 
            type="button" 
            onClick={handleForceSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
          >
            Create Batch
          </button>
        </div>

      </div>
    </Modal>
  );
};
