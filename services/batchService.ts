/**
 * services/batchService.ts
 * STATUS: DEBUG MODE ENABLED (Detailed Error Tracking) 🐞
 */
import { supabase } from '../src/supabaseClient';
import { Batch, SizeQty, User } from '../types';

export const batchService = {
  // --- Create Batch (Admin/Manager) ---
  async createBatch(batchData: Partial<Batch>) {
    try {
      const { error } = await supabase
        .from('batches')
        .insert([{
          style_name: batchData.styleName,
          category: batchData.category, 
          sku: batchData.sku,
          image_url: batchData.imageUrl,
          rate_per_piece: batchData.ratePerPiece,
          planned_qty: batchData.plannedQty,
          available_qty: batchData.plannedQty,
          status: 'Pending Material'
        }]);

      if (error) throw error;
      alert("✅ Batch created successfully!");
    } catch (err: any) {
      alert("❌ Error creating batch: " + (err.message || "Unknown error"));
    }
  },

  // --- Delete Batch ---
  async deleteBatch(batchId: string) {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    const { error } = await supabase.from('batches').delete().eq('id', batchId);
    if (error) alert("Failed to delete: " + error.message);
    else window.location.reload();
  },

  // --- Finalize Cutting (Master) ---
  async finalizeCut(batchId: string, actualQty: SizeQty) {
    const { error } = await supabase
      .from('batches')
      .update({
        actual_cut_qty: actualQty,
        available_qty: actualQty,
        status: 'Cutting Done'
      })
      .eq('id', batchId);

    if (error) alert("Error: " + error.message);
    else window.location.reload(); 
  },

  // --- 🔴 DEBUGGED ASSIGNMENT FUNCTION ---
  async assignToKarigar(batchId: string, karigarId: string, qty: SizeQty, batches: Batch[], users: User[]) {
    console.log("🚀 Starting Assignment Process...");
    
    // 1. Network Check
    if (!navigator.onLine) {
      alert("⚠️ You appear to be offline. Please check your internet connection.");
      return;
    }

    // 2. Data Validation
    const batch = batches.find(b => b.id === batchId);
    const karigar = users.find(u => u.id === karigarId);

    if (!batch) {
      alert("❌ Error: Batch not found in local data. Please refresh.");
      return;
    }
    if (!karigar) {
      alert("❌ Error: Karigar profile not found. Please refresh.");
      return;
    }

    // 3. Prepare Stock Update (Calculate BEFORE sending)
    const updatedAvailableQty = { ...batch.availableQty };
    let hasNegativeStock = false;

    Object.entries(qty).forEach(([size, amount]) => {
      const current = Number(updatedAvailableQty[size]) || 0;
      const deduction = Number(amount) || 0;
      const result = current - deduction;
      
      if (result < 0) hasNegativeStock = true;
      updatedAvailableQty[size] = result;
    });

    if (hasNegativeStock) {
      const confirmNegative = confirm("⚠️ Warning: This assignment will result in NEGATIVE stock for some sizes. Do you want to proceed?");
      if (!confirmNegative) return;
    }

    try {
      // 🟢 STEP 1: Create Assignment Record
      console.log("🔹 Step 1: Inserting Assignment...");
      const { data: assignData, error: assignError } = await supabase.from('assignments').insert([{
        batch_id: batchId,
        karigar_id: karigarId,
        karigar_name: karigar.name, // Ensure this column exists in DB or remove if not needed
        assigned_qty: qty,
        status: 'Assigned',
        assigned_at: new Date().toISOString() // Explicit timestamp
      }]).select();

      if (assignError) {
        console.error("❌ Step 1 Failed:", assignError);
        throw new Error(`Step 1 (Assignment) Failed: ${assignError.message}`);
      }

      // 🟢 STEP 2: Deduct Stock from Batch
      console.log("🔹 Step 2: Updating Batch Stock...");
      const { error: batchError } = await supabase.from('batches')
        .update({ available_qty: updatedAvailableQty })
        .eq('id', batchId);

      if (batchError) {
        console.error("❌ Step 2 Failed:", batchError);
        // Optional: Rollback assignment if stock update fails? 
        // For now, just alerting is safer than complex rollback logic
        throw new Error(`Step 2 (Stock Update) Failed: ${batchError.message}. NOTE: Assignment was created.`);
      }

      console.log("✅ All Steps Success");
      alert(`🎉 Successfully assigned to ${karigar.name}. Stock updated.`);
      window.location.reload();

    } catch (err: any) {
      console.error("🔥 CRITICAL FAILURE:", err);
      alert(err.message || "Unknown Network Error. Please try again.");
    }
  },

  // --- Archive Batch ---
  async handleArchive(batchId: string) {
    const { error } = await supabase
      .from('batches')
      .update({ status: 'Archived' })
      .eq('id', batchId);
    
    if (error) throw error;
    window.location.reload();
  }
};
