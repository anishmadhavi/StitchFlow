/**
 * components/manager/ProductionTab.tsx
 * Purpose: Production batches overview for Manager
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { Batch, BatchStatus } from '../../types';
import { Button, Card, Badge } from '../Shared';

interface ProductionTabProps {
  batches: Batch[];
  onCreateBatch: () => void;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({
  batches,
  onCreateBatch
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreateBatch} className="flex items-center gap-2">
          <Plus size={18} /> New Batch
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {batches.length === 0 && (
          <p className="text-gray-500 text-center py-4">No active batches.</p>
        )}
        
        {batches.map(batch => (
          <Card key={batch.id} className="flex flex-col md:flex-row md:items-center p-4 gap-4">
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
