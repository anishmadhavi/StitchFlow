/**
 * services/assignmentService.ts
 * STATUS: FIXED (Rework Quantity Rollback + Payout Logic) ✅
 */
import { supabase } from '../src/supabaseClient';
import { SizeQty, AssignmentStatus, Batch } from '../types';

export const assignmentService = {
  async handleQCSubmit(batchId: string, assignmentId: string, passedQty: SizeQty, batches: Batch[]) {
    const batch = batches.find(b => b.id === batchId);
    const assignment = batch?.assignments.find(a => a.id === assignmentId);
    if (!batch || !assignment) return;

    // 1. Calculate Rework Quantity (Size by Size)
    const reworkQty: SizeQty = {};
    let totalPassed = 0;
    let totalRework = 0;

    Object.keys(assignment.assignedQty).forEach(size => {
      const assigned = Number(assignment.assignedQty[size]) || 0;
      const passed = Number(passedQty[size]) || 0;
      const rework = assigned - passed;
      
      if (rework > 0) reworkQty[size] = rework;
      totalPassed += passed;
      totalRework += rework;
    });

    try {
      // 2. Handle Payout if any pieces passed
      if (totalPassed > 0) {
        const amountToPay = totalPassed * batch.ratePerPiece;
        
        const { data: karigar } = await supabase
          .from('profiles')
          .select('wallet_balance, ledger')
          .eq('id', assignment.karigarId)
          .single();

        const newEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description: `QC Passed: ${batch.styleName} (${totalPassed} pcs)`,
          amount: amountToPay,
          type: 'CREDIT'
        };

        await supabase.from('profiles').update({
          wallet_balance: (karigar?.wallet_balance || 0) + amountToPay,
          ledger: [...(karigar?.ledger || []), newEntry]
        }).eq('id', assignment.karigarId);
      }

      // 3. Update Assignment
      // If rework exists, we update the quantity to ONLY show rework pieces
      const { error } = await supabase.from('assignments').update({
        status: totalRework > 0 ? AssignmentStatus.QC_REWORK : AssignmentStatus.QC_PASSED,
        assigned_qty: totalRework > 0 ? reworkQty : assignment.assignedQty, // 👈 KEY FIX
        qc_notes: totalRework > 0 ? `Please fix ${totalRework} pieces.` : ''
      }).eq('id', assignmentId);

      if (error) throw error;

      alert(totalRework > 0 ? `Sent ${totalRework} pieces for rework.` : "Passed! Karigar paid.");
      window.location.reload();

    } catch (err: any) {
      alert("Error: " + err.message);
    }
  },

  async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    await supabase.from('assignments').update({ status }).eq('id', assignmentId);
  }
};
