/**
 * services/assignmentService.ts
 * Purpose: Assignment and QC management operations, Update assignment status, Handle QC submissions, **Exports:** `assignmentService` object
 */

import { supabase } from '../src/supabaseClient';
import { AssignmentStatus, SizeQty, Batch } from '../types';

export const assignmentService = {
  async updateAssignmentStatus(assignmentId: string, newStatus: AssignmentStatus) {
    const { error } = await supabase
      .from('assignments')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'Stitched' ? new Date().toISOString() : null
      })
      .eq('id', assignmentId);

    if (error) alert("Update failed: " + error.message);
  },

  async handleQCSubmit(batchId: string, assignmentId: string, passedQty: SizeQty, batches: Batch[]) {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;
    
    const assignment = batch.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const totalPassedCount = Object.values(passedQty).reduce((a, b) => a + (b as number), 0);
    const amount = totalPassedCount * batch.ratePerPiece;

    // Mark assignment as QC Passed
    const { error: assignError } = await supabase
      .from('assignments')
      .update({ status: 'QC Passed' })
      .eq('id', assignmentId);

    // Add to Ledger and Wallet
    if (amount > 0) {
      await supabase.from('ledger_entries').insert([{
        user_id: assignment.karigarId,
        description: `QC Passed: ${batch.styleName} (${totalPassedCount} pcs)`,
        amount: amount,
        type: 'CREDIT',
        related_batch_id: batchId
      }]);

      await supabase.rpc('increment_wallet', { 
        user_id: assignment.karigarId, 
        amount: amount 
      });
    }

    if (assignError) alert("QC processing error");
  },
};
