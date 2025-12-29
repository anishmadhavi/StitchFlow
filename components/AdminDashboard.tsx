/**
 * components/AdminDashboard.tsx
 * Purpose: Admin Interface.
 * Description: Main dashboard for the ADMIN role. Allows batch creation, user management (Staff), and financial overview (Payments/Ledger).
 * Compatibility: Client-side React.
 */

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Archive, RefreshCw, Trash2, UserPlus, BookOpen, Briefcase, Key, Phone, Settings, Upload, Eye, ArrowRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Batch, BatchStatus, Role, User, SizeQty, AssignmentStatus } from '../types';
import { SIZE_OPTIONS } from '../constants';
import { Button, Card, Badge, Modal } from './Shared';
import { format } from 'date-fns';

interface AdminDashboardProps {
  batches: Batch[];
  users: User[];
  onCreateBatch: (batch: Partial<Batch>) => void;
  onPayKarigar: (karigarId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') => void;
  onArchiveBatch: (batchId: string) => void;
  onAddUser: (name: string, role: Role, mobile: string, pin: string) => void;
  onDeleteUser: (userId: string) => void;
  onAssignToKarigar: (batchId: string, karigarId: string, qty: SizeQty) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  batches,
  users,
  onCreateBatch,
  onPayKarigar,
  onArchiveBatch,
  onAddUser,
  onDeleteUser,
  onAssignToKarigar
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'staff' | 'payments' | 'settings'>('batches');
  
  // --- Create Batch State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({
    styleName: '',
    sku: '',
    ratePerPiece: 0,
    imageUrl: '',
    plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
  });

  // --- Batch Detail & Assignment View State ---
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [viewBatchModalOpen, setViewBatchModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState<{ karigarId: string; qty: SizeQty }>({ 
    karigarId: '', 
    qty: {} 
  });

  // --- Add User State ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ 
    name: '', 
    role: Role.KARIGAR,
    mobile: '',
    pin: ''
  });

  // --- Payment / Passbook State ---
  const [passbookModal, setPassbookModal] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [paymentForm, setPaymentForm] = useState({ amount: '', remark: '', type: 'DEBIT' as 'CREDIT' | 'DEBIT' });

  // --- Settings State ---
  const [shopifyConfig, setShopifyConfig] = useState({ domain: '', token: '' });

  const activeBatches = batches.filter(b => b.status !== BatchStatus.ARCHIVED);
  // Show all staff except Admin in payment lists
  const staffUsers = users.filter(u => u.role !== Role.ADMIN);
  const karigars = users.filter(u => u.role === Role.KARIGAR);
  
  // --- Helpers ---
  const getActiveAssignments = (userId: string) => {
    return batches.flatMap(b => 
      b.assignments
        .filter(a => a.karigarId === userId && [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.QC_REWORK].includes(a.status))
        .map(a => ({ ...a, batchStyle: b.styleName }))
    );
  };

  const handleShopifySync = () => {
    const randomQty = SIZE_OPTIONS.reduce((acc, size) => {
      if (Math.random() > 0.5) acc[size] = Math.floor(Math.random() * 50) + 10;
      else acc[size] = 0;
      return acc;
    }, {} as SizeQty);

    setNewBatchForm({
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

    // Upload physical file to Supabase Storage instead of base64
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

    // Update state with the permanent URL
    setNewBatchForm(prev => ({ ...prev, imageUrl: publicUrl }));
  };

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBatch(newBatchForm);
    setIsModalOpen(false);
    setNewBatchForm({
      styleName: '',
      sku: '',
      ratePerPiece: 0,
      imageUrl: '',
      plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
    });
  };

  // --- Batch Detail Logic ---
  const openBatchDetails = (batch: Batch) => {
    setSelectedBatch(batch);
    setViewBatchModalOpen(true);
  };

  const openAssignModal = () => {
    if (!selectedBatch) return;
    const initialQty: SizeQty = {};
    Object.keys(selectedBatch.availableQty).forEach(key => initialQty[key] = 0);
    setAssignForm({ karigarId: '', qty: initialQty });
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBatch && assignForm.karigarId) {
        onAssignToKarigar(selectedBatch.id, assignForm.karigarId, assignForm.qty);
        setAssignModalOpen(false);
        setViewBatchModalOpen(false); // Close details or keep open? keep open to see update but current flow closes
    }
  };

