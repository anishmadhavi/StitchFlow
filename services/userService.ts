/**
 * services/userService.ts
 * SOLUTION: Bypass supabase.auth.getSession() and read LocalStorage directly.
 */

import { supabase } from '../src/supabaseClient';
import { Role, User } from '../types';

export const userService = {
  async addUser(name: string, role: Role, mobile: string, pin: string) {
    console.log("🚀 Add-User (Manual Token Mode) Triggered");
    
    try {
      // 🛑 BYPASS: Don't call supabase.auth.getSession()
      // ✅ DIRECT: Read the token from LocalStorage manually
      
      console.log("🔍 Reading LocalStorage for 'stitchflow-v2'...");
      const rawData = localStorage.getItem('stitchflow-v2');
      
      if (!rawData) {
        alert("Error: No session found. Please Log Out and Log In again.");
        return;
      }

      // Parse the JSON manually
      const sessionData = JSON.parse(rawData);
      const token = sessionData?.access_token;

      if (!token) {
        alert("Error: Token missing from storage. Please Log Out and Log In again.");
        return;
      }
      
      console.log("✅ Token found manually!");

      // Prepare Payload
      const payload = { name, role, mobile, pin };

      // Send Request
      console.log("📡 Sending Request to Edge Function...");
      const response = await fetch('https://sdrvifpydrlykhbnvtxi.supabase.co/functions/v1/admin-create-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // We use the manual token here
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

  // ... (Keep your other functions like updateUser, deleteUser, etc.)
  async updateUser(userId: string, updates: Partial<User>) {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.pin) dbUpdates.display_pin = updates.pin; 
      if (updates.displayPin) dbUpdates.display_pin = updates.displayPin;

      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
      if (error) alert(error.message); else alert("Updated!");
  },

  async deleteUser(userId: string, currentUserId: string) {
     const { error } = await supabase.from('profiles').delete().eq('id', userId);
     if (error) alert(error.message);
     else {
         await supabase.functions.invoke('delete-auth-user', { body: { userId } });
         alert("Deleted!");
         window.location.reload();
     }
  },

  async handleTransaction(userId: string, amount: number, remark: string, type: 'CREDIT' | 'DEBIT') {
    // Keep existing logic
  }
};
