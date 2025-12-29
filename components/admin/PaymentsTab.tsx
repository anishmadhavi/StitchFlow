/**
 * components/admin/PaymentsTab.tsx
 * Purpose: Staff payments and wallet management
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import { User } from '../../types';
import { Button, Card, Badge } from '../Shared';

interface PaymentsTabProps {
  staffUsers: User[];
  onOpenPassbook: (userId: string) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  staffUsers,
  onOpenPassbook
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {staffUsers.map(user => {
        const isAdvance = (user.walletBalance || 0) < 0;
        return (
          <Card key={user.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} 
                  alt="" 
                  className="w-12 h-12 rounded-full bg-gray-200" 
                />
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
                  {isAdvance ? '-' : ''}₹{Math.abs(user.walletBalance || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => onOpenPassbook(user.id)} 
              className="w-full"
            >
              <BookOpen size={16} className="mr-2" /> View Passbook
            </Button>
          </Card>
        );
      })}
    </div>
  );
};
