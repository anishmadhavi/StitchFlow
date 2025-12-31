/**
 * components/admin/CreateUserModal.tsx
 * PURPOSE: Robust "Add Staff" Modal with manual validation and debugging logs.
 * FIXED: Uses standard HTML button and explicit onClick handler to bypass form issues.
 */

import React, { useState } from 'react';
import { Role } from '../../types';
import { Modal } from '../Shared';

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

  // ✅ MANUAL SUBMIT HANDLER (Bypasses browser form validation weirdness)
  const handleForceSubmit = () => {
    console.group("🟢 Debug: CreateUserModal Submit");
    console.log("1. Button Clicked. Current Data:", form);

    // 1. Manual Validation
    if (!form.name.trim()) {
      alert("⚠️ Name is required");
      console.groupEnd();
      return;
    }
    if (!form.mobile || form.mobile.length < 10) {
      alert("⚠️ Please enter a valid 10-digit Mobile Number");
      console.groupEnd();
      return;
    }
    if (!form.pin || form.pin.length < 6) {
      alert("⚠️ Please enter a valid 6-digit PIN");
      console.groupEnd();
      return;
    }

    // 2. Call Parent Function
    console.log("2. Validation Passed. Calling Parent onSubmit...");
    try {
      onSubmit(form.name, form.role, form.mobile, form.pin);
      console.log("3. Parent function called successfully.");
    } catch (err) {
      console.error("🔴 Error calling parent function:", err);
      alert("System Error: Could not send data. Check console.");
    }

    // 3. Reset and Close
    setForm({ name: '', role: Role.KARIGAR, mobile: '', pin: '' });
    onClose();
    console.groupEnd();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Staff Member">
      {/* We use a div instead of form to prevent accidental refreshing */}
      <div className="space-y-4">
        
        {/* NAME INPUT */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter full name"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>

        {/* ROLE SELECT */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            className="mt-1 w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
            value={form.role}
            onChange={e => setForm({...form, role: e.target.value as Role})}
          >
            <option value={Role.KARIGAR}>Karigar (Worker)</option>
            <option value={Role.MASTER}>Master (Cutting)</option>
            <option value={Role.QC}>QC (Quality Check)</option>
            <option value={Role.MANAGER}>Manager</option>
          </select>
        </div>

        {/* LOGIN CREDENTIALS SECTION */}
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Login Credentials</h4>
          <div className="grid grid-cols-2 gap-3">
            
            {/* MOBILE INPUT */}
            <div>
              <label className="block text-xs font-medium text-gray-700">Mobile (Login ID)</label>
              <input
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                className="mt-1 w-full border border-gray-300 rounded p-2 text-sm"
                value={form.mobile}
                // Only allow numbers
                onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g,'')})}
              />
            </div>

            {/* PIN INPUT */}
            <div>
              <label className="block text-xs font-medium text-gray-700">6-Digit PIN</label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                className="mt-1 w-full border border-gray-300 rounded p-2 text-sm font-mono tracking-widest"
                value={form.pin}
                // Only allow numbers
                onChange={e => setForm({...form, pin: e.target.value.replace(/\D/g,'')})}
              />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            ⚠️ These will be used for staff login.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          
          {/* ✅ THE FIX: Standard Button with explicit onClick */}
          <button 
            type="button" 
            onClick={handleForceSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            Create Staff Member
          </button>
        </div>

      </div>
    </Modal>
  );
};
