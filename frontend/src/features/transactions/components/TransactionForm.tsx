import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TransactionCreate, TransactionType } from "@/api/generated/models"
import { useCategories } from "@/features/categories"
import { useAccounts } from "@/features/accounts"
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "../schemas/transactionSchema"

/**
 * Transaction Form Component with shadcn/ui + React Hook Form + Zod
 * - Uses generated types from OpenAPI (Pydantic models)
 * - Client-side validation via Zod schema
 * - Accessible form components from shadcn/ui
 * - Follows DRY principles with reusable form patterns
 */

export interface TransactionFormProps {
  onSubmit: (data: TransactionCreate) => void
  onCancel?: () => void
  initialData?: Partial<TransactionCreate>
  isLoading?: boolean
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { t } = useTranslation()
  const { categories, isLoading: categoriesLoading } = useCategories()
  const { accounts, isLoading: accountsLoading } = useAccounts()

  // Initialize form with Zod validation
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transaction_type: TransactionType.purchase,
      currency: "EUR",
      transaction_date: new Date().toISOString().split("T")[0],
      category_id: null,
      merchant_name: null,
      notes: null,
      ...initialData,
    },
    mode: "onChange",
  })

  // DRY: Transaction type options with i18n
  const transactionTypeOptions = [
    { value: TransactionType.income, label: t("transactions.types.income") },
    { value: TransactionType.salary, label: t("transactions.types.salary") },
    { value: TransactionType.dividend, label: t("transactions.types.dividend") },
    { value: TransactionType.refund, label: t("transactions.types.refund") },
    { value: TransactionType.purchase, label: t("transactions.types.purchase") },
    { value: TransactionType.payment, label: t("transactions.types.payment") },
    { value: TransactionType.withdrawal, label: t("transactions.types.withdrawal") },
    { value: TransactionType.bank_transfer, label: t("transactions.types.bank_transfer") },
    { value: TransactionType.internal_transfer, label: t("transactions.types.internal_transfer") },
    { value: TransactionType.fee, label: t("transactions.types.fee") },
    { value: TransactionType.tax, label: t("transactions.types.tax") },
    { value: TransactionType.other, label: t("transactions.types.other") },
  ] as const

  const handleFormSubmit = (data: TransactionFormValues) => {
    // Transform form data to TransactionCreate (handle null vs undefined)
    const payload: TransactionCreate = {
      ...data,
      category_id: data.category_id || undefined,
      merchant_name: data.merchant_name || undefined,
      notes: data.notes || undefined,
    }
    onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Transaction Type & Amount Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="transaction_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.type")} *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("transactions.selectType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transactionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.amount")} *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t("transactions.amountPlaceholder")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("transactions.description")} *</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("transactions.descriptionPlaceholder")}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category & Transaction Date Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.category")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                  disabled={isLoading || categoriesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categoriesLoading
                            ? "Loading categories..."
                            : t("transactions.categoryPlaceholder")
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transaction_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.date")} *</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Merchant Name */}
        <FormField
          control={form.control}
          name="merchant_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("transactions.merchant")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("transactions.merchantPlaceholder")}
                  disabled={isLoading}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account & Currency Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("transactions.accountId")} *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading || accountsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          accountsLoading
                            ? "Loading accounts..."
                            : "Select an account"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.account_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("accounts.currency")} *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="EUR"
                    disabled={isLoading}
                    maxLength={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("transactions.notes")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("transactions.notesPlaceholder")}
                  disabled={isLoading}
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Submitting..."
              : initialData
              ? t("transactions.updateTransaction")
              : t("transactions.createTransaction")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
