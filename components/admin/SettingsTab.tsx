/**
 * components/admin/SettingsTab.tsx
 * Purpose: Application settings (Shopify integration)
 */

import React, { useState } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { Button, Card } from '../Shared';

export const SettingsTab: React.FC = () => {
  const [shopifyConfig, setShopifyConfig] = useState({
    domain: '',
    token: ''
  });

  const handleSave = () => {
    alert('Settings Saved! (Mock)');
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
        <RefreshCw className="text-green-600" /> Shopify Integration Settings
      </h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Shopify Store Domain
          </label>
          <input 
            type="text" 
            placeholder="your-store.myshopify.com"
            className="mt-1 block w-full rounded-md border-gray-300 border p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={shopifyConfig.domain}
            onChange={e => setShopifyConfig({...shopifyConfig, domain: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Admin Access Token
          </label>
          <input 
            type="password" 
            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
            className="mt-1 block w-full rounded-md border-gray-300 border p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
            value={shopifyConfig.token}
            onChange={e => setShopifyConfig({...shopifyConfig, token: e.target.value})}
          />
        </div>
        
        <div className="pt-4 flex items-center gap-4">
          <Button onClick={handleSave}>Save Connection</Button>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Settings size={12} /> This will allow product sync in "New Batch"
          </span>
        </div>
      </div>
    </Card>
  );
};
