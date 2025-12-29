/**
 * components/manager/QCTab.tsx
 * Purpose: Quality control inspection interface
 */

import React from 'react';
import { Button, Card } from '../Shared';

interface QCTabProps {
  pendingQCItems: any[];
  onOpenInspectModal: (item: any) => void;
}

export const QCTab: React.FC<QCTabProps> = ({
  pendingQCItems,
  onOpenInspectModal
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingQCItems.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-8">
            No bundles pending QC acceptance.
          </p>
        )}
        
        {pendingQCItems.map(item => (
          <Card key={item.id} className="flex gap-4 p-4 border-l-4 border-l-purple-500">
            <img 
              src={item.batch.imageUrl} 
              className="w-20 h-20 rounded object-cover" 
              alt="" 
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{item.batch.styleName}</h3>
              <p className="text-sm text-gray-600">Karigar: {item.karigarName}</p>
              <Button 
                size="sm" 
                onClick={() => onOpenInspectModal(item)} 
                className="mt-2 bg-purple-600 hover:bg-purple-700"
              >
                Accept & QC
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
