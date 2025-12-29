/**
 * components/ManagerDashboard.tsx
 * Purpose: Manager Interface.
 * Description: A unified dashboard for the MANAGER role that combines limited Admin features (Batch Creation) and Master/QC capabilities.
 * Compatibility: Client-side React.
 */

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Scissors, UserPlus, ClipboardCheck, LayoutGrid, RefreshCw, AlertTriangle, ArrowRight, Upload } from 'lucide-react';
import { Batch, BatchStatus, Role, User, SizeQty, AssignmentStatus } from '../types';
import { SIZE_OPTIONS } from '../constants';
import { Button, Card, Badge, Modal } from './Shared';

interface ManagerDashboardProps {
  batches: Batch[];
  users: User[];
  onCreateBatch: (batch: Partial<Batch>) => void;
  onFinalizeCut: (batchId: string, actualQty: SizeQty) => void;
  onAssignToKarigar: (batchId: string, karigarId: string, qty: SizeQty) => void;
  onSubmitQC: (batchId: string, assignmentId: string, passedQty: SizeQty) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  batches,
  users,
  onCreateBatch,
  onFinalizeCut,
  onAssignToKarigar,
  onSubmitQC
}) => {
  const [activeTab, setActiveTab] = useState<'production' | 'allocation' | 'qc'>('production');

  // --- States for Production (New Batch) ---
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({
    styleName: '',
    sku: '',
    ratePerPiece: 0,
    imageUrl: '',
    plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
  });

  // --- States for Allocation (Master) ---
  const [cutModal, setCutModal] = useState<{ open: boolean; batchId: string | null }>({ open: false, batchId: null });
  const [assignModal, setAssignModal] = useState<{ open: boolean; batchId: string | null }>({ open: false, batchId: null });
  const [cutForm, setCutForm] = useState<SizeQty>({});
  const [assignForm, setAssignForm] = useState<{ karigarId: string; qty: SizeQty }>({ karigarId: '', qty: {} });

  // --- States for QC ---
  const [inspectModal, setInspectModal] = useState<{ open: boolean; batchId: string | null; assignmentId: string | null }>({
    open: false, batchId: null, assignmentId: null
  });
  const [qcForm, setQcForm] = useState<SizeQty>({});
  const [currentInspectItem, setCurrentInspectItem] = useState<any>(null);

  // --- Helpers ---
  const karigars = users.filter(u => u.role === Role.KARIGAR);
  const activeBatches = batches.filter(b => b.status !== BatchStatus.ARCHIVED);
  const pendingCuttingBatches = batches.filter(b => b.status === BatchStatus.PENDING_MATERIAL);
  const assignableBatches = batches.filter(b => b.status === BatchStatus.CUTTING_DONE || b.status === BatchStatus.IN_PRODUCTION);
  const pendingQCItems = batches.flatMap(b => 
    b.assignments
      .filter(a => a.status === AssignmentStatus.STITCHED)
      .map(a => ({ ...a, batch: b }))
  );

  // --- Handlers: Production ---
  const handleShopifySync = () => {
    const randomQty = SIZE_OPTIONS.reduce((acc, size) => {
      if (Math.random() > 0.5) acc[size] = Math.floor(Math.random() * 50) + 10;
      else acc[size] = 0;
      return acc;
    }, {} as SizeQty);

    setNewBatchForm({
      styleName: 'Manager Special Design',
      sku: `MGR-${Math.floor(Math.random() * 1000)}`,
      ratePerPiece: 160,
      imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 200}/400/600`,
      plannedQty: randomQty
    });
  };

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // 1. Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `design-images/${fileName}`;

    // 2. Upload to the 'designs' bucket
    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 3. Get the Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(filePath);

    // 4. Update the form state with the real URL
    setNewBatchForm(prev => ({ ...prev, imageUrl: publicUrl }));
    alert("Image uploaded successfully!");

  } catch (error: any) {
    alert("Error uploading image: " + error.message);
  }
};

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBatch(newBatchForm);
    setIsBatchModalOpen(false);
    setNewBatchForm({
      styleName: '',
      sku: '',
      ratePerPiece: 0,
      imageUrl: '',
      plannedQty: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {} as SizeQty)
    });
  };

  // --- Handlers: Allocation ---
  const openCutModal = (batch: Batch) => {
    setCutForm(batch.plannedQty);
    setCutModal({ open: true, batchId: batch.id });
  };

  const handleCutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cutModal.batchId) onFinalizeCut(cutModal.batchId, cutForm);
    setCutModal({ open: false, batchId: null });
  };

  const openAssignModal = (batch: Batch) => {
    const initialQty: SizeQty = {};
    Object.keys(batch.availableQty).forEach(key => initialQty[key] = 0);
    setAssignForm({ karigarId: '', qty: initialQty });
    setAssignModal({ open: true, batchId: batch.id });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignModal.batchId && assignForm.karigarId) {
      onAssignToKarigar(assignModal.batchId, assignForm.karigarId, assignForm.qty);
    }
    setAssignModal({ open: false, batchId: null });
  };

  const selectedBatchForAssign = batches.find(b => b.id === assignModal.batchId);

  // --- Handlers: QC ---
  const openInspectModal = (item: any) => {
    setQcForm(item.assignedQty);
    setCurrentInspectItem(item);
    setInspectModal({ open: true, batchId: item.batch.id, assignmentId: item.id });
  };

  const handleQCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inspectModal.batchId && inspectModal.assignmentId) {
      onSubmitQC(inspectModal.batchId, inspectModal.assignmentId, qcForm);
    }
    setInspectModal({ open: false, batchId: null, assignmentId: null });
  };

  const handleQCQtyChange = (size: string, val: number) => {
    setQcForm(prev => ({ ...prev, [size]: val }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500">Oversee production, allocation, and quality control.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('production')}
            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'production' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <LayoutGrid size={16} /> Production Batches
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'allocation' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Scissors size={16} /> Floor Allocation
          </button>
          <button
            onClick={() => setActiveTab('qc')}
            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'qc' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <ClipboardCheck size={16} /> Quality Control
            {pendingQCItems.length > 0 && <span className="bg-purple-100 text-purple-600 py-0.5 px-2 rounded-full text-xs">{pendingQCItems.length}</span>}
          </button>
        </nav>
      </div>

      {/* --- PRODUCTION TAB --- */}
      {activeTab === 'production' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsBatchModalOpen(true)} className="flex items-center gap-2">
              <Plus size={18} /> New Batch
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {activeBatches.length === 0 && <p className="text-gray-500 text-center py-4">No active batches.</p>}
            {activeBatches.map(batch => (
              <Card key={batch.id} className="flex flex-col md:flex-row md:items-center p-4 gap-4">
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
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- ALLOCATION TAB --- */}
      {activeTab === 'allocation' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Scissors size={18} /> Pending Cutting</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingCuttingBatches.length === 0 && <p className="text-sm text-gray-500">No batches waiting for cutting.</p>}
              {pendingCuttingBatches.map(batch => (
                <Card key={batch.id} className="p-4 border-l-4 border-l-indigo-500">
                  <div className="flex gap-4">
                    <img src={batch.imageUrl} className="w-16 h-16 rounded object-cover" alt="" />
                    <div className="flex-1">
                      <h4 className="font-medium">{batch.styleName}</h4>
                      <Button size="sm" className="mt-2" onClick={() => openCutModal(batch)}>Finalize Cut</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><UserPlus size={18} /> Allocate to Karigar</h3>
            <div className="grid grid-cols-1 gap-4">
              {assignableBatches.length === 0 && <p className="text-sm text-gray-500">No stock available for assignment.</p>}
              {assignableBatches.map(batch => {
                 const totalAvailable = (Object.values(batch.availableQty) as number[]).reduce((a,b) => a + b, 0);
                 if (totalAvailable <= 0) return null;
                 return (
                  <Card key={batch.id} className="p-4 flex flex-col md:flex-row items-center gap-4">
                    <img src={batch.imageUrl} className="w-12 h-12 rounded object-cover" alt="" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{batch.styleName}</h4>
                      <div className="text-xs text-gray-500 mt-1">Available: {totalAvailable} pcs</div>
                    </div>
                    <Button size="sm" onClick={() => openAssignModal(batch)}>Assign</Button>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* --- QC TAB --- */}
      {activeTab === 'qc' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingQCItems.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No bundles pending QC acceptance.</p>}
            {pendingQCItems.map(item => (
              <Card key={item.id} className="flex gap-4 p-4 border-l-4 border-l-purple-500">
                <img src={item.batch.imageUrl} className="w-20 h-20 rounded object-cover" alt="" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.batch.styleName}</h3>
                  <p className="text-sm text-gray-600">Karigar: {item.karigarName}</p>
                  <Button size="sm" onClick={() => openInspectModal(item)} className="mt-2 bg-purple-600 hover:bg-purple-700">
                    Accept & QC
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Create Batch Modal */}
      <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="Create New Production Batch">
        <form onSubmit={handleSubmitBatch} className="space-y-4">
          <div className="flex justify-end">
             <button type="button" onClick={handleShopifySync} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
               <RefreshCw size={14} /> Sync from Shopify
             </button>
          </div>
          <input required placeholder="Style Name" className="w-full border rounded p-2" value={newBatchForm.styleName} onChange={e => setNewBatchForm({...newBatchForm, styleName: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="SKU" className="w-full border rounded p-2" value={newBatchForm.sku} onChange={e => setNewBatchForm({...newBatchForm, sku: e.target.value})} />
            <input required type="number" placeholder="Rate" className="w-full border rounded p-2" value={newBatchForm.ratePerPiece} onChange={e => setNewBatchForm({...newBatchForm, ratePerPiece: Number(e.target.value)})} />
          </div>

          {/* Image Upload Section */}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Planned Quantity</label>
            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-1">
              {SIZE_OPTIONS.map(size => (
                <div key={size} className="flex items-center space-x-2">
                  <input type="number" min="0" className="w-16 text-center border rounded p-1" value={newBatchForm.plannedQty[size] || ''} onChange={e => setNewBatchForm({...newBatchForm, plannedQty: { ...newBatchForm.plannedQty, [size]: Number(e.target.value) }})} />
                  <label className="text-xs text-gray-600 truncate">{size}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsBatchModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Batch</Button>
          </div>
        </form>
      </Modal>

      {/* Cut Modal */}
      <Modal isOpen={cutModal.open} onClose={() => setCutModal({open: false, batchId: null})} title="Finalize Cutting">
        <form onSubmit={handleCutSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {SIZE_OPTIONS.map(size => (
              <div key={size}>
                <label className="block text-xs font-medium text-gray-700 truncate mb-1">{size}</label>
                <input type="number" min="0" className="w-full border rounded p-2 text-center" value={cutForm[size] || ''} onChange={e => setCutForm({...cutForm, [size]: Number(e.target.value)})} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setCutModal({open: false, batchId: null})}>Cancel</Button>
            <Button type="submit">Confirm Cutting</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={assignModal.open} onClose={() => setAssignModal({open: false, batchId: null})} title="Assign to Karigar">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <select required className="w-full border rounded p-2" value={assignForm.karigarId} onChange={e => setAssignForm({...assignForm, karigarId: e.target.value})}>
            <option value="">-- Select Karigar --</option>
            {karigars.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
          </select>
          <div className="bg-gray-50 p-3 rounded text-sm grid grid-cols-2 gap-2 text-xs">
            {selectedBatchForAssign && Object.entries(selectedBatchForAssign.availableQty).filter(([_,v]) => (v as number) > 0).map(([k,v]) => (<span key={k}>{k}: {v as number}</span>))}
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto">
            {selectedBatchForAssign && Object.keys(selectedBatchForAssign.availableQty).filter(k => selectedBatchForAssign.availableQty[k] > 0).map(size => {
              const max = selectedBatchForAssign.availableQty[size] || 0;
              return (
                <div key={size}>
                  <label className="block text-xs font-medium text-center truncate mb-1">{size} (Max: {max})</label>
                  <input type="number" min="0" max={max} className="w-full border rounded p-2 text-center" value={assignForm.qty[size] || ''} onChange={e => setAssignForm({...assignForm, qty: { ...assignForm.qty, [size]: Number(e.target.value) }})} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setAssignModal({open: false, batchId: null})}>Cancel</Button>
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </Modal>

      {/* QC Modal */}
      <Modal isOpen={inspectModal.open} onClose={() => setInspectModal({open: false, batchId: null, assignmentId: null})} title="QC Inspection">
        <form onSubmit={handleQCSubmit} className="space-y-6">
          <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-900 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>Enter <strong>PASSED</strong> quantity. Remainder is marked as REWORK.</p>
          </div>
          <div className="max-h-[50vh] overflow-y-auto pr-1 grid grid-cols-1 gap-4">
            {currentInspectItem && Object.keys(currentInspectItem.assignedQty).map(size => {
              const max = currentInspectItem.assignedQty[size] || 0;
              if (max === 0) return null;
              const passed = qcForm[size] !== undefined ? qcForm[size] : max;
              const rework = max - passed;
              return (
                <div key={size} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">{size}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Total: {max}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-green-700 mb-1">Passed</label>
                      <input type="number" min="0" max={max} required className="w-full border-green-300 ring-green-200 focus:ring-green-500 rounded-md border p-2 text-center" value={passed} onChange={e => { const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), max); handleQCQtyChange(size, val); }} />
                    </div>
                    <ArrowRight size={16} className="text-gray-400 mt-5" />
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-red-700 mb-1">Rework</label>
                      <div className={`w-full p-2 text-center rounded-md border ${rework > 0 ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>{rework}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Confirm Result</Button>
        </form>
      </Modal>
    </div>
  );
};
