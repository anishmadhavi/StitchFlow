/**
 * services/assignmentService.ts
 * STATUS: FIXED (Added Payout & Rework Logic) ✅
 */
import { supabase } from '../src/supabaseClient';
import { SizeQty, AssignmentStatus, Batch } from '../types';

export const assignmentService = {
  async handleQCSubmit(batchId: string, assignmentId: string, passedQty: SizeQty, batches: Batch[]) {
    // 1. Find the specific batch and assignment
    const batch = batches.find(b => b.id === batchId);
    const assignment = batch?.assignments.find(a => a.id === assignmentId);
    if (!batch || !assignment) return;

    const totalPassed = Object.values(passedQty).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalAssigned = Object.values(assignment.assignedQty).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalRework = totalAssigned - totalPassed;

    try {
      // 2. Calculate Payout
      const amountToPay = totalPassed * batch.ratePerPiece;
      const newStatus = totalRework > 0 ? AssignmentStatus.QC_REWORK : AssignmentStatus.QC_PASSED;

      // 3. Get Current Karigar Data (to update balance/ledger)
      const { data: karigar } = await supabase
        .from('profiles')
        .select('wallet_balance, ledger')
        .eq('id', assignment.karigarId)
        .single();

      if (karigar && totalPassed > 0) {
        const newEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description: `QC Passed: ${batch.styleName} (${totalPassed} pcs)`,
          amount: amountToPay,
          type: 'CREDIT'
        };

        const updatedLedger = [...(karigar.ledger || []), newEntry];
        const updatedBalance = (karigar.wallet_balance || 0) + amountToPay;

        // 4. UPDATE KARIGAR WALLET
        await supabase.from('profiles').update({
          wallet_balance: updatedBalance,
          ledger: updatedLedger
        }).eq('id', assignment.karigarId);
      }

      // 5. UPDATE ASSIGNMENT STATUS
      // Note: If rework > 0, status becomes 'QC Rework', 
      // which automatically shows back up in Karigar's 'My Jobs'
      const { error } = await supabase
        .from('assignments')
        .update({ 
          status: newStatus,
          qc_notes: totalRework > 0 ? `Rework required for ${totalRework} pieces` : ''
        })
        .eq('id', assignmentId);

      if (error) throw error;

      alert(totalRework > 0 ? `Partial Pass: ${totalRework} pieces sent back for Rework.` : "QC Passed! Karigar paid.");
      window.location.reload(); // Refresh to sync data

    } catch (err: any) {
      alert("QC Submission Failed: " + err.message);
    }
  },

  // Helper for Karigar actions
  async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    await supabase.from('assignments').update({ status }).eq('id', assignmentId);
  }
};
