/**
 * components/admin/StaffTab.tsx
 * Purpose: Staff management interface for Admin
 */

import React from 'react';
import { UserPlus, Trash2, Phone, Key, Briefcase } from 'lucide-react';
import { User, Role, Assignment } from '../../types';
import { Button, Card, Badge } from '../Shared';

interface StaffTabProps {
  staffUsers: User[];
  getActiveAssignments: (userId: string) => Assignment[];
  onAddStaff: () => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser?: (userId: string, updates: Partial<User>) => void;
}

export const StaffTab: React.FC<StaffTabProps> = ({
  staffUsers,
  getActiveAssignments,
  onAddStaff,
  onDeleteUser,
  onUpdateUser
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="font-bold text-gray-900">Staff Management</h3>
          <p className="text-sm text-gray-500">Create, remove, and monitor staff activity.</p>
        </div>
        <Button onClick={onAddStaff}>
          <UserPlus size={16} className="mr-2" /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffUsers.map(user => {
          const activeJobs = getActiveAssignments(user.id);
          return (
            <Card key={user.id} className="p-4 relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} 
                    className="w-12 h-12 rounded-full bg-gray-200" 
                    alt="" 
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{user.name}</h4>
                    <Badge color={
                      user.role === Role.MANAGER ? 'purple' : 
                      user.role === Role.MASTER ? 'blue' : 
                      user.role === Role.QC ? 'green' : 'gray'
                    }>
                      {user.role}
                    </Badge>
                  </div>
                </div>
<button 
  onClick={async (e) => {
    e.stopPropagation();
    console.log('🗑️ Delete clicked for:', user.name, user.id);
    if (window.confirm(`Delete ${user.name}?`)) {
      console.log('✅ Confirmed, calling onDeleteUser');
      try {
        await onDeleteUser(user.id);
        console.log('✅ Delete completed');
        alert('Staff deleted successfully!');
        window.location.reload();
      } catch (error) {
        console.error('❌ Delete failed:', error);
        alert('Error deleting staff: ' + error);
      }
    }
  }} 
  className="text-gray-400 hover:text-red-600 transition-colors p-1"
>
  <Trash2 size={16} />
</button>
              </div>

              {/* Login Credentials - PASSWORD VISIBLE */}
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="flex items-center gap-2 text-xs text-yellow-800 mb-1">
                  <Phone size={12} />
                  <span className="font-medium">Login ID:</span>
                  <span>{user.mobile || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-yellow-800">
                  <Key size={12} />
                  <span className="font-medium">PIN:</span>
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    id={`pin-${user.id}`}
                    className="font-mono bg-yellow-100 px-2 py-1 rounded border border-yellow-300 focus:border-yellow-500 focus:outline-none w-20 text-center"
                    defaultValue={user.displayPin || user.pin || ''}
                    placeholder="123456"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`pin-${user.id}`) as HTMLInputElement;
                      const newPin = input?.value;
                      if (newPin && newPin.length === 6 && onUpdateUser) {
                        if (window.confirm(`Update PIN for ${user.name} to ${newPin}?`)) {
                          onUpdateUser(user.id, { displayPin: newPin, pin: newPin });
                          alert('PIN updated successfully!');
                        }
                      } else {
                        alert('Please enter a valid 6-digit PIN');
                      }
                    }}
                    className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded border border-yellow-400"
                  >
                    Save
                  </button>
                </div>
              </div>
              
              {/* Active Tasks */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Briefcase size={14} /> Active Tasks
                </div>
                {user.role === Role.KARIGAR ? (
                  activeJobs.length > 0 ? (
                    <div className="space-y-1">
                      {activeJobs.slice(0, 3).map(job => (
                        <div 
                          key={job.id} 
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex justify-between"
                        >
                          <span className="truncate max-w-[150px]">{job.batchStyle}</span>
                          <span className="font-semibold">{job.status}</span>
                        </div>
                      ))}
                      {activeJobs.length > 3 && (
                        <div className="text-xs text-center text-gray-400">
                          +{activeJobs.length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No active production jobs.</p>
                  )
                ) : (
                  <p className="text-xs text-gray-400 italic">Tracking available for Karigars only.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
