/**
 * components/shared/CreateBatchModal.tsx
 * STATUS: DIRECT DB FIX 🛠️
 * LOCATION: src/components/shared/CreateBatchModal.tsx
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient'; // Direct DB Access
import { RefreshCw, Upload } from 'lucide-react';
import { Batch, SizeQty, BatchStatus } from '../../types';
import { SIZE_OPTIONS } from '../../constants';
import { Modal } from '../Shared';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (batch: Partial<Batch>) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  // ✅ DEBUG 1: Prove the correct file is loaded
  useEffect(() => {
    if (isOpen) console.log("🟢 SHARED CreateBatchModal is Open (Correct File Loaded)");
  }, [isOpen]);

  const [form, setForm] = useState({
    styleName: '',
    sku: '',
    ratePerPiece: 0,
    imageUrl: '',
    plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
  });

  const [loading, setLoading] = useState(false);

  const handleShopifySync = () => {
    console.log("🔄 Sync clicked");
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

    setLoading(true);
    console.log("📤 Uploading image...");
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `design-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(filePath);

    setForm(prev => ({ ...prev, imageUrl: publicUrl }));
    setLoading(false);
    console.log("✅ Image ready:", publicUrl);
  };

  // ✅ DEBUG 2: The "Force" Submit Function
  const handleForceSubmit = async () => {
    console.log("🚀 Create Batch Button CLICKED!");
    
    // 1. Validation
    if (!form.styleName || !form.sku) {
      alert("Please enter Style Name and SKU");
      return;
    }
    if (form.ratePerPiece <= 0) {
      alert("Rate must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      // 2. Prepare Data (CamelCase -> snake_case for DB)
      const dbPayload = {
        style_name: form.styleName,
        sku: form.sku,
        rate_per_piece: form.ratePerPiece,
        image_url: form.imageUrl,
        planned_qty: form.plannedQty,
        status: BatchStatus.PENDING_MATERIAL,
        created_at: new Date().toISOString()
      };

      console.log("📦 Sending to Database:", dbPayload);

      // 3. Direct Insert
      const { data, error } = await supabase
        .from('batches')
        .insert([dbPayload])
        .select();

      if (error) {
        console.error("❌ DB Error:", error);
        throw error;
      }

      console.log("✅ Success:", data);
      alert("Batch created successfully!");
      
      onClose();
      window.location.reload(); 

    } catch (err: any) {
      console.error("💥 Creation Failed:", err);
      alert("Failed to create batch: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Production Batch">
      {/* 🛑 NO <form> TAG! Just a div to prevent browser interference */}
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

        <div className="pt-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          
          {/* ✅ DUMB BUTTON: Sends the signal immediately */}
          <button 
            type="button" 
            onClick={handleForceSubmit}
            disabled={loading}
            className={`bg-blue-600 text-white px-6 py-2 rounded font-bold ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {loading ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
