/**
 * components/manager/ProductionTab.tsx
 * Purpose: Production batches overview for Manager
 */

import React from 'react';
import { Plus, Trash2, Calendar, Layers } from 'lucide-react';
import { Batch, BatchStatus } from '../../types';
import { Card, Badge } from '../Shared';
import { format } from 'date-fns';

interface ProductionTabProps {
  batches: Batch[];
  onCreateBatch: () => void;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({ batches, onCreateBatch }) => {
  return (
    <div className="space-y-6 pb-20">
      {/* Big Create Button */}
      <button 
        onClick={onCreateBatch}
        className="w-full bg-gray-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <div className="bg-gray-800 p-2 rounded-full">
          <Plus className="text-white" size={24} />
        </div>
        <div className="text-left">
          <h3 className="font-black text-lg uppercase tracking-wider">Create New Batch</h3>
          <p className="text-gray-400 text-xs">Start a new production run</p>
        </div>
      </button>

      {/* Vertical Cards */}
      <div className="space-y-6">
        {batches.map(batch => (
          <Card key={batch.id} className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
            {/* Image Header */}
            <div className="relative aspect-[4/5] w-full bg-gray-100">
              <img 
                src={batch.imageUrl} 
                className="absolute inset-0 w-full h-full object-cover" 
                alt={batch.styleName} 
              />
              <div className="absolute top-4 left-4">
                <Badge color={batch.status === BatchStatus.COMPLETED ? 'green' : 'blue'} className="shadow-lg">
                  {batch.status}
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-sm">
                 <h4 className="text-xl font-black text-gray-900 leading-none">{batch.styleName}</h4>
                 <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wide">{batch.category}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Layers size={14} />
                    <span className="text-[10px] font-black uppercase">Planned Qty</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">
                    {Object.values(batch.plannedQty).reduce((a, b) => (a as number) + (b as number), 0)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase">Created</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {format(new Date(batch.createdAt), 'dd MMM')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {/* Note: You can add an 'Edit' button here later if needed */}
              <div className="pt-2">
                 <button className="w-full py-4 rounded-xl border-2 border-red-100 text-red-500 font-bold uppercase text-xs hover:bg-red-50 hover:border-red-500 transition-colors flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Delete Batch
                 </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
