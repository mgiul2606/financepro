// features/accounts/types/index.ts

import { AccountResponse } from '@/api/generated/models';

/**
 * Re-export types from generated models for convenience
 */
export type {
  AccountResponse,
  AccountCreate,
  AccountUpdate,
  AccountList,
  AccountBalance,
} from '@/api/generated/models';

/**
 * Extended types for UI-specific needs
 */
export interface AccountWithStats extends AccountResponse {
  change: number;
  changePercentage: number;
}

export type AccountStatus = 'overdrawn' | 'low' | 'normal' | 'high';

export interface AccountStatusInfo {
  status: AccountStatus;
  label: string;
  variant: 'error' | 'warning' | 'default' | 'success';
}
