/**
 * services/userService.ts
 * Purpose: User management operations , - Add/update/delete users, Handle transactions (credit/debit), **Exports:** `userService` object
 */

import { supabase } from '../src/supabaseClient';
import { Role, User } from '../types';

export const userService = {
  async addUser(name: string, role: Role, mobile: string, pin: string) {
    console.log("Invoking Add-User for:", name);

    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { name, role, mobile, pin }
    });

    if (error) {
      console.error("Connection Error:", error);
      alert("Network error: " + error.message);
      return;
    }

    if (data?.error) {
      console.error("Database Error from Function:", data.error);
      alert("Database Error: " + data.error);
      return;
    }

    console.log("Success:", data);
    alert("Staff member created successfully!");
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) alert("Update failed: " + error.message);
  },

  async deleteUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      alert("Cannot delete yourself!");
      return;
    }
    
    console.log('🗑️ Attempting to delete user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select();
    
    console.log('🗑️ Delete result:', { data, error });
    
    if (error) {
      console.error('❌ Delete error:', error);
      alert("Delete failed: " + error.message);
      throw error;
    }
    
    if (!data || data.length === 0) {
      alert("Delete failed: User not found or permission denied");
      throw new Error("Delete failed");
    }
    
    console.log('✅ User deleted successfully');
  },

  async handleTransaction(userId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') {
    const signedAmount = type === 'CREDIT' ? amount : -amount;

    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert([{
        user_id: userId,
        description: remark || (type === 'CREDIT' ? 'Manual Credit' : 'Manual Debit'),
        amount: amount,
        type: type
      }]);

    const { error: walletError } = await supabase.rpc('increment_wallet', { 
      user_id: userId, 
      amount: signedAmount 
    });

    if (ledgerError || walletError) alert("Transaction failed");
  },
};
