/**
 * components/KarigarDashboard.tsx
 * STATUS: UPDATED (Added Detailed Passbook Table) ✅
 */

import React, { useState, useMemo } from 'react';
import { supabase } from '../src/supabaseClient';
import { BookOpen, CheckCircle, XCircle, Shirt, AlertOctagon, Camera, User as UserIcon } from 'lucide-react';
import { Batch, Assignment, User, AssignmentStatus, SizeQty } from '../types';
import { Button, Card, Badge } from './Shared';
import { format } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState<'jobs' | 'passbook'>('jobs');
  const [isUploading, setIsUploading] = useState(false);

  // Helper to handle the snake_case vs camelCase image issue
  const userAvatar = currentUser.avatarUrl || (currentUser as any).avatar_url;

  const myAssignments = batches.flatMap(b => 
    (b.assignments || [])
      .filter(a => a.karigarId === currentUser.id)
      .map(a => ({ ...a, batch: b }))
  ).sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

  const activeJobs = myAssignments.filter(a => 
    [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.QC_REWORK].includes(a.status)
  );

  const passbookEntries = useMemo(() => {
    // ✅ CHECK BOTH NAMES: Frontend 'ledger' or Database 'u.ledger'
    const ledger = currentUser.ledger || (currentUser as any).ledger || [];
    return [...ledger].slice().reverse();
  }, [currentUser]);

  const calculateTotalQty = (qty: SizeQty) => Object.values(qty).reduce((sum, val) => (sum as number) + (val as number), 0);
  const isAdvance = (currentUser.walletBalance ?? 0) < 0;

  // --- Profile Photo Handler ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const filePath = `avatars/${currentUser.id}.jpg`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('designs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(filePath);
      
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      onUpdateUser(currentUser.id, { avatarUrl: publicUrl });
      alert("Photo updated!");
      window.location.reload(); 

    } catch (err: any) {
      alert("Photo error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
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
                   capture="user" 
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
        <button onClick={() => setActiveTab('passbook')} className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${activeTab === 'passbook' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500'}`}>My Passbook</button>
      </div>

      {/* Content */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 px-1">Active Tasks</h3>
          {activeJobs.length === 0 && <p className="text-gray-500 text-center py-8">No active jobs assigned to you.</p>}
          {activeJobs.map(item => (
            <Card key={item.id} className="p-0 overflow-hidden border-2 border-gray-100">
              <div className="p-4 flex gap-4">
                <img src={item.batch.imageUrl} className="w-24 h-24 rounded bg-gray-100 object-cover" alt="" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-lg">{item.batch.styleName}</h4>
                    <Badge color={item.status === AssignmentStatus.ASSIGNED ? 'blue' : 'yellow'}>{item.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-bold">Total: {calculateTotalQty(item.assignedQty)} Pcs</p>
                  <div className="flex flex-wrap gap-2 text-xs mt-2 font-mono">
                    {Object.entries(item.assignedQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => (
                      <span key={k} className="border bg-gray-50 px-2 py-0.5 rounded-md font-bold">{k}: {v as number}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 border-t flex gap-3">
                {item.status === AssignmentStatus.ASSIGNED ? (
                  <>
                    <button 
                      className="flex-1 py-4 bg-white border-2 border-red-500 text-red-600 font-bold rounded-xl active:scale-95 transition-all"
                      onClick={async () => {
                      // ✅ ADDED BATCHES: The service now needs the full batches list to calculate stock return
                         await onRejectAssignment(item.batch.id, item.id, batches);
                      }}
                    >
                     Reject
                   </button>
                    <button 
                      className="flex-1 py-4 bg-green-600 text-white font-bold rounded-xl active:scale-95 transition-all"
                      onClick={async () => {
                         await onAcceptAssignment(item.batch.id, item.id);
                         window.location.reload();
                      }}
                    >
                      Accept Job
                    </button>
                  </>
                ) : (
                  <button 
                    className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-lg shadow-lg active:scale-95 transition-all uppercase tracking-widest"
                    onClick={async () => {
                       await onMarkComplete(item.batch.id, item.id);
                       alert("Sent to QC Team!");
                       window.location.reload(); 
                    }}
                  >
                    Mark as Stitched
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ✅ UPDATED: Added Rate and Quantity Columns with Size Extraction */}
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
                    {/* ✅ Show sizes if they exist in brackets */}
                    {entry.description.includes('[') && (
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                        {entry.description.match(/\[(.*?)\]/)?.[1]}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-medium">
                    {(entry as any).quantity || '-'}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-500">
                    {(entry as any).rate ? `₹${(entry as any).rate}` : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-green-700 font-black">
                    {entry.type === 'CREDIT' ? `₹${entry.amount}` : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-red-700 font-black">
                    {entry.type === 'DEBIT' ? `₹${entry.amount}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
