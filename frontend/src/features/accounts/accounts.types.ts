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
 */

// Request types (input)
export type AccountCreate = z.infer<typeof accountCreateSchema>;
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;
export type AccountFilters = z.infer<typeof accountFiltersSchema>;

// Response types (output)
export type AccountResponse = z.infer<typeof accountResponseSchema>;
export type AccountBalance = z.infer<typeof accountBalanceSchema>;
export type AccountList = z.infer<typeof accountListSchema>;

// UI-specific types
export type AccountWithStats = z.infer<typeof accountWithStatsSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type AccountStatusInfo = z.infer<typeof accountStatusInfoSchema>;

// Utility types
export type AccountType = z.infer<typeof accountTypeSchema>;
export type Currency = z.infer<typeof currencySchema>;
