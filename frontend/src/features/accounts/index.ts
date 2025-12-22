// features/accounts/index.ts
/**
 * Public API for accounts feature
 * Exports components, hooks, types, schemas, and API functions
 */

// Pages
export { AccountsPage } from './pages/AccountsPage';

// Components
export { AccountForm } from './components/AccountForm';

// Hooks
export {
  useAccounts,
  useAccount,
  useAccountBalance,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from './accounts.hooks';

// API functions - Now using Orval-generated hooks directly
// To use API functions directly, import from '@/api/generated/accounts/accounts'

// Schemas
export {
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

// Types
export type {
  AccountCreate,
  AccountUpdate,
  AccountResponse,
  AccountBalance,
  AccountList,
  AccountFilters,
  AccountWithStats,
  AccountStatus,
  AccountStatusInfo,
  AccountType,
  Currency,
} from './accounts.types';

// Constants
export { ACCOUNT_TYPE_OPTIONS, CURRENCY_OPTIONS } from './accounts.types';
