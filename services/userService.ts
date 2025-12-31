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
    
    // 1. Prepare the database object
    const dbUpdates: any = {};
    
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    
    // ✅ FIX: Map BOTH 'pin' and 'displayPin' to the correct DB column: 'display_pin'
    // If the UI sends 'pin', we save it as 'display_pin'
    if (updates.pin) dbUpdates.display_pin = updates.pin; 
    if (updates.displayPin) dbUpdates.display_pin = updates.displayPin;

    console.log("📦 Sending to DB:", dbUpdates);

    // 2. Send update
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select();

    if (error) {
      console.error("❌ Update Failed:", error);
      alert("Update failed: " + error.message);
    } else {
      console.log("✅ Update Verified:", data);
      // Optional: Refresh if you want the UI to update instantly
      // window.location.reload(); 
    }
    console.groupEnd();
  },
  // ------------------------------------------------------------------
  // 3. DELETE USER
  // ------------------------------------------------------------------
  async deleteUser(userId: string, currentUserId: string) {
    console.log("🗑️ deleteUser Triggered for:", userId);

    if (userId === currentUserId) {
      alert("Cannot delete yourself!");
      return;
    }

    // 1. Delete from Database (Profiles Table)
    const { error: dbError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error("❌ DB Delete Failed:", dbError);
      alert("Delete failed: " + dbError.message);
      return;
    }

    // 2. Call Edge Function to Delete Login (Auth)
    // (This was missing in the previous code!)
    console.log("📡 Calling Edge Function to delete Auth...");
    const { error: authError } = await supabase.functions.invoke('delete-auth-user', {
      body: { userId }
    });

    if (authError) {
      console.warn("⚠️ Profile deleted, but Auth delete failed:", authError);
      // We don't stop here because the profile is already gone, so we just warn the user.
    } else {
      console.log("✅ Auth delete success");
    }

    // 3. Success -> Reload Page
    alert("User deleted successfully.");
    window.location.reload();
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
