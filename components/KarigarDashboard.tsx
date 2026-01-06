/**
 * components/KarigarDashboard.tsx
 * STATUS: UPDATED with PIN Change Feature ✅
 * Purpose: detailed debugging of mobile camera upload issues
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../src/supabaseClient';
import { Camera, User as UserIcon, KeyRound } from 'lucide-react';
import { Batch, User, AssignmentStatus, SizeQty } from '../types';
import { Card, Badge } from './Shared';
import { format } from 'date-fns';
import { userService } from '../services/userService';

interface KarigarDashboardProps {
  currentUser: User;
  batches: Batch[];
  onAcceptAssignment: (batchId: string, assignmentId: string) => void;
  onRejectAssignment: (batchId: string, assignmentId: string) => void;
  onMarkComplete: (batchId: string, assignmentId: string) => void;
  onUpdateUser: (userId: string, data: Partial<User>) => void;
}

export const KarigarDashboard: React.FC<KarigarDashboardProps> = ({
  currentUser,
  batches,
  onAcceptAssignment,
  onRejectAssignment,
  onMarkComplete,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'passbook' | 'settings'>('jobs');
  const [isUploading, setIsUploading] = useState(false);
  const [newPin, setNewPin] = useState('');
  
  // 🐞 DEBUG STATE: Stores logs to show on screen
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const componentId = useRef(Math.random().toString(36).slice(2, 7)); // Track if component remounts

  // 📝 Helper to add logs to the on-screen console
  const log = (msg: string) => {
    const time = new Date().toISOString().split('T')[1].slice(0, 8); // HH:MM:SS
    setDebugLogs(prev => [`[${time}] ${msg}`, ...prev]);
    console.log(`[DEBUG] ${msg}`);
  };

  // 🕵️ Monitor Component Lifecycle
  useEffect(() => {
    log(`🚀 Dashboard Mounted (Instance: ${componentId.current})`);
    log(`👤 User ID: ${currentUser.id.slice(0, 5)}...`);
    
    return () => {
      console.log(`[DEBUG] 💀 Dashboard Unmounting (Instance: ${componentId.current})`);
    };
  }, []);

  // 🕵️ Monitor Auth/User Changes
  useEffect(() => {
    if (isUploading) {
      log(`⚠️ User prop updated while uploading!`);
    }
  }, [currentUser]);

  // Helper variables
  const userAvatar = currentUser.avatarUrl || (currentUser as any).avatar_url;
  const myAssignments = batches.flatMap(b => 
    (b.assignments || []).filter(a => a.karigarId === currentUser.id).map(a => ({ ...a, batch: b }))
  ).sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

  const activeJobs = myAssignments.filter(a => 
    [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.QC_REWORK].includes(a.status)
  );

  const passbookEntries = useMemo(() => {
    const ledger = currentUser.ledger || (currentUser as any).ledger || [];
    return [...ledger].slice().reverse();
  }, [currentUser]);

  const calculateTotalQty = (qty: SizeQty) => Object.values(qty).reduce((sum, val) => (sum as number) + (val as number), 0);
  const isAdvance = (currentUser.walletBalance ?? 0) < 0;

  // --- 📸 DEBUGGED PHOTO UPLOAD HANDLER ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Clear previous logs for clarity
    setDebugLogs([`[${new Date().toISOString().split('T')[1]}] 🎬 Starting Upload Process...`]);
    
    if (!file) {
      log('❌ No file selected (User cancelled?)');
      return;
    }

    log(`📁 File detected: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    log(`Current Instance: ${componentId.current}`);

    setIsUploading(true);
    
    try {
      const timestamp = Date.now();
      const extension = file.type.split('/')[1] || 'jpg';
      const cleanFilePath = `avatars/${currentUser.id}_${timestamp}.${extension}`;

      log(`🔹 Step 1: Uploading to Supabase Storage...`);
      log(`👉 Path: ${cleanFilePath}`);

      // 1. Upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('designs')
        .upload(cleanFilePath, file, { 
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        log(`❌ Upload Error: ${uploadError.message}`);
        throw uploadError;
      }
      log(`✅ Step 1 Success. Storage ID: ${(uploadData as any)?.path || 'ok'}`);

      // 2. Get URL
      log(`🔹 Step 2: Generating Public URL...`);
      const { data: urlData } = supabase.storage
        .from('designs')
        .getPublicUrl(cleanFilePath);
      
      const publicUrl = urlData.publicUrl;
      log(`✅ URL Generated: ${publicUrl.slice(0, 20)}...`);

      // 3. Update DB
      log(`🔹 Step 3: Updating Profile in DB...`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) {
        log(`❌ DB Error: ${updateError.message}`);
        throw updateError;
      }
      log(`✅ Step 3 Success: DB Updated.`);

      // 4. Update UI
      log(`🔹 Step 4: Updating Local State...`);
      onUpdateUser(currentUser.id, { avatarUrl: publicUrl });
      
      log(`🎉 SUCCESS! Photo updated.`);
      alert("✅ Photo Updated Successfully!");
      
    } catch (err: any) {
      log(`🔥 CRITICAL FAILURE: ${err.message || JSON.stringify(err)}`);
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      log(`🏁 Process Ended.`);
    }
  };

  return (
    <div className="space-y-6 pb-40"> {/* Extra padding for debug console */}
      
      {/* Karigar Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="relative shrink-0">
             <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100">
               {userAvatar ? (
                 <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400">
                   <UserIcon size={32} />
                 </div>
               )}
             </div>
             <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition-colors">
                <Camera size={14} />
                <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   onChange={handlePhotoUpload}
                   disabled={isUploading}
                />
             </label>
          </div>
          <div>
             <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
             <p className="text-sm text-gray-500">ID: {currentUser.mobile || '---'}</p>
             {isUploading && <span className="text-xs text-blue-500 animate-pulse font-bold">Saving photo...</span>}
          </div>
      </div>

      {/* Wallet Balance Card */}
      {isAdvance ? (
        <div className="bg-white border-2 border-red-500 rounded-2xl p-6 shadow-lg">
          <p className="text-red-500 mb-1 font-bold uppercase tracking-wide">Advance Taken</p>
          <h1 className="text-4xl font-bold text-red-600">- ₹{Math.abs(currentUser.walletBalance ?? 0).toLocaleString()}</h1>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-orange-100 mb-1 font-medium">Available Balance</p>
          <h1 className="text-4xl font-bold">₹{(currentUser.walletBalance ?? 0).toLocaleString()}</h1>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
        <button onClick={() => setActiveTab('jobs')} className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${activeTab === 'jobs' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500'}`}>My Jobs</button>
        <button onClick={() => setActiveTab('passbook')} className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${activeTab === 'passbook' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500'}`}>Passbook</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500'}`}>Settings</button>
      </div>

      {/* Content */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 px-1">Active Tasks</h3>
          {activeJobs.length === 0 && <p className="text-gray-500 text-center py-8">No active jobs assigned to you.</p>}
          {activeJobs.map(item => (
            <Card key={item.id} className="p-0 overflow-hidden border-2 border-gray-100 shadow-md">
              <div className="relative aspect-[4/5] bg-gray-100">
                <img 
                  src={item.batch.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt={item.batch.styleName} 
                />
                <div className="absolute top-3 right-3">
                  <Badge color={item.status === AssignmentStatus.ASSIGNED ? 'blue' : 'yellow'} className="shadow-sm">
                    {item.status}
                  </Badge>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h4 className="font-black text-gray-900 text-xl uppercase tracking-tight leading-none">
                      {item.batch.styleName}
                    </h4>
                    <p className="text-sm text-gray-500 mt-2 font-bold uppercase tracking-wider">
                      Job Allocation
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase">Total Qty</p>
                    <p className="text-2xl font-black text-blue-600">{calculateTotalQty(item.assignedQty)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Required Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.assignedQty)
                      .filter(([_, v]) => (v as number) > 0)
                      .map(([k, v]) => (
                        <div key={k} className="bg-white border-2 border-gray-200 px-3 py-1 rounded-lg flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{k}</span>
                          <span className="w-[1px] h-3 bg-gray-200" />
                          <span className="text-xs font-black text-blue-600">{v as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="p-4 pt-0 flex gap-3">
                {item.status === AssignmentStatus.ASSIGNED ? (
                  <>
                    <button 
                      className="flex-1 py-4 bg-white border-2 border-red-500 text-red-600 font-black rounded-xl active:scale-95 transition-all uppercase tracking-widest text-sm shadow-sm"
                      onClick={() => onRejectAssignment(item.batch.id, item.id)}
                    >
                      Reject
                    </button>
                    <button 
                      className="flex-1 py-4 bg-green-600 text-white font-black rounded-xl active:scale-95 transition-all uppercase tracking-widest text-sm shadow-lg border-b-4 border-green-800"
                      onClick={() => onAcceptAssignment(item.batch.id, item.id)}
                    >
                      Accept Job
                    </button>
                  </>
                ) : (
                  <button 
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-xl text-lg shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] border-b-4 border-blue-800"
                    onClick={() => onMarkComplete(item.batch.id, item.id)}
                  >
                    Mark as Stitched
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Passbook Tab */}
      {activeTab === 'passbook' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">Date</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-center">Rate</th>
                <th className="px-3 py-3 text-right">Cr</th>
                <th className="px-3 py-3 text-right">Dr</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {passbookEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                    {format(new Date(entry.date), 'dd MMM')}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-gray-900">{entry.description.split('[')[0]}</div>
                    {entry.description.includes('[') && (
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                        {entry.description.match(/\[(.*?)\]/)?.[1]}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-medium">{(entry as any).quantity || '-'}</td>
                  <td className="px-3 py-3 text-center text-gray-500">{(entry as any).rate ? `₹${(entry as any).rate}` : '-'}</td>
                  <td className="px-3 py-3 text-right text-green-700 font-black">{entry.type === 'CREDIT' ? `₹${entry.amount}` : '-'}</td>
                  <td className="px-3 py-3 text-right text-red-700 font-black">{entry.type === 'DEBIT' ? `₹${entry.amount}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settings Tab (PIN Change) */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4 text-gray-900 font-bold text-lg">
            <div className="bg-orange-100 p-2 rounded-full">
              <KeyRound className="text-orange-600" size={20} />
            </div>
            Change Login PIN
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New PIN (4-6 Digits)</label>
              <input 
                type="tel" 
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-mono tracking-widest focus:border-orange-500 focus:outline-none"
                placeholder="123456"
              />
            </div>
            
            <button 
              onClick={async () => {
                if(newPin.length < 4) return alert("PIN is too short!");
                if(!window.confirm("Change your login PIN?")) return;
                
                try {
                  await userService.updatePin(currentUser.id, newPin);
                  alert("✅ PIN Changed Successfully!");
                  setNewPin("");
                  onUpdateUser(currentUser.id, { displayPin: newPin } as any);
                } catch(e: any) {
                  alert("Error: " + e.message);
                }
              }}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Update PIN
            </button>
          </div>
        </div>
      )}

      {/* 🔴 ON-SCREEN DEBUGGER (Visible only on mobile/testing) */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-green-400 font-mono text-[10px] p-4 h-48 overflow-y-auto border-t-2 border-green-500 z-50">
        <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
          <span className="font-bold text-white">🐞 DEBUG CONSOLE</span>
          <button onClick={() => setDebugLogs([])} className="text-gray-400 underline">Clear</button>
        </div>
        {debugLogs.length === 0 && <span className="text-gray-600 italic">Waiting for actions...</span>}
        {debugLogs.map((log, i) => (
          <div key={i} className="mb-1 border-b border-gray-800 pb-1 break-all">
            {log}
          </div>
        ))}
      </div>

    </div>
  );
};
