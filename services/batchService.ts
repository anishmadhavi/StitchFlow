/**
 * services/batchService.ts
 * STATUS: FIXED (Syntax Error + Instant Stock Deduction) ✅
 */
import { supabase } from '../src/supabaseClient';
import { Batch, SizeQty, User } from '../types';

export const batchService = {
  async createBatch(batchData: Partial<Batch>) {
  const { error } = await supabase
    .from('batches')
    .insert([{
      style_name: batchData.styleName,
      // ✅ ADDED: Save category to database
      category: batchData.category, 
      sku: batchData.sku,
      image_url: batchData.imageUrl,
      rate_per_piece: batchData.ratePerPiece,
      planned_qty: batchData.plannedQty,
      available_qty: batchData.plannedQty,
      status: 'Pending Material'
    }]);

  if (error) alert("Error creating batch: " + error.message);
},

  async deleteBatch(batchId: string) {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    const { error } = await supabase.from('batches').delete().eq('id', batchId);
    if (error) alert("Failed to delete: " + error.message);
    else window.location.reload();
  },

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

  async assignToKarigar(batchId: string, karigarId: string, qty: SizeQty, batches: Batch[], users: User[]) {
    const batch = batches.find(b => b.id === batchId);
    const karigar = users.find(u => u.id === karigarId);
    if (!batch || !karigar) return;

    // ✅ INSTANT STOCK DEDUCTION
    const updatedAvailableQty = { ...batch.availableQty };
    Object.entries(qty).forEach(([size, amount]) => {
      updatedAvailableQty[size] = (Number(updatedAvailableQty[size]) || 0) - (Number(amount) || 0);
    });

    try {
      const { error: assignError } = await supabase.from('assignments').insert([{
        batch_id: batchId,
        karigar_id: karigarId,
        karigar_name: karigar.name,
        assigned_qty: qty,
        status: 'Assigned'
      }]);

      if (assignError) throw assignError;

      const { error: batchError } = await supabase.from('batches')
        .update({ available_qty: updatedAvailableQty })
        .eq('id', batchId);

      if (batchError) throw batchError;

      alert(`Successfully assigned to ${karigar.name}. Stock updated.`);
      window.location.reload();
    } catch (err: any) {
      alert("Assignment failed: " + err.message);
    }
  },

  async handleArchive(batchId: string) {
    const { error } = await supabase
      .from('batches')
      .update({ status: 'Archived' })
      .eq('id', batchId);
    
    if (error) throw error;
    window.location.reload();
  } // ✅ FIXED: Removed trailing comma and ensured proper closure
};
