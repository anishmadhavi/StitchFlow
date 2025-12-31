/**
 * services/userService.ts
 * Purpose: User management operations - Add/update/delete users, Handle transactions (credit/debit)
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
    if (updates.displayPin) dbUpdates.display_pin = updates.displayPin;
    if (updates.pin) dbUpdates.pin = updates.pin;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      console.error("Update failed:", error);
      alert("Update failed: " + error.message);
    }
  },

  async deleteUser(userId: string, currentUserId: string) {
    console.log('DELETE: deleteUser called');
    console.log('DELETE: userId to delete:', userId);
    
    if (userId === currentUserId) {
      alert("Cannot delete yourself!");
      return;
    }
    
    // Step 1: Delete from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select();
    
    console.log('DELETE: Profile delete result:', { data, error });
    
    if (error) {
      console.error('ERROR: Delete error:', error);
      alert("Delete failed: " + error.message);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('WARNING: No profile deleted');
      alert("Delete failed: Permission denied");
      throw new Error("No rows deleted");
    }
    
    // Step 2: Delete from auth using Edge Function
    try {
      console.log('DELETE: Calling delete-auth-user function...');
      const { error: authError } = await supabase.functions.invoke('delete-auth-user', {
        body: { userId }
      });
      
      if (authError) {
        console.warn('WARNING: Auth delete failed:', authError);
      } else {
        console.log('SUCCESS: Auth user deleted');
      }
    } catch (err) {
      console.warn('WARNING: Auth delete error:', err);
    }
    
    console.log('SUCCESS: User fully deleted');
    return data;
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

    if (ledgerError || walletError) {
      console.error('Transaction error:', { ledgerError, walletError });
      alert("Transaction failed");
    }
  },
};
