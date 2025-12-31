/**
 * components/admin/BatchesTab.tsx
 * Purpose: Batch listing and management for Admin
 */

import React from 'react';
import { Eye, Archive } from 'lucide-react';
import { Batch, BatchStatus } from '../../types';
import { Button, Card, Badge } from '../Shared';

interface BatchesTabProps {
  batches: Batch[];
  onOpenDetails: (batch: Batch) => void;
  onArchiveBatch: (batchId: string) => void;
}

export const BatchesTab: React.FC<BatchesTabProps> = ({
  batches,
  onOpenDetails,
  onArchiveBatch
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
{batches.length === 0 ? (
  <p className="text-gray-500 text-center py-8">No batches yet. Create your first batch!</p>
) : batches.map(batch => (
  <Card key={batch.id} ...>
          <img 
            src={batch.imageUrl} 
            alt={batch.styleName} 
            className="w-16 h-16 rounded-md object-cover bg-gray-100" 
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{batch.styleName}</h3>
              <span className="text-xs text-gray-500 font-mono">{batch.sku}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge color={
                batch.status === BatchStatus.COMPLETED ? 'green' :
                batch.status === BatchStatus.IN_PRODUCTION ? 'blue' : 'yellow'
              }>
                {batch.status}
              </Badge>
              <span className="text-sm text-gray-500">Rate: ₹{batch.ratePerPiece}</span>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
              {Object.entries(batch.plannedQty)
                .filter(([_, q]) => (q as number) > 0)
                .map(([s, q]) => (
                  <span key={s} className="bg-gray-100 px-2 py-0.5 rounded border">
                    {s}: {q as number}
                  </span>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="ghost" onClick={() => onOpenDetails(batch)}>
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
  );
};
