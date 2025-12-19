/**
 * API wrapper functions for Account endpoints
 * Provides type-safe, validated API calls using Zod schemas
 */
import {
  listAccountsApiV1AccountsGet,
  getAccountApiV1AccountsAccountIdGet,
  createAccountApiV1AccountsPost,
  updateAccountApiV1AccountsAccountIdPut,
  deleteAccountApiV1AccountsAccountIdDelete,
  getAccountBalanceApiV1AccountsAccountIdBalanceGet,
} from '@/api/generated/accounts/accounts';

import {
  accountCreateSchema,
  accountUpdateSchema,
  accountResponseSchema,
  accountListSchema,
  accountBalanceSchema,
  accountFiltersSchema,
} from './accounts.schemas';

import type {
  AccountCreate,
  AccountUpdate,
  AccountResponse,
  AccountList,
  AccountBalance,
  AccountFilters,
} from './accounts.types';

/**
 * Fetch all accounts with optional filters
 */
export const fetchAccounts = async (
  filters?: AccountFilters
): Promise<AccountList> => {
  // Validate input
  const validatedFilters = filters
    ? accountFiltersSchema.parse(filters)
    : undefined;

  // Make API call
  const response = await listAccountsApiV1AccountsGet(validatedFilters);

  // Validate and return response
  return accountListSchema.parse(response.data);
};

/**
 * Fetch a single account by ID
 */
export const fetchAccount = async (
  accountId: string
): Promise<AccountResponse> => {
  const response = await getAccountApiV1AccountsAccountIdGet(accountId);
  return accountResponseSchema.parse(response.data);
};

/**
 * Fetch account balance
 */
export const fetchAccountBalance = async (
  accountId: string
): Promise<AccountBalance> => {
  const response = await getAccountBalanceApiV1AccountsAccountIdBalanceGet(
    accountId
  );
  return accountBalanceSchema.parse(response.data);
};

/**
 * Create a new account
 */
export const createAccount = async (
  data: AccountCreate
): Promise<AccountResponse> => {
  // Validate input
  const validatedData = accountCreateSchema.parse(data);

  // Make API call
  const response = await createAccountApiV1AccountsPost({
    data: validatedData,
  });

  // Validate and return response
  return accountResponseSchema.parse(response.data);
};

/**
 * Update an existing account
 */
export const updateAccount = async (
  accountId: string,
  data: AccountUpdate
): Promise<AccountResponse> => {
  // Validate input
  const validatedData = accountUpdateSchema.parse(data);

  // Make API call
  const response = await updateAccountApiV1AccountsAccountIdPut({
    accountId,
    data: validatedData,
  });

  // Validate and return response
  return accountResponseSchema.parse(response.data);
};

/**
 * Delete an account
 */
export const deleteAccount = async (accountId: string): Promise<void> => {
  await deleteAccountApiV1AccountsAccountIdDelete({ accountId });
};
