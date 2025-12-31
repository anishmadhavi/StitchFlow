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
    console.group("🚀 Debug: addUser Triggered");
    const startTime = performance.now();

    try {
      // 1. Log the payload to ensure data is clean before sending
      const payload = { name, role, mobile, pin };
      console.log("📦 Payload being sent:", payload);

      // 2. Invoke the function
      console.log("📡 Contacting Edge Function: 'admin-create-user'...");
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: payload
      });

      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`⏱️ Request Duration: ${duration}ms`);

      // 3. Analyze the response deeply
      if (error) {
        console.error("❌ CRITICAL: Supabase Connection Error");
        console.error("Details:", error);
        
        // Specific check for the "Function not found" 404 error
        if (error instanceof Error && error.message.includes("404")) {
          alert("DEPLOYMENT ERROR: The 'admin-create-user' function was not found. Please run 'supabase functions deploy'.");
        } else {
          alert(`Network Error (${error.message || 'Unknown'}). Check console.`);
        }
        return;
      }

      // 4. Check for logic errors returned by the function itself
      if (data?.error) {
        console.error("❌ FUNCTION LOGIC ERROR:", data.error);
        alert("Server Logic Error: " + data.error);
        return;
      }

      // 5. Success
      console.log("✅ Success! Data received:", data);
      alert("Staff member created successfully!");

    } catch (crashError: any) {
      console.error("💥 SYSTEM CRASH in addUser:", crashError);
      alert("Unexpected System Error: " + (crashError.message || crashError));
    } finally {
      console.groupEnd();
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
    console.group(`🗑️ Debug: deleteUser (${userId})`);
    
    try {
      console.log('Current Admin ID:', currentUserId);
      
      if (userId === currentUserId) {
        alert("Cannot delete yourself!");
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select();
      
      console.log('Supabase Response:', { data, error });
      
      if (error) {
        console.error('❌ Delete DB Error:', error);
        alert("Delete failed: " + error.message);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No rows deleted. The user might not exist or RLS is blocking delete.');
        alert("Delete failed: Permission denied or user not found");
        throw new Error("No rows deleted");
      }
      
      console.log('✅ Profile deleted from DB:', data);
      return data;

    } catch (err) {
      console.error("Delete Exception:", err);
      throw err;
    } finally {
      console.groupEnd();
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
