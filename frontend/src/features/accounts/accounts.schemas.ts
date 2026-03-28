/**
 * Account schemas with runtime validation using Zod
 *
 * This file bridges Orval-generated schemas with application-specific needs:
 * - Imports base Zod schemas auto-generated from OpenAPI spec
 * - Provides simple, friendly aliases for generated schemas
 * - Extends schemas with custom validation messages for i18n
 * - Defines UI-specific schemas not present in the API
 */
import { z } from 'zod';
import { AccountType } from '@/api/generated/models';

// Import auto-generated Zod schemas from Orval
import {
  CreateAccountApiV1AccountsPostBody,
  UpdateAccountApiV1AccountsAccountIdPutBody,
  GetAccountApiV1AccountsAccountIdGetResponse,
  GetAccountBalanceApiV1AccountsAccountIdBalanceGetResponse,
  ListAccountsApiV1AccountsGetResponse,
} from '@/api/generated/zod/accounts/accounts.zod';

/**
 * Account Type Enum Schema
 */
export const accountTypeSchema = z.enum([
  AccountType.Checking,
  AccountType.Savings,
  AccountType.CreditCard,
  AccountType.Investment,
  AccountType.Cash,
  AccountType.Loan,
  AccountType.Mortgage,
  AccountType.Other,
]);

/**
 * Currency Schema - ISO 4217 currency code
 */
export const currencySchema = z
  .string()
  .length(3, 'Currency must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters (e.g., EUR, USD)')
  .default('EUR');

/**
 * Account Create Schema
 * Extends base Orval schema to make financialProfileId optional in the form
 * (it gets injected from ProfileContext before submission)
 */
export const accountCreateSchema = CreateAccountApiV1AccountsPostBody.extend({
  financialProfileId: z.string().uuid().optional().or(z.literal('')),
});

/**
 * Account Update Schema
 * Base schema from Orval for partial updates
 */
export const accountUpdateSchema = UpdateAccountApiV1AccountsAccountIdPutBody;

/**
 * Account Response Schema
 * Validates data returned from the API
 */
export const accountResponseSchema = GetAccountApiV1AccountsAccountIdGetResponse;

/**
 * Account Balance Schema
 */
export const accountBalanceSchema = GetAccountBalanceApiV1AccountsAccountIdBalanceGetResponse;

/**
 * Account List Response Schema
 */
export const accountListSchema = ListAccountsApiV1AccountsGetResponse;

/**
 * Account Query Filters Schema
 */
export const accountFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  accountType: accountTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

/**
 * Extended Account with Statistics (for UI)
 */
export const accountWithStatsSchema = accountResponseSchema.extend({
  change: z.number(),
  changePercentage: z.number(),
});

/**
 * Account Status Types
 */
export const accountStatusSchema = z.enum(['overdrawn', 'low', 'normal', 'high']);

/**
 * Account Status Info (for UI)
 */
export const accountStatusInfoSchema = z.object({
  status: accountStatusSchema,
  label: z.string(),
  variant: z.enum(['error', 'warning', 'default', 'success']),
});
