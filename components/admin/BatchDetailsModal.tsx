/**
 * components/admin/BatchDetailsModal.tsx
 * Purpose: Detailed batch production view with assignments
 */

import React from 'react';
import { TrendingUp, Briefcase, CheckCircle2 } from 'lucide-react';
import { Batch, BatchStatus, AssignmentStatus } from '../../types';
import { Button, Badge, Modal } from '../Shared';
import { format } from 'date-fns';

interface BatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch;
  onOpenAssignModal: () => void;
}

export const BatchDetailsModal: React.FC<BatchDetailsModalProps> = ({
  isOpen,
  onClose,
  batch,
  onOpenAssignModal
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Batch Production Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-4 items-center border-b pb-4">
          <img 
            src={batch.imageUrl} 
            className="w-20 h-20 rounded-md object-cover bg-gray-100" 
            alt="" 
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{batch.styleName}</h3>
            <p className="text-sm text-gray-500">
              SKU: {batch.sku} • Rate: ₹{batch.ratePerPiece}
            </p>
            <Badge 
              className="mt-1" 
              color={batch.status === BatchStatus.PENDING_MATERIAL ? 'yellow' : 'blue'}
            >
              {batch.status}
            </Badge>
          </div>
        </div>

        {/* Cutting Analysis */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp size={16}/> Cutting Analysis
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center">
              <thead>
<tr className="text-gray-500 border-b">
  <th className="px-2 py-1 text-left">Size</th>
  {Object.keys(batch.plannedQty || {}).map(s => (
                    <th key={s} className="px-2 py-1 min-w-[40px]">
                      {s.split(' - ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
  <td className="text-left font-medium py-2">Planned</td>
  {Object.keys(batch.plannedQty || {}).map(s => (
                    <td key={s} className="py-2 text-gray-600">
                      {batch.plannedQty[s]}
                    </td>
                  ))}
                </tr>
                <tr>
  <td className="text-left font-medium py-2">Actual Cut</td>
  {Object.keys(batch.plannedQty || {}).map(s => {
    const planned = (batch.plannedQty || {})[s] || 0;
    const cut = (batch.actualCutQty || {})[s] || 0;
                    const diff = cut - planned;
                    const color = diff < 0 ? 'text-red-600' : 
                                  diff > 0 ? 'text-green-600' : 'text-gray-900';
                    return (
                      <td key={s} className={`py-2 font-bold ${color}`}>
                        {cut > 0 ? cut : '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Unassigned Stock */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <Briefcase size={16}/> Unassigned Stock
            </h4>
            {Object.values(batch.availableQty || {}).some(v => (v as number) > 0) && (
              <Button size="sm" onClick={onOpenAssignModal}>Assign Stock</Button>
            )}
          </div>
          {!batch.availableQty || Object.keys(batch.availableQty).length === 0 ? (
            <p className="text-sm text-blue-700 italic">
              No stock currently available for assignment.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(batch.availableQty)
                .filter(([_,v]) => (v as number) > 0)
                .map(([k,v]) => (
                  <span 
                    key={k} 
                    className="bg-white px-2 py-1 rounded text-xs font-bold text-blue-800 border border-blue-200 shadow-sm"
                  >
                    {k}: {v as number}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Production & QC Status */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16}/> Production & QC Status
          </h4>
          <div className="space-y-3 max-h-[30vh] overflow-y-auto">
            {(!batch.assignments || batch.assignments.length === 0) && (
  <p className="text-sm text-gray-500 italic">No assignments made yet.</p>
)}
{batch.assignments?.map(a => {
              const totalPcs = Object.values(a.assignedQty).reduce(
                (x: number, y: number) => x + y, 0
              );
              return (
                <div key={a.id} className="border rounded-lg p-3 text-sm hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-800">{a.karigarName}</span>
                    <Badge color={
                      a.status === AssignmentStatus.QC_PASSED ? 'green' : 
                      a.status === AssignmentStatus.QC_REWORK ? 'red' : 'yellow'
                    }>
                      {a.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Assigned: {format(new Date(a.assignedAt), 'dd MMM')} • {totalPcs} pcs
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(a.assignedQty).map(([k,v]) => (
                      <span key={k} className="bg-gray-100 px-1.5 rounded text-[10px]">
                        {k.split(' - ')[0]}: {v as number}
                      </span>
                    ))}
                  </div>
                  {a.qcNotes && (
                    <div className="mt-2 text-xs bg-red-50 text-red-700 p-1 rounded">
                      QC Note: {a.qcNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
