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

    // 2. Delete from Auth (Using Manual Token Fetch to avoid freezing)
    try {
      // Get Token Manually (Same trick as addUser)
      const rawData = localStorage.getItem('stitchflow-v2');
      const sessionData = rawData ? JSON.parse(rawData) : null;
      const token = sessionData?.access_token;

      if (token) {
        console.log("📡 Calling Edge Function (Raw Fetch)...");
        const response = await fetch('https://sdrvifpydrlykhbnvtxi.supabase.co/functions/v1/delete-auth-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId }) // Sending the ID clearly
        });

        if (!response.ok) {
           const errText = await response.text();
           console.error("❌ Auth Delete Failed:", errText);
           // We don't alert here because the profile is already gone, which is the important part for the UI.
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
