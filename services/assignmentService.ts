/**
 * services/assignmentService.ts
 * STATUS: UPDATED (Added Detailed Ledger Entry with Sizes) ✅
 */
import { supabase } from '../src/supabaseClient';
import { SizeQty, AssignmentStatus, Batch } from '../types';

export const assignmentService = {
  async handleQCSubmit(batchId: string, assignmentId: string, passedQty: SizeQty, batches: Batch[]) {
    const batch = batches.find(b => b.id === batchId);
    const assignment = batch?.assignments.find(a => a.id === assignmentId);
    
    if (!batch || !assignment) {
      alert("Error: Batch or Assignment not found");
      return;
    }

    // 1. Calculate Payout for this session
    let sessionPassedCount = 0;
    let sessionReworkCount = 0;
    const reworkQty: SizeQty = {};

    Object.keys(assignment.assignedQty).forEach(size => {
      const assigned = Number(assignment.assignedQty[size]) || 0;
      const passed = Number(passedQty[size]) || 0;
      const rework = assigned - passed;
      
      if (rework > 0) reworkQty[size] = rework;
      sessionPassedCount += passed;
      sessionReworkCount += rework;
    });

    const rate = Number(batch.ratePerPiece) || 0;
    const amountToPay = sessionPassedCount * rate;

    // DEBUG ALERT
    alert(`QC Result: ${sessionPassedCount} Passed, Rate: ₹${rate}, Total Pay: ₹${amountToPay}`);

    try {
      // 2. Update Karigar Profile (Pay the money)
      if (amountToPay > 0) {
        // Fetch latest karigar data
        const { data: karigar, error: fetchError } = await supabase
          .from('profiles')
          .select('wallet_balance, ledger')
          .eq('id', assignment.karigarId)
          .single();

        if (fetchError) throw new Error("Could not find Karigar profile: " + fetchError.message);

        // ✅ UPDATED: Added detailed description with sizes and separate data fields
        const passedSizes = Object.entries(passedQty)
          .filter(([_, qty]) => (qty as number) > 0)
          .map(([size, qty]) => `${size}(${qty})`)
          .join(', ');

        const newEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description: `QC Passed: ${batch.styleName} [${passedSizes}]`,
          rate: rate, // Added for new column
          quantity: sessionPassedCount, // Added for new column
          amount: amountToPay,
          type: 'CREDIT'
        };

        const currentBalance = Number(karigar.wallet_balance) || 0;
        const currentLedger = Array.isArray(karigar.ledger) ? karigar.ledger : [];

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            wallet_balance: currentBalance + amountToPay,
            ledger: [...currentLedger, newEntry]
          })
          .eq('id', assignment.karigarId);

        if (profileError) throw new Error("Wallet Update Failed: " + profileError.message);
      }

      // 3. Update Assignment Status
      const { error: assignError } = await supabase
        .from('assignments')
        .update({
          status: sessionReworkCount > 0 ? AssignmentStatus.QC_REWORK : AssignmentStatus.QC_PASSED,
          assigned_qty: sessionReworkCount > 0 ? reworkQty : assignment.assignedQty,
          qc_notes: sessionReworkCount > 0 ? `Please rework ${sessionReworkCount} units.` : ''
        })
        .eq('id', assignmentId);

      if (assignError) throw new Error("Assignment Status Update Failed: " + assignError.message);

      alert("Success! Payout recorded and status updated.");
      window.location.reload();

    } catch (err: any) {
      console.error("QC Error:", err);
      alert("QC Error: " + err.message);
    }
  },

  async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    await supabase.from('assignments').update({ status }).eq('id', assignmentId);
  }
};