const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Securely create Auth record + Profile using the Edge Function
    const { error } = await supabase.functions.invoke('admin-create-user', {
      body: newUserForm
    });

    if (error) {
      alert("Error adding staff: " + error.message);
    } else {
      setIsUserModalOpen(false);
      setNewUserForm({ name: '', role: Role.KARIGAR, mobile: '', pin: '' });
      alert("Staff member created successfully!");
    }
  };

  const openPassbook = (userId: string) => {
    setPassbookModal({ open: true, userId });
    setPaymentForm({ amount: '', remark: '', type: 'DEBIT' });
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (passbookModal.userId && paymentForm.amount) {
      onPayKarigar(passbookModal.userId, Number(paymentForm.amount), paymentForm.remark, paymentForm.type);
      setPaymentForm({ amount: '', remark: '', type: 'DEBIT' }); // Clear form
    }
  };

  const viewUser = users.find(u => u.id === passbookModal.userId);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage production, staff, and finances</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} /> New Batch
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {['batches', 'staff', 'payments', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* --- BATCHES TAB --- */}
      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 gap-4">
          {activeBatches.map(batch => (
            <Card key={batch.id} className="flex flex-col md:flex-row md:items-center p-4 gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openBatchDetails(batch)}>
              <img src={batch.imageUrl} alt={batch.styleName} className="w-16 h-16 rounded-md object-cover bg-gray-100" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{batch.styleName}</h3>
                  <span className="text-xs text-gray-500 font-mono">{batch.sku}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color={
                    batch.status === BatchStatus.COMPLETED ? 'green' :
                    batch.status === BatchStatus.IN_PRODUCTION ? 'blue' : 'yellow'
                  }>{batch.status}</Badge>
                  <span className="text-sm text-gray-500">Rate: ₹{batch.ratePerPiece}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                    {Object.entries(batch.plannedQty).filter(([_, q]) => (q as number) > 0).map(([s, q]) => (
                        <span key={s} className="bg-gray-100 px-2 py-0.5 rounded border">{s}: {q as number}</span>
                    ))}
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => openBatchDetails(batch)}>
                    <Eye size={16} className="mr-1"/> Details
                </Button>
                {batch.status === BatchStatus.COMPLETED && (
                   <Button size="sm" variant="secondary" onClick={() => onArchiveBatch(batch.id)}>
                     <Archive size={16} className="mr-1" /> Archive
                   </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* --- STAFF TAB --- */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
             <div>
                <h3 className="font-bold text-gray-900">Staff Management</h3>
                <p className="text-sm text-gray-500">Create, remove, and monitor staff activity.</p>
             </div>
             <Button onClick={() => setIsUserModalOpen(true)}>
                <UserPlus size={16} className="mr-2" /> Add Staff
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffUsers.map(user => {
               const activeJobs = getActiveAssignments(user.id);
               return (
                <Card key={user.id} className="p-4 relative group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} className="w-12 h-12 rounded-full bg-gray-200" alt="" />
                      <div>
                        <h4 className="font-bold text-gray-900">{user.name}</h4>
                        <Badge color={user.role === Role.MANAGER ? 'purple' : user.role === Role.MASTER ? 'blue' : user.role === Role.QC ? 'green' : 'gray'}>
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    <button onClick={() => onDeleteUser(user.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-2">
                     <div className="flex items-center gap-2 text-xs text-yellow-800 mb-1">
                        <Phone size={12} />
                        <span className="font-medium">Login ID:</span>
                        <span>{user.mobile || 'N/A'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-yellow-800">
                        <Key size={12} />
                        <span className="font-medium">PIN:</span>
                        <span className="font-mono bg-yellow-100 px-1 rounded">{user.displayPin || '****'}</span>
                     </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Briefcase size={14} /> Active Tasks
                    </div>
                    {user.role === Role.KARIGAR ? (
                      activeJobs.length > 0 ? (
                        <div className="space-y-1">
                           {activeJobs.slice(0, 3).map(job => (
                             <div key={job.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex justify-between">
                                <span className="truncate max-w-[150px]">{job.batchStyle}</span>
                                <span className="font-semibold">{job.status}</span>
                             </div>
                           ))}
                           {activeJobs.length > 3 && <div className="text-xs text-center text-gray-400">+{activeJobs.length - 3} more</div>}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No active production jobs.</p>
                      )
                    ) : (
                      <p className="text-xs text-gray-400 italic">Tracking available for Karigars only.</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* --- PAYMENTS TAB --- */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staffUsers.map(user => {
            const isAdvance = user.walletBalance < 0;
            return (
              <Card key={user.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full bg-gray-200" />
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge color="gray">{user.role}</Badge>
                        <span className="text-xs text-gray-400">{user.mobile || user.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${isAdvance ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      {isAdvance ? 'Advance Taken' : 'Wallet Balance'}
                    </p>
                    <p className={`text-2xl font-bold ${isAdvance ? 'text-red-600' : 'text-gray-900'}`}>
                      {isAdvance ? '-' : ''}₹{Math.abs(user.walletBalance).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => openPassbook(user.id)} 
                  className="w-full"
                >
                  <BookOpen size={16} className="mr-2" /> View Passbook
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'settings' && (
        <Card className="p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
                <RefreshCw className="text-green-600" /> Shopify Integration Settings
            </h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Shopify Store Domain</label>
                    <input 
                        type="text" 
                        placeholder="your-store.myshopify.com"
                        className="mt-1 block w-full rounded-md border-gray-300 border p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={shopifyConfig.domain}
                        onChange={e => setShopifyConfig({...shopifyConfig, domain: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Access Token</label>
                    <input 
                        type="password" 
                        placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                        className="mt-1 block w-full rounded-md border-gray-300 border p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                        value={shopifyConfig.token}
                        onChange={e => setShopifyConfig({...shopifyConfig, token: e.target.value})}
                    />
                </div>
                <div className="pt-4 flex items-center gap-4">
                    <Button onClick={() => alert('Settings Saved! (Mock)')}>Save Connection</Button>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Settings size={12} /> This will allow product sync in "New Batch"
                    </span>
                </div>
            </div>
        </Card>
      )}

      {/* --- MODALS --- */}

      {/* 1. Batch Details & Stats Modal */}
      {selectedBatch && (
        <Modal 
          isOpen={viewBatchModalOpen} 
          onClose={() => setViewBatchModalOpen(false)} 
          title="Batch Production Details"
        >
          <div className="space-y-6">
            <div className="flex gap-4 items-center border-b pb-4">
               <img src={selectedBatch.imageUrl} className="w-20 h-20 rounded-md object-cover bg-gray-100" alt="" />
               <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedBatch.styleName}</h3>
                  <p className="text-sm text-gray-500">SKU: {selectedBatch.sku} • Rate: ₹{selectedBatch.ratePerPiece}</p>
                  <Badge className="mt-1" color={selectedBatch.status === BatchStatus.PENDING_MATERIAL ? 'yellow' : 'blue'}>{selectedBatch.status}</Badge>
               </div>
            </div>

            {/* A. Planned vs Cut Analysis */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><TrendingUp size={16}/> Cutting Analysis</h4>
               <div className="overflow-x-auto">
                 <table className="w-full text-xs text-center">
                    <thead>
                       <tr className="text-gray-500 border-b">
                         <th className="px-2 py-1 text-left">Size</th>
                         {Object.keys(selectedBatch.plannedQty).map(s => <th key={s} className="px-2 py-1 min-w-[40px]">{s.split(' - ')[0]}</th>)}
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                       <tr>
                         <td className="text-left font-medium py-2">Planned</td>
                         {Object.keys(selectedBatch.plannedQty).map(s => <td key={s} className="py-2 text-gray-600">{selectedBatch.plannedQty[s]}</td>)}
                       </tr>
                       <tr>
                         <td className="text-left font-medium py-2">Actual Cut</td>
                         {Object.keys(selectedBatch.plannedQty).map(s => {
                            const planned = selectedBatch.plannedQty[s] || 0;
                            const cut = selectedBatch.actualCutQty[s] || 0;
                            const diff = cut - planned;
                            const color = diff < 0 ? 'text-red-600' : diff > 0 ? 'text-green-600' : 'text-gray-900';
                            return <td key={s} className={`py-2 font-bold ${color}`}>{cut > 0 ? cut : '-'}</td>;
                         })}
                       </tr>
                    </tbody>
                 </table>
               </div>
            </div>

            {/* B. Pending Assignment Stock */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-blue-900 flex items-center gap-2"><Briefcase size={16}/> Unassigned Stock</h4>
                 {Object.values(selectedBatch.availableQty).some(v => (v as number) > 0) && (
                     <Button size="sm" onClick={openAssignModal}>Assign Stock</Button>
                 )}
               </div>
               {Object.keys(selectedBatch.availableQty).length === 0 ? (
                 <p className="text-sm text-blue-700 italic">No stock currently available for assignment.</p>
               ) : (
                 <div className="flex flex-wrap gap-2">
                   {Object.entries(selectedBatch.availableQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => (
                      <span key={k} className="bg-white px-2 py-1 rounded text-xs font-bold text-blue-800 border border-blue-200 shadow-sm">{k}: {v as number}</span>
                   ))}
                 </div>
               )}
            </div>

            {/* C. Active Assignments & QC Status */}
            <div>
               <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> Production & QC Status</h4>
               <div className="space-y-3 max-h-[30vh] overflow-y-auto">
                  {selectedBatch.assignments.length === 0 && <p className="text-sm text-gray-500 italic">No assignments made yet.</p>}
                  {selectedBatch.assignments.map(a => {
                    const totalPcs = Object.values(a.assignedQty).reduce((x: number, y: number) => x + y, 0);
                    return (
                      <div key={a.id} className="border rounded-lg p-3 text-sm hover:bg-gray-50">
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800">{a.karigarName}</span>
                            <Badge color={a.status === AssignmentStatus.QC_PASSED ? 'green' : a.status === AssignmentStatus.QC_REWORK ? 'red' : 'yellow'}>{a.status}</Badge>
                         </div>
                         <div className="text-xs text-gray-500 mb-2">
                            Assigned: {format(new Date(a.assignedAt), 'dd MMM')} • {totalPcs} pcs
                         </div>
                         <div className="flex flex-wrap gap-1">
                            {Object.entries(a.assignedQty).map(([k,v]) => (
                               <span key={k} className="bg-gray-100 px-1.5 rounded text-[10px]">{k.split(' - ')[0]}: {v as number}</span>
                            ))}
                         </div>
                         {a.qcNotes && <div className="mt-2 text-xs bg-red-50 text-red-700 p-1 rounded">QC Note: {a.qcNotes}</div>}
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </Modal>
      )}
      
      {/* 2. Assign Stock Modal (From Admin) */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign to Karigar">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <select required className="w-full border rounded p-2" value={assignForm.karigarId} onChange={e => setAssignForm({...assignForm, karigarId: e.target.value})}>
            <option value="">-- Select Karigar --</option>
            {karigars.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
          </select>
          <div className="bg-gray-50 p-3 rounded text-sm grid grid-cols-2 gap-2 text-xs">
            {selectedBatch && Object.entries(selectedBatch.availableQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => (<span key={k}>{k}: {v as number}</span>))}
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto">
            {selectedBatch && Object.keys(selectedBatch.availableQty).filter(k => selectedBatch.availableQty[k] > 0).map(size => {
              const max = selectedBatch.availableQty[size] || 0;
              return (
                <div key={size}>
                  <label className="block text-xs font-medium text-center truncate mb-1">{size} (Max: {max})</label>
                  <input type="number" min="0" max={max} className="w-full border rounded p-2 text-center" value={assignForm.qty[size] || ''} onChange={e => setAssignForm({...assignForm, qty: { ...assignForm.qty, [size]: Number(e.target.value) }})} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit">Assign Stock</Button>
          </div>
        </form>
      </Modal>

      {/* 3. Create Batch Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Production Batch">
        <form onSubmit={handleSubmitBatch} className="space-y-4">
          <div className="flex justify-end">
             <button type="button" onClick={handleShopifySync} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
               <RefreshCw size={14} /> Sync from Shopify
             </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Style Name</label>
            <input 
              required
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={newBatchForm.styleName}
              onChange={e => setNewBatchForm({...newBatchForm, styleName: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input 
                required
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                value={newBatchForm.sku}
                onChange={e => setNewBatchForm({...newBatchForm, sku: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rate (₹/pc)</label>
              <input 
                required
                type="number" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                value={newBatchForm.ratePerPiece}
                onChange={e => setNewBatchForm({...newBatchForm, ratePerPiece: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
               <div>
                  <input 
                    type="url" 
                    placeholder="Paste Image URL (https://...)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                    value={newBatchForm.imageUrl}
                    onChange={e => setNewBatchForm({...newBatchForm, imageUrl: e.target.value})}
                  />
               </div>
               <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-2 text-xs text-gray-500">OR UPLOAD FROM GALLERY</span>
                  </div>
                </div>
               <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Click to upload image</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
               </div>
               {newBatchForm.imageUrl && !newBatchForm.imageUrl.startsWith('http') && (
                   <p className="text-xs text-green-600 text-center">Image selected successfully!</p>
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
                    value={newBatchForm.plannedQty[size] || ''}
                    onChange={e => setNewBatchForm({
                      ...newBatchForm, 
                      plannedQty: { ...newBatchForm.plannedQty, [size]: Number(e.target.value) }
                    })}
                  />
                  <label className="text-xs text-gray-600 truncate">{size}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Batch</Button>
          </div>
        </form>
      </Modal>

      {/* 4. Add User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Add New Staff Member">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              required
              className="mt-1 w-full border rounded p-2"
              value={newUserForm.name}
              onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select 
              className="mt-1 w-full border rounded p-2"
              value={newUserForm.role}
              onChange={e => setNewUserForm({...newUserForm, role: e.target.value as Role})}
            >
              <option value={Role.MANAGER}>Manager</option>
              <option value={Role.MASTER}>Master</option>
              <option value={Role.QC}>QC Staff</option>
              <option value={Role.KARIGAR}>Karigar</option>
            </select>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Login Credentials</h4>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Mobile Number (Login ID)</label>
                    <input 
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    placeholder="9876543210"
                    className="mt-1 w-full border rounded p-2 text-sm"
                    value={newUserForm.mobile}
                    onChange={e => setNewUserForm({...newUserForm, mobile: e.target.value.replace(/\D/g,'').slice(0, 10)})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">6-Digit PIN</label>
                    <input 
                    required
                    type="text"
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    className="mt-1 w-full border rounded p-2 text-sm font-mono"
                    value={newUserForm.pin}
                    onChange={e => setNewUserForm({...newUserForm, pin: e.target.value.replace(/\D/g,'').slice(0, 6)})}
                    />
                </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">These credentials will be used by the staff member to log in.</p>
          </div>

          <div className="flex justify-end pt-4">
             <Button type="submit">Create User & Credentials</Button>
          </div>
        </form>
      </Modal>

      {/* 5. Passbook & Payment Modal */}
      <Modal 
        isOpen={passbookModal.open} 
        onClose={() => setPassbookModal({open: false, userId: null})} 
        title={`Passbook: ${viewUser?.name || ''}`}
      >
        <div className="space-y-6">
           {/* Ledger Table */}
           <div className="bg-white rounded border border-gray-200 overflow-hidden max-h-[40vh] overflow-y-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Remark</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewUser?.ledger.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">No transactions.</td></tr>
                  )}
                  {viewUser?.ledger.slice().reverse().map(entry => (
                     <tr key={entry.id}>
                        <td className="px-4 py-2 text-gray-500 text-xs">
                            {format(new Date(entry.date), 'dd MMM, HH:mm')}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                            {entry.description}
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.type === 'CREDIT' ? '+' : '-'} ₹{entry.amount.toLocaleString()}
                        </td>
                     </tr>
                  ))}
                </tbody>
             </table>
           </div>
           
           {/* Summary */}
           <div className="flex justify-end items-center gap-4 bg-gray-50 p-3 rounded">
              <span className="text-gray-500 font-medium">Current Balance:</span>
              <span className={`text-xl font-bold ${viewUser && viewUser.walletBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ₹{viewUser?.walletBalance || 0}
              </span>
           </div>

           {/* Make Transaction Form */}
           <form onSubmit={submitPayment} className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Add Transaction</h4>
              
              {/* Transaction Type Toggle */}
              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, type: 'DEBIT'})}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${paymentForm.type === 'DEBIT' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Debit (Advance/Pay)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, type: 'CREDIT'})}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${paymentForm.type === 'CREDIT' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Credit (Add Balance)
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                   <input 
                     type="number" required min="1"
                     className="w-full border rounded p-2"
                     placeholder="0"
                     value={paymentForm.amount}
                     onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Remark</label>
                   <input 
                     type="text" required
                     className="w-full border rounded p-2"
                     placeholder={paymentForm.type === 'DEBIT' ? "e.g. Weekly Payment" : "e.g. Opening Balance"}
                     value={paymentForm.remark}
                     onChange={e => setPaymentForm({...paymentForm, remark: e.target.value})}
                   />
                </div>
              </div>
              <Button type="submit" disabled={!paymentForm.amount || !paymentForm.remark} className={`w-full mt-4 ${paymentForm.type === 'CREDIT' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                Confirm {paymentForm.type === 'CREDIT' ? 'Credit' : 'Debit'}
              </Button>
           </form>
        </div>
      </Modal>

    </div>
  );
};
