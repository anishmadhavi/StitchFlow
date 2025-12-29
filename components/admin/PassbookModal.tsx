/**
 * components/admin/PassbookModal.tsx
 * Purpose: View staff ledger and add transactions
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { Button, Modal } from '../Shared';
import { format } from 'date-fns';

interface PassbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  users: User[];
  onPayment: (userId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') => void;
}

export const PassbookModal: React.FC<PassbookModalProps> = ({
  isOpen,
  onClose,
  userId,
  users,
  onPayment
}) => {
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    remark: '',
    type: 'DEBIT' as 'CREDIT' | 'DEBIT'
  });

  const viewUser = userId ? users.find(u => u.id === userId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId && paymentForm.amount && paymentForm.remark) {
      onPayment(userId, Number(paymentForm.amount), paymentForm.remark, paymentForm.type);
      setPaymentForm({ amount: '', remark: '', type: 'DEBIT' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Passbook: ${viewUser?.name || ''}`}>
      <div className="space-y-6">
        {/* Ledger Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden max-h-[40vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b sticky top-0">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Remark</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!viewUser?.ledger || viewUser.ledger.length === 0) && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">
                    No transactions.
                  </td>
                </tr>
              )}
              {viewUser?.ledger?.slice().reverse().map(entry => (
                <tr key={entry.id}>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {format(new Date(entry.date), 'dd MMM, HH:mm')}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {entry.description}
                  </td>
                  <td className={`px-4 py-2 text-right font-bold ${
                    entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entry.type === 'CREDIT' ? '+' : '-'} ₹{entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary */}
        <div className="flex justify-end items-center gap-4 bg-gray-50 p-3 rounded">
          <span className="text-gray-500 font-medium">Current Balance:</span>
          <span className={`text-xl font-bold ${
            viewUser && viewUser.walletBalance < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            ₹{viewUser?.walletBalance || 0}
          </span>
        </div>

        {/* Make Transaction Form */}
        <form onSubmit={handleSubmit} className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Add Transaction</h4>
          
          {/* Transaction Type Toggle */}
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => setPaymentForm({...paymentForm, type: 'DEBIT'})}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                paymentForm.type === 'DEBIT' 
                  ? 'bg-white text-red-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Debit (Advance/Pay)
            </button>
            <button 
              type="button"
              onClick={() => setPaymentForm({...paymentForm, type: 'CREDIT'})}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                paymentForm.type === 'CREDIT' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Credit (Add Balance)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
              <input 
                type="number" 
                required 
                min="1"
                className="w-full border rounded p-2"
                placeholder="0"
                value={paymentForm.amount}
                onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Remark</label>
              <input 
                type="text" 
                required
                className="w-full border rounded p-2"
                placeholder={paymentForm.type === 'DEBIT' ? "e.g. Weekly Payment" : "e.g. Opening Balance"}
                value={paymentForm.remark}
                onChange={e => setPaymentForm({...paymentForm, remark: e.target.value})}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!paymentForm.amount || !paymentForm.remark} 
            className={`w-full mt-4 ${
              paymentForm.type === 'CREDIT' ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            Confirm {paymentForm.type === 'CREDIT' ? 'Credit' : 'Debit'}
          </Button>
        </form>
      </div>
    </Modal>
  );
};
