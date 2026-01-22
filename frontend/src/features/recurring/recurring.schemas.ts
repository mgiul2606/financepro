/**
 * Recurring transaction schemas with runtime validation using Zod
 *
 * Note: Since no backend API exists yet, all schemas are defined locally.
 * TODO: When backend is implemented, follow accounts.schemas.ts pattern:
 * - Import base Zod schemas from Orval-generated files
 * - Provide simple aliases for generated schemas
 * - Keep only UI-specific schemas here
 */
import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Frequency Enum Schema
 */
export const frequencySchema = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannually',
  'yearly',
  'custom',
]);

/**
 * Amount Model Enum Schema
 */
export const amountModelSchema = z.enum([
  'fixed',
  'variable_within_range',
  'progressive',
  'seasonal',
  'formula',
]);

/**
 * Occurrence Status Enum Schema
 */
export const occurrenceStatusSchema = z.enum([
  'pending',
  'executed',
  'skipped',
  'overridden',
  'failed',
]);

/**
 * Transaction Type Schema
 */
export const transactionTypeSchema = z.enum(['income', 'expense']);

/**
 * Currency Schema - ISO 4217 currency code
 */
export const currencySchema = z
  .string()
  .length(3, 'Currency must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters (e.g., EUR, USD)')
  .default('EUR');

// ============================================================================
// BASE SCHEMAS - TODO: Import from Orval when backend exists
// ============================================================================

/**
 * Recurring Transaction Response Schema
 * Validates data returned from the API
 *
 * TODO: Replace with Orval-generated schema:
 * export const recurringResponseSchema = getRecurringApiV1RecurringIdGetResponse;
 */
export const recurringResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
  amount: z.number(),
  currency: currencySchema,
  frequency: frequencySchema,
  interval: z.number().int().min(1).default(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  nextOccurrence: z.string().datetime().nullable().optional(),
  lastOccurrence: z.string().datetime().nullable().optional(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  transactionType: transactionTypeSchema,
  amountModel: amountModelSchema.default('fixed'),
  // Amount model specific fields
  minAmount: z.number().nullable().optional(),
  maxAmount: z.number().nullable().optional(),
  formula: z.string().nullable().optional(),
  // Flags
  isActive: z.boolean().default(true),
  autoCreate: z.boolean().default(false),
  // Metadata
  profileId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Recurring Transaction Create Schema
 *
 * TODO: Replace with Orval-generated schema:
 * export const recurringCreateSchema = createRecurringApiV1RecurringPostBody;
 */
export const recurringCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: currencySchema,
  frequency: frequencySchema,
  interval: z.number().int().min(1).default(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  accountId: z.string().uuid('Account is required'),
  categoryId: z.string().uuid().optional(),
  transactionType: transactionTypeSchema,
  amountModel: amountModelSchema.default('fixed'),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  formula: z.string().optional(),
  isActive: z.boolean().default(true),
  autoCreate: z.boolean().default(false),
});

/**
 * Recurring Transaction Update Schema
 *
 * TODO: Replace with Orval-generated schema:
 * export const recurringUpdateSchema = updateRecurringApiV1RecurringIdPutBody;
 */
export const recurringUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  amount: z.number().min(0.01).optional(),
  currency: currencySchema.optional(),
  frequency: frequencySchema.optional(),
  interval: z.number().int().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  transactionType: transactionTypeSchema.optional(),
  amountModel: amountModelSchema.optional(),
  minAmount: z.number().nullable().optional(),
  maxAmount: z.number().nullable().optional(),
  formula: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  autoCreate: z.boolean().optional(),
});

/**
 * Recurring Transaction List Response Schema
 *
 * TODO: Replace with Orval-generated schema:
 * export const recurringListSchema = listRecurringApiV1RecurringGetResponse;
 */
export const recurringListSchema = z.object({
  items: z.array(recurringResponseSchema),
  total: z.number().int().min(0),
});

/**
 * Recurring Occurrence Schema
 */
export const recurringOccurrenceSchema = z.object({
  id: z.string().uuid(),
  recurringId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  executedDate: z.string().datetime().nullable().optional(),
  status: occurrenceStatusSchema,
  amount: z.number(),
  transactionId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ============================================================================
// UI-SPECIFIC SCHEMAS
// ============================================================================

/**
 * Recurring Query Filters Schema
 */
export const recurringFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  transactionType: transactionTypeSchema.optional(),
  frequency: frequencySchema.optional(),
  isActive: z.boolean().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

/**
 * Form schema for create mode with refined validation
 */
export const recurringFormCreateSchema = recurringCreateSchema.refine(
  (data) => {
    // If amount model is variable, min and max are required
    if (data.amountModel === 'variable_within_range') {
      return data.minAmount !== undefined && data.maxAmount !== undefined;
    }
    return true;
  },
  {
    message: 'Min and max amounts are required for variable range model',
    path: ['minAmount'],
  }
);

/**
 * Form schema for edit mode
 */
export const recurringFormUpdateSchema = recurringUpdateSchema;
