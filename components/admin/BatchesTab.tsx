/**
 * components/admin/BatchesTab.tsx
 * Purpose: Batch listing and management for Admin
 */

import React from 'react';
import { Eye, Archive, Trash2 } from 'lucide-react'; // Import Trash2
import { Batch, BatchStatus } from '../../types';
import { Badge, Button } from '../Shared';

interface BatchesTabProps {
  batches: Batch[];
  onOpenDetails: (batch: Batch) => void;
  onArchiveBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void; // 👈 New Prop
}

export const BatchesTab: React.FC<BatchesTabProps> = ({
  batches,
  onOpenDetails,
  onArchiveBatch,
  onDeleteBatch
}) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Info</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {batches.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                No active batches found.
              </td>
            </tr>
          )}
          {batches.map((batch) => (
            <tr key={batch.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <img className="h-10 w-10 rounded-full object-cover" src={batch.imageUrl} alt="" />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{batch.styleName}</div>
                    <div className="text-sm text-gray-500">{batch.sku}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge color={batch.status === BatchStatus.COMPLETED ? 'green' : 'blue'}>
                  {batch.status}
                </Badge>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                ₹{batch.ratePerPiece}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                <button 
                  onClick={() => onOpenDetails(batch)}
                  className="text-blue-600 hover:text-blue-900" title="View Details"
                >
                  <Eye size={18} />
                </button>
                
                <button 
                  onClick={() => onArchiveBatch(batch.id)}
                  className="text-yellow-600 hover:text-yellow-900" title="Archive"
                >
                  <Archive size={18} />
                </button>

                {/* 🗑️ DELETE BUTTON */}
                <button 
                  onClick={() => onDeleteBatch(batch.id)}
                  className="text-red-600 hover:text-red-900 ml-2" title="Delete Permanently"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
