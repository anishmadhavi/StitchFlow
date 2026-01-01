/**
 * services/assignmentService.ts
 * STATUS: FIXED (Stock Return + Clean Descriptions + Syntax) ✅
 */
import { supabase } from '../src/supabaseClient';
import { SizeQty, AssignmentStatus, Batch } from '../types';

export const assignmentService = {
  async handleQCSubmit(batchId: string, assignmentId: string, passedQty: SizeQty, batches: Batch[]) {
    const batch = batches.find(b => b.id === batchId);
    const assignment = batch?.assignments.find(a => a.id === assignmentId);
    
    if (!batch || !assignment) return;

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

    const rate = Number(batch.ratePerPiece) || Number((batch as any).rate_per_piece) || 0;
    const amountToPay = sessionPassedCount * rate;

    try {
      if (amountToPay > 0) {
        const { data: karigar } = await supabase
          .from('profiles')
          .select('wallet_balance, ledger')
          .eq('id', assignment.karigarId)
          .single();

        // ✅ CLEAN DESCRIPTION: Removed "QC Passed:" prefix
        const passedSizes = Object.entries(passedQty)
          .filter(([_, qty]) => (qty as number) > 0)
          .map(([size, qty]) => `${size}(${qty})`)
          .join(', ');

        const newEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description: `${batch.styleName} [${passedSizes}]`, 
          rate: rate,
          quantity: sessionPassedCount,
          amount: amountToPay,
          type: 'CREDIT'
        };

        await supabase.from('profiles').update({
          wallet_balance: (Number(karigar?.wallet_balance) || 0) + amountToPay,
          ledger: [...(Array.isArray(karigar?.ledger) ? karigar.ledger : []), newEntry]
        }).eq('id', assignment.karigarId);
      }

      await supabase.from('assignments').update({
        status: sessionReworkCount > 0 ? AssignmentStatus.QC_REWORK : AssignmentStatus.QC_PASSED,
        assigned_qty: sessionReworkCount > 0 ? reworkQty : assignment.assignedQty,
        qc_notes: sessionReworkCount > 0 ? `Please fix ${sessionReworkCount} units.` : ''
      }).eq('id', assignmentId);

      alert(`Success! Recorded ${sessionPassedCount} units.`);
      window.location.reload();
    } catch (err: any) {
      alert("QC Error: " + err.message);
    }
  },

  async updateAssignmentStatus(batchId: string, assignmentId: string, status: AssignmentStatus, batches: Batch[]) {
    try {
      // ✅ STOCK RETURN LOGIC: Add units back to batch if Karigar rejects
      if (status === AssignmentStatus.REJECTED) {
        const batch = batches.find(b => b.id === batchId);
        const { data: assignment } = await supabase
          .from('assignments')
          .select('assigned_qty')
          .eq('id', assignmentId)
          .single();

        if (batch && assignment) {
          const returnedQty = assignment.assigned_qty;
          const newAvailableQty = { ...batch.availableQty };

          Object.entries(returnedQty).forEach(([size, amount]) => {
            newAvailableQty[size] = (Number(newAvailableQty[size]) || 0) + (Number(amount) || 0);
          });

          await supabase.from('batches')
            .update({ available_qty: newAvailableQty })
            .eq('id', batchId);
        }
      }

      const { error } = await supabase
        .from('assignments')
        .update({ status })
        .eq('id', assignmentId);

      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  }
};
