/**
 * components/KarigarDashboard.tsx
 * Purpose: Karigar (Worker) Interface.
 * Description: Allows KARIGARs to view assigned jobs, mark them as 'Stitched', and view their digital passbook/wallet.
 * Compatibility: Client-side React.
 */

import React, { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, CheckCircle, XCircle, Shirt, AlertOctagon, Camera } from 'lucide-react';
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

  // Flatten assignments to find ones for this karigar
  const myAssignments = batches.flatMap(b => 
    b.assignments
      .filter(a => a.karigarId === currentUser.id)
      .map(a => ({ ...a, batch: b })) // Attach batch details for display
  ).sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

  const activeJobs = myAssignments.filter(a => 
    [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.QC_REWORK].includes(a.status)
  );

  // --- Caching / Memoization for Passbook ---
  // This ensures we don't re-calculate or re-sort the ledger array unless the ledger data actually changes.
  // This simulates the "cache" behavior requested, providing immediate updates when currentUser.ledger changes (e.g., after payment).
  const passbookEntries = useMemo(() => {
      return currentUser.ledger.slice().reverse();
  }, [currentUser.ledger]);

  const calculateTotalQty = (qty: SizeQty) => Object.values(qty).reduce((sum, val) => sum + val, 0);

  const isAdvance = currentUser.walletBalance < 0;

  // --- Profile Photo Handler ---
const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const filePath = `avatars/${currentUser.id}.jpg`;

    // Save selfie to Storage
    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(filePath);
      
      // Persist the new photo URL to the database
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      onUpdateUser(currentUser.id, { avatarUrl: publicUrl });
    }
    setIsUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* Karigar Header with Wallet & Profile */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="relative shrink-0">
             <img 
               src={currentUser.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`} 
               alt="Profile" 
               className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-gray-200"
             />
             <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition-colors">
                <Camera size={14} />
                <input 
                   type="file" 
                   accept="image/*" 
                   capture="user" // Open front camera on mobile
                   className="hidden" 
                   onChange={handlePhotoUpload}
                   disabled={isUploading}
                />
             </label>
          </div>
          <div>
             <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
             <p className="text-sm text-gray-500">ID: {currentUser.mobile || '---'}</p>
             {isUploading && <span className="text-xs text-blue-500 animate-pulse">Updating photo...</span>}
          </div>
      </div>

      {isAdvance ? (
        <div className="bg-white border-2 border-red-500 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-red-500 mb-1 font-bold uppercase tracking-wide">Advance Taken</p>
              <h1 className="text-4xl font-bold tracking-tight text-red-600">
                - ₹{Math.abs(currentUser.walletBalance).toLocaleString()}
              </h1>
            </div>
            <AlertOctagon className="w-16 h-16 text-red-100" />
          </div>
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-red-50 to-transparent opacity-50"></div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-orange-100 mb-1 font-medium">Available Balance</p>
              <h1 className="text-4xl font-bold tracking-tight">₹{currentUser.walletBalance.toLocaleString()}</h1>
            </div>
            <BookOpen className="w-16 h-16 text-orange-200 opacity-50" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${activeTab === 'jobs' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          My Jobs
        </button>
        <button 
          onClick={() => setActiveTab('passbook')}
          className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${activeTab === 'passbook' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          My Passbook
        </button>
      </div>

      {/* Content */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 px-1">Active Tasks</h3>
          {activeJobs.length === 0 && <p className="text-gray-500 text-center py-8">No active jobs assigned to you.</p>}
          {activeJobs.map(item => (
            <Card key={item.id} className="p-0 overflow-hidden">
              <div className="p-4 flex gap-4">
                <img src={item.batch.imageUrl} className="w-24 h-24 rounded bg-gray-100 object-cover" alt="" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-lg">{item.batch.styleName}</h4>
                    <Badge color={item.status === AssignmentStatus.ASSIGNED ? 'blue' : 'yellow'}>{item.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Total Pieces: {calculateTotalQty(item.assignedQty)}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2 font-mono bg-gray-50 p-2 rounded">
                    {Object.entries(item.assignedQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => (
                      <span key={k} className="border border-gray-200 bg-white px-1 rounded">{k}: {v as number}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Action Bar */}
              <div className="bg-gray-50 p-3 border-t flex gap-3">
{item.status === 'Assigned' ? (
                  <>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-3"
                      onClick={async () => {
                         // Logic to return stock to batch available_qty would go here for Rejections
                         await supabase.from('assignments').update({ status: 'Rejected' }).eq('id', item.id);
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="flex-1 py-3 bg-green-600"
                      onClick={async () => {
                         await supabase.from('assignments').update({ status: 'Accepted' }).eq('id', item.id);
                      }}
                    >
                      Accept
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full py-3 bg-blue-600"
                    onClick={async () => {
                       await supabase.from('assignments').update({ 
                         status: 'Stitched',
                         completed_at: new Date().toISOString() 
                       }).eq('id', item.id);
                    }}
                  >
                    Mark as Stitched
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'passbook' && (
        <div className="space-y-4">
           {/* Detailed Table */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right text-green-700 bg-green-50/50">Credit</th>
                    <th className="px-4 py-3 text-right text-red-700 bg-red-50/50">Debit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {passbookEntries.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-12 text-gray-400">No transactions recorded yet</td></tr>
                  )}
                  {passbookEntries.map(entry => (
                     <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {format(new Date(entry.date), 'dd MMM')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                            {entry.description}
                        </td>
                        <td className="px-4 py-3 text-right text-green-700 font-bold bg-green-50/30">
                            {entry.type === 'CREDIT' ? `₹${entry.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-red-700 font-bold bg-red-50/30">
                            {entry.type === 'DEBIT' ? `₹${entry.amount.toLocaleString()}` : '-'}
                        </td>
                     </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};
