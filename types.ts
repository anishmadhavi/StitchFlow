/**
 * types.ts
 * Purpose: TypeScript Definitions.
 * Description: Contains all Enums, Interfaces, and Types used across the application to ensure type safety.
 * Compatibility: Pure TypeScript, runs anywhere.
 */

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MASTER = 'MASTER',
  KARIGAR = 'KARIGAR',
  QC = 'QC'
}

export interface Category {
  id: string;
  name: string;
  defaultRate: number;
  allowedSizes: string[];
}

export enum BatchStatus {
  PENDING_MATERIAL = 'Pending Material',
  CUTTING_DONE = 'Cutting Done',
  IN_PRODUCTION = 'In Production', // Once assignments start
  COMPLETED = 'Completed', // Admin marked as done
  ARCHIVED = 'Archived'
}

export enum AssignmentStatus {
  ASSIGNED = 'Assigned',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  STITCHED = 'Stitched',
  QC_PASSED = 'QC Passed',
  QC_REWORK = 'QC Rework'
}

export type SizeQty = Record<string, number>;

export interface Assignment {
  id: string;
  karigarId: string;
  karigarName: string;
  assignedQty: SizeQty;
  status: AssignmentStatus;
  assignedAt: string; // ISO Date
  completedAt?: string;
  qcNotes?: string;
}

export interface Batch {
  id: string;
  styleName: string;
  sku: string;
  imageUrl: string;
  ratePerPiece: number;
  status: BatchStatus;
  createdAt: string;
  
  // Quantities
  plannedQty: SizeQty;
  actualCutQty: SizeQty; // Filled by Master
  
  // Inventory tracking
  availableQty: SizeQty; // Cut - Assigned
  
  // Assignments (Sub-tasks)
  assignments: Assignment[];
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  relatedBatchId?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  walletBalance: number;
  ledger: LedgerEntry[];
  avatarUrl?: string;
  mobile?: string;     // New field
  displayPin?: string; // New field for Admin visibility
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  batches: Batch[];
}
