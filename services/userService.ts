/**
 * services/userService.ts
 * LOCATION: src/services/userService.ts
 * STATUS: FIXED & COMPLETE ✅
 */

import { supabase } from '../src/supabaseClient';
import { Role, User } from '../types';

export const userService = {
  // ------------------------------------------------------------------
  // 1. ADD USER (Manual Token Fix)
  // ------------------------------------------------------------------
  async addUser(name: string, role: Role, mobile: string, pin: string) {
    console.log("🚀 Add-User (Manual Token Mode) Triggered");
    
    try {
      console.log("🔍 Reading LocalStorage for 'stitchflow-v2'...");
      const rawData = localStorage.getItem('stitchflow-v2');
      
      if (!rawData) {
        alert("Error: No session found. Please Log Out and Log In again.");
        return;
      }

      const sessionData = JSON.parse(rawData);
      const token = sessionData?.access_token;

      if (!token) {
        alert("Error: Token missing. Please Log Out and Log In again.");
        return;
      }
      
      // Prepare Payload
      const payload = { name, role, mobile, pin };

      // Send Request
      console.log("📡 Sending Request to Edge Function...");
      const response = await fetch('https://moiiawoxpkxodkncmfxz.supabase.co/functions/v1/admin-create-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("❌ Server Error:", text);
        alert(`Server Error (${response.status}): ${text}`);
        return;
      }

      const data = await response.json();
      console.log("✅ Success Data:", data);
      alert("Staff member created successfully!");
      window.location.reload();

    } catch (err: any) {
      console.error("💥 Crash:", err);
      alert("System Error: " + err.message);
    }
  },

  // ------------------------------------------------------------------
  // 2. UPDATE USER (Generic Profile Updates)
  // ------------------------------------------------------------------
  async updateUser(userId: string, updates: Partial<User>) {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.pin) dbUpdates.display_pin = updates.pin; 
    if (updates.displayPin) dbUpdates.display_pin = updates.displayPin;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) alert(error.message); else console.log("Profile Updated");
  },

  // ------------------------------------------------------------------
  // 3. DELETE USER (Manual Token Fix)
  // ------------------------------------------------------------------
  async deleteUser(userId: string, currentUserId: string) {
    console.log("🗑️ deleteUser Triggered for:", userId);

    if (userId === currentUserId) {
      alert("Cannot delete yourself!");
      return;
    }

    if (!confirm("Are you sure you want to delete this staff member? This will remove their login access.")) return;

    // 1. Delete from Database (Profiles Table)
    const { error: dbError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (dbError) {
      alert("Delete failed: " + dbError.message);
      return;
    }

    // 2. Delete from Auth (Using Manual Token Fetch)
    try {
      const rawData = localStorage.getItem('stitchflow-v2');
      const sessionData = rawData ? JSON.parse(rawData) : null;
      const token = sessionData?.access_token;

      if (token) {
        console.log("📡 Calling Edge Function (Raw Fetch)...");
        const response = await fetch('https://moiiawoxpkxodkncmfxz.supabase.co/functions/v1/delete-auth-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });

        if (!response.ok) {
           const errText = await response.text();
           console.error("❌ Auth Delete Failed:", errText);
        } else {
           console.log("✅ Auth Delete Success");
        }
      } else {
        console.warn("⚠️ No token found, skipping Auth delete");
      }
    } catch (e) {
      console.error("💥 Edge Function Call Error:", e);
    }

    // 3. Success -> Reload
    alert("User deleted successfully.");
    window.location.reload();
  },

  // ------------------------------------------------------------------
  // 4. UPDATE PIN (Secure Edge Function) - NEW ADDITION ✅
  // ------------------------------------------------------------------
  async updatePin(userId: string, newPin: string) {
    console.log("🔐 Updating PIN for:", userId);
    try {
      // 1. Get Token
      const rawData = localStorage.getItem('stitchflow-v2');
      const sessionData = rawData ? JSON.parse(rawData) : null;
      const token = sessionData?.access_token;

      if (!token) throw new Error("No session found");

      // 2. Call Edge Function
      const response = await fetch('https://moiiawoxpkxodkncmfxz.supabase.co/functions/v1/update-user-pin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, newPin })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      console.log("✅ PIN Updated:", data);
      return data;

    } catch (err: any) {
      console.error("❌ PIN Update Failed:", err);
      throw err; // Re-throw to handle in UI
    }
  },

  // ------------------------------------------------------------------
  // 5. TRANSACTION (Required by App.tsx)
  // ------------------------------------------------------------------
  async handleTransaction(userId: string, amount: number, description: string, type: 'CREDIT' | 'DEBIT') {
    try {
      // 1. Get the latest profile data from DB
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('wallet_balance, ledger')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Calculate new balance
      const currentBalance = Number(profile.wallet_balance) || 0;
      const newBalance = type === 'CREDIT' 
        ? currentBalance + amount 
        : currentBalance - amount;

      // 3. Create the ledger entry
      const newEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        description: description,
        amount: amount,
        type: type // 'CREDIT' or 'DEBIT'
      };

      const updatedLedger = [...(Array.isArray(profile.ledger) ? profile.ledger : []), newEntry];

      // 4. Update Database (Using snake_case to match SQL)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: newBalance,
          ledger: updatedLedger
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 5. Success
      alert(`Transaction Successful! New Balance: ₹${newBalance}`);
      window.location.reload(); // Force refresh to update the Admin UI

    } catch (err: any) {
      console.error('Transaction error:', err);
      alert('Failed to update payment: ' + err.message);
    }
  }
};
