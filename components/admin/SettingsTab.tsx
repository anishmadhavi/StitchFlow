/**
 * components/admin/SettingsTab.tsx
 * Purpose: Real Shopify Integration
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import { Button, Card } from '../Shared';

export const SettingsTab: React.FC = () => {
  const [shopifyConfig, setShopifyConfig] = useState({
    domain: '',
    token: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'shopify_config')
      .single();

    if (data?.value) {
      setShopifyConfig(data.value);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      // First check if table exists, if not just save to localStorage
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'shopify_config',
          value: shopifyConfig
        })
        .select();

      if (error) {
        // Fallback to localStorage if table doesn't exist
        localStorage.setItem('shopify_config', JSON.stringify(shopifyConfig));
      }

      if (error) throw error;

      setMessage('Settings saved successfully!');
      setTestResult('success');
    } catch (error: any) {
      setMessage('Error saving settings: ' + error.message);
      setTestResult('error');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setMessage('');

    try {
      // Test Shopify API connection
      const response = await fetch(`https://${shopifyConfig.domain}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': shopifyConfig.token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Connection failed');

      const data = await response.json();
      setTestResult('success');
      setMessage(`Connected to: ${data.shop.name}`);
    } catch (error: any) {
      setTestResult('error');
      setMessage('Connection failed. Check your domain and token.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
        <RefreshCw className="text-green-600" /> Shopify Integration Settings
      </h3>
      
      <div className="space-y-6">
        {/* Domain Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shopify Store Domain
          </label>
          <input 
            type="text" 
            placeholder="your-store.myshopify.com"
            className="mt-1 block w-full rounded-md border-gray-300 border p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={shopifyConfig.domain}
            onChange={e => setShopifyConfig({...shopifyConfig, domain: e.target.value})}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your store domain (e.g., mystore.myshopify.com)
          </p>
        </div>
        
        {/* Token Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin API Access Token
          </label>
          <input 
            type="password" 
            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
            className="mt-1 block w-full rounded-md border-gray-300 border p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
            value={shopifyConfig.token}
            onChange={e => setShopifyConfig({...shopifyConfig, token: e.target.value})}
          />
          <p className="text-xs text-gray-500 mt-1">
            Access token from your Shopify custom app
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            testResult === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            testResult === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {testResult === 'success' && <CheckCircle size={16} />}
            {testResult === 'error' && <AlertCircle size={16} />}
            <span className="text-sm">{message}</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="pt-4 flex items-center gap-4 border-t">
          <Button 
            onClick={testConnection} 
            variant="outline"
            disabled={!shopifyConfig.domain || !shopifyConfig.token || isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={!shopifyConfig.domain || !shopifyConfig.token || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Settings size={12} /> Used for product sync in "New Batch"
          </span>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <h4 className="font-medium text-gray-900 mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Go to Shopify Admin → Apps → Develop apps</li>
            <li>Select your custom app</li>
            <li>Copy the Admin API access token</li>
            <li>Paste it above and click "Test Connection"</li>
            <li>If successful, click "Save Settings"</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};
