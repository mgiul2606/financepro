import { z } from 'zod';
import {
  accountCreateSchema,
  accountUpdateSchema,
  accountResponseSchema,
  accountBalanceSchema,
  accountListSchema,
  accountFiltersSchema,
  accountWithStatsSchema,
  accountStatusSchema,
  accountStatusInfoSchema,
  accountTypeSchema,
  currencySchema,
} from './accounts.schemas';

/**
 * Type definitions derived from Zod schemas
 * These ensure type safety across the application
 *
 * Note: AccountCreate, AccountUpdate, AccountResponse, and AccountBalance
 * are now imported from Orval-generated models for API compatibility.
 * Only UI-specific types are defined here.
 */

// Query/Filter types
export type AccountFilters = z.infer<typeof accountFiltersSchema>;

// Response types (output) - for lists and aggregations
export type AccountList = z.infer<typeof accountListSchema>;

// UI-specific types
export type AccountWithStats = z.infer<typeof accountWithStatsSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type AccountStatusInfo = z.infer<typeof accountStatusInfoSchema>;

// Utility types
export type AccountType = z.infer<typeof accountTypeSchema>;
export type Currency = z.infer<typeof currencySchema>;
