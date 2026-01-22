/**
 * Type definitions for recurring transactions feature
 *
 * Note: These types are defined locally since no backend API exists yet.
 * TODO: When backend is implemented, import types from Orval-generated models
 * and keep only UI-specific types here (following accounts.types.ts pattern).
 */
import { z } from 'zod';
import {
  recurringFiltersSchema,
  recurringListSchema,
  recurringResponseSchema,
  recurringCreateSchema,
  recurringUpdateSchema,
  frequencySchema,
  amountModelSchema,
  occurrenceStatusSchema,
  transactionTypeSchema,
  recurringOccurrenceSchema,
} from './recurring.schemas';

// ============================================================================
// ENUM TYPES
// ============================================================================

/**
 * Frequency of recurring transactions
 */
export type Frequency = z.infer<typeof frequencySchema>;

/**
 * Amount model for recurring transactions
 * - fixed: Same amount every time
 * - variable_within_range: Amount varies within min/max range
 * - progressive: Amount increases/decreases over time
 * - seasonal: Amount varies by season/month
 * - formula: Amount calculated by formula
 */
export type AmountModel = z.infer<typeof amountModelSchema>;

/**
 * Status of individual occurrences
 */
export type OccurrenceStatus = z.infer<typeof occurrenceStatusSchema>;

/**
 * Transaction type (income or expense)
 */
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// ============================================================================
// API TYPES - TODO: Import from Orval when backend exists
// ============================================================================

/**
 * Recurring transaction response from API
 * TODO: Replace with Orval-generated RecurringTransactionResponse
 */
export type RecurringTransaction = z.infer<typeof recurringResponseSchema>;

/**
 * Payload for creating a recurring transaction
 * TODO: Replace with Orval-generated RecurringTransactionCreate
 */
export type RecurringTransactionCreate = z.infer<typeof recurringCreateSchema>;

/**
 * Payload for updating a recurring transaction
 * TODO: Replace with Orval-generated RecurringTransactionUpdate
 */
export type RecurringTransactionUpdate = z.infer<typeof recurringUpdateSchema>;

/**
 * List response for recurring transactions
 * TODO: Replace with Orval-generated RecurringTransactionList
 */
export type RecurringTransactionList = z.infer<typeof recurringListSchema>;

/**
 * Individual occurrence of a recurring transaction
 */
export type RecurringOccurrence = z.infer<typeof recurringOccurrenceSchema>;

// ============================================================================
// UI-SPECIFIC TYPES
// ============================================================================

/**
 * Query/Filter parameters for recurring transactions
 */
export type RecurringFilters = z.infer<typeof recurringFiltersSchema>;

/**
 * Extended recurring transaction with computed statistics (for UI)
 */
export interface RecurringWithStats extends RecurringTransaction {
  /** Calculated monthly equivalent amount */
  monthlyEquivalent: number;
  /** Number of times executed */
  executionCount: number;
  /** Days until next occurrence */
  daysUntilNext: number | null;
}

/**
 * Summary statistics for recurring transactions
 */
export interface RecurringSummary {
  /** Total monthly income from recurring */
  monthlyIncome: number;
  /** Total monthly expenses from recurring */
  monthlyExpenses: number;
  /** Net monthly amount */
  netMonthly: number;
  /** Total number of active recurring transactions */
  activeCount: number;
  /** Total number of paused recurring transactions */
  pausedCount: number;
}
