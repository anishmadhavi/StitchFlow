/**
 * components/admin/SettingsTab.tsx
 * STATUS: UPDATED ✅
 * Features: Shopify Integration + Category Management
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, CheckCircle, AlertCircle, Plus, Trash2, Tag } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import { Button, Card, Badge } from '../Shared';
import { Category } from '../../types';
import { SIZE_OPTIONS } from '../../constants';

export const SettingsTab: React.FC = () => {
  // --- SHOPIFY STATE ---
  const [shopifyConfig, setShopifyConfig] = useState({ domain: '', token: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  // --- CATEGORY STATE ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState({ name: '', rate: 0, sizes: [] as string[] });
  const [catLoading, setCatLoading] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  // ------------------------------------------------------------------
  // 1. SHOPIFY LOGIC
  // ------------------------------------------------------------------
  const loadSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('key', 'shopify_config').single();
    if (data?.value) setShopifyConfig(data.value);
  };

  const handleSaveShopify = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'shopify_config', value: shopifyConfig
      });
      if (error) throw error;
      setMessage('Settings saved!');
      setTestResult('success');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
      setTestResult('error');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`https://${shopifyConfig.domain}/admin/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': shopifyConfig.token, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Connection failed');
      setTestResult('success');
      setMessage('Connected Successfully!');
    } catch (err) {
      setTestResult('error');
      setMessage('Connection Failed.');
    } finally {
      setIsTesting(false);
    }
  };

  // ------------------------------------------------------------------
  // 2. CATEGORY LOGIC
  // ------------------------------------------------------------------
  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    
    if (data) {
      // Map DB snake_case to UI camelCase
      const formatted: Category[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        defaultRate: c.default_rate,
        allowedSizes: c.allowed_sizes
      }));
      setCategories(formatted);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCat.name || newCat.rate <= 0 || newCat.sizes.length === 0) {
      alert("Please enter Name, Rate, and select at least one Size.");
      return;
    }
    setCatLoading(true);

    const dbPayload = {
      name: newCat.name,
      default_rate: newCat.rate,
      allowed_sizes: newCat.sizes
    };

    const { error } = await supabase.from('categories').insert([dbPayload]);
    
    if (error) alert("Error creating category: " + error.message);
    else {
      setNewCat({ name: '', rate: 0, sizes: [] }); // Reset form
      loadCategories(); // Reload list
    }
    setCatLoading(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if(!confirm("Delete this category?")) return;
    await supabase.from('categories').delete().eq('id', id);
    loadCategories();
  };

  const toggleSize = (size: string) => {
    setNewCat(prev => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size]
      };
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      
      {/* SECTION 1: CATEGORY MANAGER */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
          <Tag className="text-blue-600" /> Category Management
        </h3>

        {/* Create Form */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">Create New Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category Name</label>
              <input 
                type="text" 
                className="w-full border rounded p-2"
                placeholder="e.g. Cord Set"
                value={newCat.name}
                onChange={e => setNewCat({...newCat, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Default Rate (₹)</label>
              <input 
                type="number" 
                className="w-full border rounded p-2"
                placeholder="0"
                value={newCat.rate || ''}
                onChange={e => setNewCat({...newCat, rate: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Allowed Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map(size => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1 rounded text-xs border ${
                    newCat.sizes.includes(size) 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleCreateCategory} disabled={catLoading}>
            <Plus size={16} className="mr-2"/> Create Category
          </Button>
        </div>

        {/* Existing Categories List */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3">Existing Categories</h4>
          <div className="space-y-3">
            {categories.length === 0 && <p className="text-sm text-gray-400 italic">No categories found.</p>}
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between bg-white border p-3 rounded shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{cat.name}</span>
                    <Badge color="green">₹{cat.defaultRate}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Sizes: {cat.allowedSizes.join(', ')}
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-gray-400 hover:text-red-600 p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* SECTION 2: SHOPIFY SETTINGS (Kept your existing code) */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
          <RefreshCw className="text-green-600" /> Shopify Integration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Domain</label>
            <input 
              type="text" 
              className="w-full border rounded p-2"
              value={shopifyConfig.domain}
              onChange={e => setShopifyConfig({...shopifyConfig, domain: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
            <input 
              type="password" 
              className="w-full border rounded p-2"
              value={shopifyConfig.token}
              onChange={e => setShopifyConfig({...shopifyConfig, token: e.target.value})}
            />
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${testResult === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}
          
          <div className="flex gap-4 pt-2">
            <Button variant="outline" onClick={testConnection} disabled={isTesting}>Test Connection</Button>
            <Button onClick={handleSaveShopify} disabled={isSaving}>Save Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
