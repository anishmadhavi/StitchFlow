/**
 * services/userService.ts
 * LOCATION: src/services/userService.ts
 * VERSION: RAW FETCH DEBUGGING 🛠️
 */

import { supabase } from '../src/supabaseClient';
import { Role, User } from '../types';

export const userService = {
  // ------------------------------------------------------------------
  // 1. ADD USER (Raw Fetch Version)
  // ------------------------------------------------------------------
  async addUser(name: string, role: Role, mobile: string, pin: string) {
    // 🚨 THIS LOG PROVES THE NEW FILE IS ACTIVE
    console.log("✅ CORRECT FILE LOADED: Raw Fetch Version Active");
    console.log("🚀 Add-User Triggered for:", name);
    
    try {
      // 1. Get Session Token (Required for security)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert("Security Error: You are not logged in.");
        return;
      }

      // 2. Prepare Payload
      const payload = { name, role, mobile, pin };
      console.log("📦 Payload:", payload);

      // 3. SEND REQUEST (Using Raw Fetch to bypass library issues)
      console.log("📡 Sending Request to Edge Function...");
      
      // We use the URL you confirmed earlier
      const response = await fetch('https://sdrvifpydrlykhbnvtxi.supabase.co/functions/v1/admin-create-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log("📡 Response Code:", response.status);

      // 4. Handle Response
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server Error Body:", errorText);
        alert(`Server Error (${response.status}): ${errorText}`);
        return;
      }

      // 5. Success
      const data = await response.json();
      console.log("✅ Success Data:", data);
      alert("Staff member created successfully!");
      
      // 6. Reload to show changes
      window.location.reload();

    } catch (err: any) {
      console.error("💥 System Crash:", err);
      alert("System Error: " + err.message);
    }
  },

  // ------------------------------------------------------------------
  // 2. UPDATE USER
  // ------------------------------------------------------------------
  async updateUser(userId: string, updates: Partial<User>) {
    console.group(`✏️ updateUser Triggered for ${userId}`);
    
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    
    // Fix for 'pin' vs 'display_pin'
    if (updates.pin) dbUpdates.display_pin = updates.pin; 
    if (updates.displayPin) dbUpdates.display_pin = updates.displayPin;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      console.error("❌ Update Failed:", error);
      alert("Update failed: " + error.message);
    } else {
      console.log("✅ Update Success");
      alert("Update successful!");
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

    if (!confirm("Are you sure you want to delete this staff member?")) return;

    // 1. Delete from Database
    const { error: dbError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (dbError) {
      alert("Delete failed: " + dbError.message);
      return;
    }

    // 2. Delete from Auth (Edge Function)
    const { error: authError } = await supabase.functions.invoke('delete-auth-user', {
      body: { userId }
    });

    if (authError) console.warn("Auth delete failed:", authError);

    alert("User deleted successfully.");
    window.location.reload();
  },

  // ------------------------------------------------------------------
  // 4. TRANSACTIONS
  // ------------------------------------------------------------------
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
      alert("Transaction failed");
    } else {
      console.log("✅ Transaction Success");
    }
  }
};
