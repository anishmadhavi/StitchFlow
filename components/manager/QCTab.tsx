/**
 * components/manager/QCTab.tsx
 * Purpose: Quality control inspection interface
 */

import React from 'react';
import { Search, User, Package } from 'lucide-react';
import { Card } from '../Shared';

interface QCTabProps {
  pendingQCItems: any[];
  onOpenInspectModal: (item: any) => void;
}

export const QCTab: React.FC<QCTabProps> = ({ pendingQCItems, onOpenInspectModal }) => {
  
  if (pendingQCItems.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="text-purple-300 w-10 h-10" />
        </div>
        <p className="text-gray-400 font-medium">No items waiting for QC</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {pendingQCItems.map(item => (
        <Card key={item.id} className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
          {/* Large Image */}
          <div className="relative aspect-[4/5] w-full">
            <img 
              src={item.batch.imageUrl} 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="" 
            />
            {/* Karigar Badge Overlay */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-purple-100">
              <User size={14} className="text-purple-600" />
              <span className="text-xs font-black text-gray-800 uppercase tracking-wide">
                {item.karigarName}
              </span>
            </div>
          </div>

          {/* Info & Action */}
          <div className="p-5 space-y-4">
            <div>
               <h4 className="text-2xl font-black text-gray-900 leading-none">{item.batch.styleName}</h4>
               <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(item.assignedQty)
                    .filter(([_, v]) => (v as number) > 0)
                    .map(([size, qty]) => (
                      <span key={size} className="bg-purple-50 border border-purple-100 px-2 py-1 rounded-md text-xs font-bold text-purple-700">
                        {size}: {qty as number}
                      </span>
                    ))}
               </div>
            </div>
            
            <button 
              onClick={() => onOpenInspectModal(item)}
              className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-lg shadow-purple-200 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Search size={20} /> Inspect
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};
