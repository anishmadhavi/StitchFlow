/**
 * components/admin/BatchDetailsModal.tsx
 * Purpose: Detailed batch production view with assignments
 * STATUS: UPDATED (New Analysis Chart + Simplified Status Table) ✅
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

  // Helper: Sort sizes logically (S, M, L... or 36, 38, 40...)
  const getSortedSizes = () => {
    // We use plannedQty keys as the source of truth for "Category Sizes"
    const sizes = Object.keys(batch.plannedQty || {});
    return sizes.sort((a, b) => {
      // Try to sort numbers numerically
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      // Fallback to string sort
      return a.localeCompare(b);
    });
  };

  const sortedSizes = getSortedSizes();

  // Helper: Map status to simplified UI text
  const getSimpleStatus = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.ASSIGNED:
      case AssignmentStatus.ACCEPTED:
      case AssignmentStatus.QC_REWORK:
        return { label: 'Stitch Pending', color: 'yellow' };
      case AssignmentStatus.STITCHED:
        return { label: 'QC Pending', color: 'blue' };
      case AssignmentStatus.QC_PASSED:
        return { label: 'QC Passed', color: 'green' };
      default:
        return { label: status, color: 'gray' };
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Batch Production Details">
      <div className="space-y-6">
        
        {/* 1. Header (Unchanged) */}
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

        {/* 2. Cutting Analysis (Updated Logic) */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp size={16}/> Cutting Analysis
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Metrics</th>
                  {sortedSizes.map(s => (
                    <th key={s} className="px-2 py-2 min-w-[40px] font-medium text-gray-700">
                      {s.split(' - ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Row 1: Planned */}
                <tr>
                  <td className="text-left font-bold text-gray-500 py-3">Planned</td>
                  {sortedSizes.map(s => (
                    <td key={s} className="py-2 text-gray-400">
                      {batch.plannedQty[s] || 0}
                    </td>
                  ))}
                </tr>

                {/* Row 2: Actual Cut */}
                <tr>
                  <td className="text-left font-bold text-gray-900 py-3">Actual Cut</td>
                  {sortedSizes.map(s => {
                    const cut = (batch.actualCutQty || {})[s] || 0;
                    return (
                      <td key={s} className="py-2 font-bold text-gray-900">
                        {cut}
                      </td>
                    );
                  })}
                </tr>

                {/* Row 3: In Production (Actual Cut - Unassigned) */}
                <tr className="bg-blue-50/50">
                  <td className="text-left font-bold text-blue-700 py-3">In Production</td>
                  {sortedSizes.map(s => {
                    const cut = (batch.actualCutQty || {})[s] || 0;
                    const available = (batch.availableQty || {})[s] || 0;
                    const inProduction = Math.max(0, cut - available); // Prevent negative numbers
                    
                    return (
                      <td key={s} className={`py-2 font-bold ${inProduction > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                        {inProduction}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Unassigned Stock (Unchanged) */}
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

        {/* 4. Production & QC Status (Updated: Table Layout) */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16}/> Production & QC Status
          </h4>
          
          <div className="border rounded-lg overflow-hidden border-gray-200">
            {(!batch.assignments || batch.assignments.length === 0) ? (
              <p className="text-sm text-gray-500 italic p-4 text-center">No assignments made yet.</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">Karigar</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Size & Qty</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batch.assignments.map(a => {
                    const uiStatus = getSimpleStatus(a.status);
                    
                    return (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        {/* Karigar Name & Date */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{a.karigarName}</div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(a.assignedAt), 'dd MMM')}
                          </div>
                        </td>

                        {/* Size Breakdown */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(a.assignedQty).map(([k,v]) => (
                              <span key={k} className="bg-gray-100 border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                {k.split(' - ')[0]}: {v as number}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Simplified Status */}
                        <td className="px-4 py-3 text-right">
                          <Badge color={uiStatus.color as any}>
                            {uiStatus.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
};
