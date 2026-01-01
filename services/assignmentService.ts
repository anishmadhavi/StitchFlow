/**
 * services/assignmentService.ts
 * STATUS: FIXED (Partial Payout Logic per QC Session) ✅
 */
import { supabase } from '../src/supabaseClient';
import { SizeQty, AssignmentStatus, Batch } from '../types';

export const assignmentService = {
  async handleQCSubmit(batchId: string, assignmentId: string, passedQty: SizeQty, batches: Batch[]) {
    const batch = batches.find(b => b.id === batchId);
    const assignment = batch?.assignments.find(a => a.id === assignmentId);
    if (!batch || !assignment) return;

    // 1. Calculate how many pieces passed and how many failed in THIS session
    const reworkQty: SizeQty = {};
    let sessionPassedCount = 0;
    let sessionReworkCount = 0;

    Object.keys(assignment.assignedQty).forEach(size => {
      const assigned = Number(assignment.assignedQty[size]) || 0;
      const passed = Number(passedQty[size]) || 0;
      const rework = assigned - passed;
      
      if (rework > 0) reworkQty[size] = rework;
      sessionPassedCount += passed;
      sessionReworkCount += rework;
    });

    try {
      // 2. IMMEDIATE PARTIAL PAYOUT
      // Only pay for the pieces that passed in this specific QC round
      if (sessionPassedCount > 0) {
        const amountToPay = sessionPassedCount * batch.ratePerPiece;
        
        // Get latest Karigar data
        const { data: karigar } = await supabase
          .from('profiles')
          .select('wallet_balance, ledger')
          .eq('id', assignment.karigarId)
          .single();

        const newEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description: `QC Passed: ${batch.styleName} (${sessionPassedCount} units)`,
          amount: amountToPay,
          type: 'CREDIT'
        };

        const updatedBalance = (karigar?.wallet_balance || 0) + amountToPay;
        const updatedLedger = [...(karigar?.ledger || []), newEntry];

        await supabase.from('profiles').update({
          wallet_balance: updatedBalance,
          ledger: updatedLedger
        }).eq('id', assignment.karigarId);
      }

      // 3. UPDATE ASSIGNMENT
      // If there is rework, we update the assignment to reflect ONLY the remaining rework pieces
      const { error } = await supabase.from('assignments').update({
        status: sessionReworkCount > 0 ? AssignmentStatus.QC_REWORK : AssignmentStatus.QC_PASSED,
        assigned_qty: sessionReworkCount > 0 ? reworkQty : assignment.assignedQty,
        qc_notes: sessionReworkCount > 0 ? `Please fix ${sessionReworkCount} pieces.` : ''
      }).eq('id', assignmentId);

      if (error) throw error;

      alert(sessionReworkCount > 0 
        ? `Paid for ${sessionPassedCount} units. Sent ${sessionReworkCount} units for rework.` 
        : `Full batch passed! Paid for ${sessionPassedCount} units.`);
      
      window.location.reload();

    } catch (err: any) {
      alert("Error: " + err.message);
    }
  },

  async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    await supabase.from('assignments').update({ status }).eq('id', assignmentId);
  }
};
