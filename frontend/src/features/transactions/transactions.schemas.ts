import { z } from 'zod';
import { TransactionType, TransactionSource } from '@/api/generated/models';

/**
 * Transaction Type Enum Schema
 */
export const transactionTypeSchema = z.enum([
  TransactionType.bank_transfer,
  TransactionType.withdrawal,
  TransactionType.payment,
  TransactionType.purchase,
  TransactionType.internal_transfer,
  TransactionType.income,
  TransactionType.salary,
  TransactionType.invoice,
  TransactionType.asset_purchase,
  TransactionType.asset_sale,
  TransactionType.dividend,
  TransactionType.interest,
  TransactionType.loan_payment,
  TransactionType.refund,
  TransactionType.fee,
  TransactionType.tax,
  TransactionType.other,
]);

/**
 * Transaction Source Enum Schema
 */
export const transactionSourceSchema = z.enum([
  TransactionSource.manual,
  TransactionSource.import_csv,
  TransactionSource.bank_api,
  TransactionSource.ai_classified,
]);

/**
 * Currency Schema - ISO 4217
 */
export const currencySchema = z
  .string()
  .length(3, 'Currency must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters (e.g., EUR, USD)')
  .default('EUR');

/**
 * Transaction Create Schema
 */
export const transactionCreateSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),

  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),

  transactionType: transactionTypeSchema,

  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .min(0.01, 'Amount must be at least 0.01'),

  currency: currencySchema,

  description: z
    .string()
    .min(1, 'Description cannot be empty')
    .max(500, 'Description is too long (max 500 characters)'),

  merchantName: z
    .string()
    .max(255, 'Merchant name is too long')
    .optional()
    .nullable(),

  transactionDate: z.string().min(1, 'Transaction date is required'),

  notes: z
    .string()
    .max(1000, 'Notes are too long (max 1000 characters)')
    .optional()
    .nullable(),

  valueDate: z.string().optional().nullable(),

  location: z.string().max(255, 'Location is too long').optional().nullable(),

  receiptUrl: z.string().url('Must be a valid URL').optional().nullable(),

  tags: z.array(z.string()).optional(),

  source: transactionSourceSchema.default(TransactionSource.manual).optional(),
});

/**
 * Transaction Update Schema
 * All fields are optional for partial updates
 */
export const transactionUpdateSchema = z.object({
  accountId: z.string().uuid().optional(),

  categoryId: z.string().uuid().optional().nullable(),

  transactionType: transactionTypeSchema.optional(),

  amount: z.number().positive().min(0.01).optional(),

  currency: currencySchema.optional(),

  description: z.string().min(1).max(500).optional(),

  merchantName: z.string().max(255).optional().nullable(),

  transactionDate: z.string().optional(),

  notes: z.string().max(1000).optional().nullable(),

  valueDate: z.string().optional().nullable(),

  location: z.string().max(255).optional().nullable(),

  receiptUrl: z.string().url().optional().nullable(),

  tags: z.array(z.string()).optional(),
});

/**
 * Transaction Response Schema
 */
export const transactionResponseSchema = z.object({
  id: z.string().uuid(),

  accountId: z.string().uuid(),

  categoryId: z.string().uuid().nullable(),

  transactionType: transactionTypeSchema,

  amount: z.string(), // API returns as string

  currency: z.string().length(3),

  description: z.string(),

  merchantName: z.string().nullable(),

  transactionDate: z.string(),

  valueDate: z.string().nullable(),

  notes: z.string().nullable(),

  location: z.string().nullable(),

  receiptUrl: z.string().nullable(),

  tags: z.array(z.string()).optional(),

  source: transactionSourceSchema,

  isReconciled: z.boolean().optional().default(false),

  createdAt: z.string().datetime(),

  updatedAt: z.string().datetime(),
});

/**
 * Transaction List Response Schema
 */
export const transactionListSchema = z.object({
  items: z.array(transactionResponseSchema),
  total: z.number().int().min(0),
  skip: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).optional(),
});

/**
 * Transaction Filters Schema
 */
export const transactionFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  transactionType: transactionTypeSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  search: z.string().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

/**
 * Transaction Stats Schema
 */
export const transactionStatsSchema = z.object({
  totalIncome: z.string(),
  totalExpenses: z.string(),
  netBalance: z.string(),
  transactionCount: z.number().int(),
  currency: z.string().length(3),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});
