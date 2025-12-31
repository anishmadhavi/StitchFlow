/**
 * services/userService.ts
 * Purpose: User management operations - Add/update/delete users, Handle transactions (credit/debit)
 * DEBUG MODE: ENABLED 🔍
 */

import { supabase } from '../src/supabaseClient';
import { Role, User } from '../types';

export const userService = {
  // ------------------------------------------------------------------
  // 1. ADD USER (The problematic function)
  // ------------------------------------------------------------------
  async addUser(name: string, role: Role, mobile: string, pin: string) {
    console.log("🚀 Add-User Triggered");
    
    try {
      // 1. Invoke the Edge Function
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { name, role, mobile, pin }
      });

      // 2. Handle Network Errors
      if (error) {
        console.error("❌ Connection Error:", error);
        alert("Network error: " + error.message);
        return;
      }

      // 3. Handle Logic Errors
      if (data?.error) {
        console.error("❌ Database Error:", data.error);
        alert("Error: " + data.error);
        return;
      }

      // 4. SUCCESS -> RELOAD
      console.log("✅ Success:", data);
      alert("Staff member created successfully!");
      window.location.reload(); // <--- RELOADS ONLY AFTER SUCCESS

    } catch (err: any) {
      console.error("💥 System Error:", err);
      alert("System Error: " + err.message);
    }
  },

  // ------------------------------------------------------------------
  // 2. UPDATE USER
  // ------------------------------------------------------------------
  async updateUser(userId: string, updates: Partial<User>) {
    console.group(`✏️ Debug: updateUser (${userId})`);
    console.log("Update Data:", updates);

    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    // Added PIN support just in case the UI sends it
    if (updates.displayPin) dbUpdates.display_pin = updates.displayPin;
    if (updates.pin) dbUpdates.pin = updates.pin; 

    // Added .select() to verify if the row actually exists and was updated
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select(); 

    if (error) {
      console.error("❌ Update Failed:", error);
      alert("Update failed: " + error.message);
    } else if (!data || data.length === 0) {
      console.warn("⚠️ Update 'Succeeded' but NO rows changed. Check RLS policies or User ID.");
      alert("Warning: User profile not found or permission denied.");
    } else {
      console.log("✅ Update Verified. New Data:", data[0]);
    }
    console.groupEnd();
  },

  // ------------------------------------------------------------------
  // 3. DELETE USER
  // ------------------------------------------------------------------
  async deleteUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      alert("Cannot delete yourself!");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      // SUCCESS -> RELOAD
      alert("User deleted successfully.");
      window.location.reload(); // <--- RELOADS ONLY AFTER SUCCESS
    }
  },

  // ------------------------------------------------------------------
  // 4. TRANSACTION
  // ------------------------------------------------------------------
  async handleTransaction(userId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') {
    console.group(`💰 Debug: handleTransaction (${type})`);
    console.log("Amount:", amount, "User:", userId);

    const signedAmount = type === 'CREDIT' ? amount : -amount;

    // 1. Insert into Ledger
    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert([{
        user_id: userId,
        description: remark || (type === 'CREDIT' ? 'Manual Credit' : 'Manual Debit'),
        amount: amount,
        type: type
      }]);

    if (ledgerError) console.error("❌ Ledger Insert Failed:", ledgerError);

    // 2. Update Wallet (RPC)
    const { error: walletError } = await supabase.rpc('increment_wallet', { 
      user_id: userId, 
      amount: signedAmount 
    });

    if (walletError) console.error("❌ Wallet RPC Failed:", walletError);

    if (ledgerError || walletError) {
      alert("Transaction failed. Check console for details.");
    } else {
      console.log("✅ Transaction Complete");
    }
    console.groupEnd();
  },
};
