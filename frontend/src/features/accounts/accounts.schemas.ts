import { z } from 'zod';
import { AccountType } from '@/api/generated/models';

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
 * Used for creating new accounts
 */
export const accountCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'accounts.errors.nameRequired')
    .max(100, 'accounts.errors.nameTooLong'),

  accountType: accountTypeSchema.default(AccountType.Checking),

  currency: currencySchema,

  institutionName: z
    .string()
    .max(255, 'Institution name is too long')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(1000, 'Notes are too long (max 1000 characters)')
    .optional()
    .nullable(),

  financialProfileId: z.string().uuid().optional().nullable(),

  initialBalance: z
    .number()
    .default(0)
    .describe('Initial account balance (can be negative for debts)'),

  accountNumberLast4: z
    .string()
    .length(4, 'Account number must be exactly 4 digits')
    .regex(/^\d{4}$/, 'Account number must be 4 digits')
    .optional()
    .nullable(),

  iban: z
    .string()
    .regex(
      /^[A-Z]{2}\d{2}[A-Z0-9]+$/,
      'IBAN must start with 2 letters, 2 digits, followed by alphanumeric characters'
    )
    .min(15, 'IBAN is too short')
    .max(34, 'IBAN is too long')
    .optional()
    .nullable(),
});

/**
 * Account Update Schema
 * All fields are optional for partial updates
 */
export const accountUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'accounts.errors.nameRequired')
    .max(100, 'accounts.errors.nameTooLong')
    .optional(),

  accountType: accountTypeSchema.optional(),

  currency: currencySchema.optional(),

  institutionName: z
    .string()
    .max(255, 'Institution name is too long')
    .optional()
    .nullable(),

  accountNumberLast4: z
    .string()
    .length(4, 'Account number must be exactly 4 digits')
    .regex(/^\d{4}$/, 'Account number must be 4 digits')
    .optional()
    .nullable(),

  iban: z
    .string()
    .regex(
      /^[A-Z]{2}\d{2}[A-Z0-9]+$/,
      'IBAN must start with 2 letters, 2 digits, followed by alphanumeric characters'
    )
    .min(15, 'IBAN is too short')
    .max(34, 'IBAN is too long')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(1000, 'Notes are too long (max 1000 characters)')
    .optional()
    .nullable(),

  isActive: z.boolean().optional(),
});

/**
 * Account Response Schema
 * Validates data returned from the API
 */
export const accountResponseSchema = z.object({
  id: z.string().uuid(),

  name: z.string().min(1).max(100),

  accountType: accountTypeSchema.optional(),

  currency: z.string().length(3).optional(),

  institutionName: z.string().optional().nullable(),

  notes: z.string().optional().nullable(),

  financialProfileId: z.string().uuid(),

  initialBalance: z.string(), // API returns as string

  currentBalance: z.string(), // API returns as string

  accountNumberLast4: z.string().optional().nullable(),

  iban: z.string().optional().nullable(),

  isActive: z.boolean().optional().default(true),

  createdAt: z.string().datetime(),

  updatedAt: z.string().datetime(),
});

/**
 * Account Balance Schema
 */
export const accountBalanceSchema = z.object({
  accountId: z.string().uuid(),
  balance: z.string(),
  currency: z.string().length(3),
  asOfDate: z.string().datetime(),
});

/**
 * Account List Response Schema
 */
export const accountListSchema = z.object({
  accounts: z.array(accountResponseSchema),
  total: z.number().int().min(0),
});

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
