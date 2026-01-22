/**
 * Public API for recurring transactions feature
 * Exports components, hooks, types, schemas, and constants
 *
 * NOTE: Backend API for recurring transactions does not exist yet.
 * Hooks are implemented as placeholders that return empty/mock data.
 * TODO: Update imports when backend is implemented.
 */

// Pages
export { RecurringPage } from './pages/RecurringPage';

// Components
export { RecurringForm } from './components/RecurringForm';

// Hooks
export {
  useRecurring,
  useRecurringById,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useRecurringOccurrences,
  useSkipOccurrence,
  useOverrideOccurrence,
  useRecurringSummary,
  useToggleRecurringStatus,
} from './recurring.hooks';

// Schemas
export {
  recurringResponseSchema,
  recurringCreateSchema,
  recurringUpdateSchema,
  recurringListSchema,
  recurringFiltersSchema,
  recurringOccurrenceSchema,
  frequencySchema,
  amountModelSchema,
  occurrenceStatusSchema,
  transactionTypeSchema,
  currencySchema,
  recurringFormCreateSchema,
  recurringFormUpdateSchema,
} from './recurring.schemas';

// Types
export type {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  RecurringTransactionList,
  RecurringOccurrence,
  RecurringFilters,
  RecurringWithStats,
  RecurringSummary,
  Frequency,
  AmountModel,
  OccurrenceStatus,
  TransactionType,
} from './recurring.types';

// Constants
export {
  FREQUENCY_OPTIONS,
  AMOUNT_MODEL_OPTIONS,
  OCCURRENCE_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  RECURRING_DEFAULTS,
  FREQUENCY_DAYS,
} from './recurring.constants';
