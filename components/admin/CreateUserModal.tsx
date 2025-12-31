/**
 * components/admin/CreateUserModal.tsx
 * Create new staff members - WITH VISIBLE PIN
 */

import React, { useState } from 'react';
import { Role } from '../../types';
import { Button, Modal } from '../Shared';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, role: Role, mobile: string, pin: string) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [form, setForm] = useState({
    name: '',
    role: Role.KARIGAR,
    mobile: '',
    pin: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form.name, form.role, form.mobile, form.pin);
    setForm({ name: '', role: Role.KARIGAR, mobile: '', pin: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Staff Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            required
            type="text"
            className="mt-1 w-full border rounded p-2"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            required
            className="mt-1 w-full border rounded p-2"
            value={form.role}
            onChange={e => setForm({...form, role: e.target.value as Role})}
          >
            <option value={Role.KARIGAR}>Karigar (Worker)</option>
            <option value={Role.MASTER}>Master (Cutting)</option>
            <option value={Role.QC}>QC (Quality Check)</option>
            <option value={Role.MANAGER}>Manager</option>
          </select>
        </div>

        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Login Credentials (Visible to Admin)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Mobile (Login ID)</label>
              <input
                required
                type="tel"
                pattern="[0-9]{10}"
                placeholder="9876543210"
                className="mt-1 w-full border rounded p-2 text-sm"
                value={form.mobile}
                onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g,'').slice(0, 10)})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">6-Digit PIN (Visible)</label>
              <input
                required
                type="text"
                pattern="[0-9]{6}"
                placeholder="123456"
                className="mt-1 w-full border rounded p-2 text-sm font-mono"
                value={form.pin}
                onChange={e => setForm({...form, pin: e.target.value.replace(/\D/g,'').slice(0, 6)})}
              />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">⚠️ PIN is visible to you. Staff can log in with mobile + PIN.</p>
        </div>

        <div className="flex justify-end pt-4">
          {/* Replace custom Button with standard HTML button to force submit */}
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Staff Member
          </button>
        </div>
      </form>
    </Modal>
  );
};
