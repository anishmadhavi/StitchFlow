/**
 * components/shared/CreateBatchModal.tsx
 * STATUS: DIRECT DB FIX 🛠️ UPDATED (Category Support + Optional SKU) ✅
 * LOCATION: src/components/shared/CreateBatchModal.tsx
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';
import { RefreshCw, Upload, Tag } from 'lucide-react';
import { Batch, SizeQty, BatchStatus, Category } from '../../types';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  
  const [form, setForm] = useState({
    styleName: '',
    sku: '',
    ratePerPiece: 0,
    imageUrl: '',
    plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
  });

  const [loading, setLoading] = useState(false);
  const [isShopifySynced, setIsShopifySynced] = useState(false);

  // 1. Fetch Categories on Open
  useEffect(() => {
    if (isOpen) {
      console.log("🟢 Modal Open. Fetching categories...");
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) {
      setCategories(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        defaultRate: c.default_rate,
        allowedSizes: c.allowed_sizes
      })));
    }
  };

  // 2. Handle Category Selection (Auto-fill Rate & Sizes)
  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    const cat = categories.find(c => c.id === catId);
    
    if (cat) {
      setForm(prev => ({
        ...prev,
        ratePerPiece: cat.defaultRate // Auto-set Rate
      }));
    }
  };

  // 3. Shopify Sync Logic
  const handleShopifySync = () => {
    console.log("🔄 Sync clicked");
    setIsShopifySynced(true); // Mark as synced
    
    // Simulate Shopify Data
    const randomQty = SIZE_OPTIONS.reduce((acc, size) => {
      acc[size] = Math.floor(Math.random() * 50); 
      return acc;
    }, {} as SizeQty);

    setForm({
      styleName: 'Summer Breeze Kurti (Shopify)',
      sku: `SBK-${Math.floor(Math.random() * 1000)}`, // SKU from Shopify
      ratePerPiece: 0, // Rate still needs manual/category input
      imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 100}/400/600`,
      plannedQty: randomQty
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `design-images/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('designs').upload(filePath, file);
    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(filePath);
    setForm(prev => ({ ...prev, imageUrl: publicUrl }));
    setLoading(false);
  };

  // 4. Force Submit Logic
  const handleForceSubmit = async () => {
    console.log("🚀 Submit Clicked");

    // Validation
    if (!form.styleName) {
      alert("Style Name is required");
      return;
    }
    
    // SKU is ONLY required if synced from Shopify (or if you want to enforce it)
    // User said: "SKU is not mandatory, only when product is sync through shopify"
    if (isShopifySynced && !form.sku) {
      alert("Synced products must have a SKU.");
      return;
    }

    if (form.ratePerPiece <= 0) {
      alert("Rate must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      const dbPayload = {
        style_name: form.styleName,
        sku: form.sku || null, // Allow NULL if empty
        rate_per_piece: form.ratePerPiece,
        image_url: form.imageUrl,
        planned_qty: form.plannedQty,
        status: BatchStatus.PENDING_MATERIAL,
        created_at: new Date().toISOString()
      };

      console.log("📦 Payload:", dbPayload);

      const { error } = await supabase.from('batches').insert([dbPayload]);
      if (error) throw error;

      alert("Batch created successfully!");
      onClose();
      window.location.reload(); 

    } catch (err: any) {
      console.error("💥 Error:", err);
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Determine which sizes to show
  const selectedCategory = categories.find(c => c.id === selectedCatId);
  const sizesToShow = selectedCategory ? selectedCategory.allowedSizes : SIZE_OPTIONS;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Production Batch">
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

        {/* 1. CATEGORY SELECTOR */}
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
            <Tag size={12}/> Select Category (Auto-fills Rate & Sizes)
          </label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={selectedCatId}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">-- Manual / No Category --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name} (₹{cat.defaultRate})</option>
            ))}
          </select>
        </div>

        {/* Style Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Style Name *</label>
          <input 
            type="text" 
            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
            value={form.styleName}
            onChange={e => setForm({...form, styleName: e.target.value})}
          />
        </div>

        {/* SKU & Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU {isShopifySynced ? '*' : '(Optional)'}</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
              value={form.sku}
              placeholder={isShopifySynced ? "Required" : "Auto-generated if empty"}
              onChange={e => setForm({...form, sku: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rate (₹/pc) *</label>
            <input 
              type="number" 
              className="mt-1 block w-full rounded-md border-gray-300 border p-2"
              value={form.ratePerPiece}
              onChange={e => setForm({...form, ratePerPiece: Number(e.target.value)})}
            />
          </div>
        </div>
        
        {/* Image Upload (Kept same) */}
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

        {/* DYNAMIC SIZES */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned Quantity {selectedCategory ? `(Category: ${selectedCategory.name})` : ''}
          </label>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {sizesToShow.map(size => (
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

        {/* Buttons */}
        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleForceSubmit}
            disabled={loading}
            className={`bg-blue-600 text-white px-6 py-2 rounded font-bold ${loading ? 'opacity-50' : 'hover:bg-blue-700'}`}
          >
            {loading ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
