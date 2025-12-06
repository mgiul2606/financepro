import { z } from "zod"
import { TransactionType } from "@/api/generated/models"

/**
 * Zod schema for Transaction creation/update
 * Mirrors backend Pydantic model with client-side validation
 * Compatible with Zod v4.x
 */
export const transactionFormSchema = z.object({
  account_id: z.string().min(1, "Account is required"),

  category_id: z.string().optional().nullable(),

  transaction_type: z.enum([
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
  ] as const).describe("Transaction type is required"),

  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .min(0.01, "Amount must be at least 0.01"),

  currency: z.string()
    .length(3, "Currency must be exactly 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency must be 3 uppercase letters (e.g., EUR, USD)"),

  description: z.string()
    .min(1, "Description cannot be empty")
    .max(500, "Description is too long (max 500 characters)"),

  merchant_name: z.string().max(255, "Merchant name is too long").optional().nullable(),

  transaction_date: z.string().min(1, "Transaction date is required"),

  notes: z.string().max(1000, "Notes are too long (max 1000 characters)").optional().nullable(),

  value_date: z.string().optional().nullable(),

  location: z.string().max(255, "Location is too long").optional().nullable(),

  receipt_url: z.string().url("Must be a valid URL").optional().nullable(),

  created_by: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
