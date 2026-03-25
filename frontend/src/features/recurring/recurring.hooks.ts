/**
 * React Query hooks for Recurring Transaction operations
 *
 * Uses direct API calls via the axios instance.
 * Transforms backend camelCase field names to match frontend types.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { useProfileContext } from '@/contexts/ProfileContext';
import type {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  RecurringSummary,
} from './recurring.types';
import { FREQUENCY_DAYS } from './recurring.constants';

// Query key for cache invalidation
export const RECURRING_QUERY_KEY = ['recurring'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackendRecurring = Record<string, any>;

/**
 * Map backend response fields to frontend type fields.
 * Backend uses CamelCaseModel which serializes snake_case → camelCase,
 * but some field names differ from what the frontend expects.
 */
function mapBackendToFrontend(item: BackendRecurring): RecurringTransaction {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    amount: Number(item.baseAmount),
    currency: item.currency,
    frequency: item.frequency,
    interval: item.interval ?? 1,
    startDate: item.startDate,
    endDate: item.endDate ?? null,
    nextOccurrence: item.nextOccurrenceDate ?? null,
    lastOccurrence: null,
    accountId: item.accountId,
    categoryId: item.categoryId ?? null,
    transactionType: item.transactionType,
    amountModel: item.amountModel ?? 'fixed',
    minAmount: item.amountMin != null ? Number(item.amountMin) : null,
    maxAmount: item.amountMax != null ? Number(item.amountMax) : null,
    formula: item.formula ?? null,
    isActive: item.isActive ?? true,
    autoCreate: item.autoCreate ?? false,
    profileId: item.financialProfileId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * Map frontend create payload to backend field names.
 */
function mapCreateToBackend(
  data: RecurringTransactionCreate,
  profileId: string
): Record<string, unknown> {
  return {
    financialProfileId: profileId,
    accountId: data.accountId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description,
    transactionType: data.transactionType,
    amountModel: data.amountModel ?? 'fixed',
    baseAmount: data.amount,
    amountMin: data.minAmount,
    amountMax: data.maxAmount,
    formula: data.formula,
    currency: data.currency,
    frequency: data.frequency,
    interval: data.interval ?? 1,
    startDate: data.startDate,
    endDate: data.endDate,
    isActive: data.isActive ?? true,
    autoCreate: data.autoCreate ?? false,
  };
}

/**
 * Map frontend update payload to backend field names.
 */
function mapUpdateToBackend(data: RecurringTransactionUpdate): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.name !== undefined) result.name = data.name;
  if (data.description !== undefined) result.description = data.description;
  if (data.accountId !== undefined) result.accountId = data.accountId;
  if (data.categoryId !== undefined) result.categoryId = data.categoryId;
  if (data.transactionType !== undefined) result.transactionType = data.transactionType;
  if (data.amountModel !== undefined) result.amountModel = data.amountModel;
  if (data.amount !== undefined) result.baseAmount = data.amount;
  if (data.minAmount !== undefined) result.amountMin = data.minAmount;
  if (data.maxAmount !== undefined) result.amountMax = data.maxAmount;
  if (data.formula !== undefined) result.formula = data.formula;
  if (data.currency !== undefined) result.currency = data.currency;
  if (data.frequency !== undefined) result.frequency = data.frequency;
  if (data.interval !== undefined) result.interval = data.interval;
  if (data.startDate !== undefined) result.startDate = data.startDate;
  if (data.endDate !== undefined) result.endDate = data.endDate;
  if (data.isActive !== undefined) result.isActive = data.isActive;
  if (data.autoCreate !== undefined) result.autoCreate = data.autoCreate;
  return result;
}

/**
 * Hook to list all recurring transactions across active profiles
 */
export const useRecurring = () => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const query = useQuery({
    queryKey: [...RECURRING_QUERY_KEY, activeProfileIds],
    queryFn: async () => {
      const results = await Promise.all(
        activeProfileIds.map((profileId) =>
          api.get<{ items: BackendRecurring[]; total: number }>('/api/v1/recurring/', {
            params: { profile_id: profileId },
          })
        )
      );

      const allItems = results.flatMap((res) => res.data.items ?? []);
      return allItems.map(mapBackendToFrontend);
    },
    enabled: !profileLoading && activeProfileIds.length > 0,
  });

  return {
    recurring: query.data ?? [],
    total: query.data?.length ?? 0,
    isLoading: query.isLoading || profileLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get a single recurring transaction by ID
 */
export const useRecurringById = (recurringId: string) => {
  const query = useQuery({
    queryKey: [...RECURRING_QUERY_KEY, recurringId],
    queryFn: async () => {
      const res = await api.get<BackendRecurring>(`/api/v1/recurring/${recurringId}`);
      return mapBackendToFrontend(res.data);
    },
    enabled: !!recurringId,
  });

  return {
    recurring: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new recurring transaction
 */
export const useCreateRecurring = () => {
  const queryClient = useQueryClient();
  const { mainProfileId } = useProfileContext();

  const mutation = useMutation({
    mutationFn: async (data: RecurringTransactionCreate): Promise<RecurringTransaction> => {
      const payload = mapCreateToBackend(data, mainProfileId!);
      const res = await api.post<BackendRecurring>('/api/v1/recurring/', payload);
      return mapBackendToFrontend(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
    },
  });

  return {
    createRecurring: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing recurring transaction
 */
export const useUpdateRecurring = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      recurringId,
      data,
    }: {
      recurringId: string;
      data: RecurringTransactionUpdate;
    }): Promise<RecurringTransaction> => {
      const payload = mapUpdateToBackend(data);
      const res = await api.patch<BackendRecurring>(`/api/v1/recurring/${recurringId}`, payload);
      return mapBackendToFrontend(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
    },
  });

  return {
    updateRecurring: async (
      recurringId: string,
      data: RecurringTransactionUpdate
    ): Promise<RecurringTransaction> => {
      return mutation.mutateAsync({ recurringId, data });
    },
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete a recurring transaction
 */
export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (recurringId: string): Promise<void> => {
      await api.delete(`/api/v1/recurring/${recurringId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
    },
  });

  return {
    deleteRecurring: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to calculate summary statistics for recurring transactions
 */
export const useRecurringSummary = (): RecurringSummary => {
  const { recurring } = useRecurring();

  return useMemo(() => {
    const activeRecurring = recurring.filter((r) => r.isActive);
    const pausedRecurring = recurring.filter((r) => !r.isActive);

    const calculateMonthlyEquivalent = (r: RecurringTransaction): number => {
      const daysInFrequency = FREQUENCY_DAYS[r.frequency] || 30;
      const monthlyMultiplier = 30 / (daysInFrequency * r.interval);
      return r.amount * monthlyMultiplier;
    };

    const monthlyIncome = activeRecurring
      .filter((r) => r.transactionType === 'income')
      .reduce((sum, r) => sum + calculateMonthlyEquivalent(r), 0);

    const monthlyExpenses = activeRecurring
      .filter((r) => r.transactionType === 'expense')
      .reduce((sum, r) => sum + calculateMonthlyEquivalent(r), 0);

    return {
      monthlyIncome,
      monthlyExpenses,
      netMonthly: monthlyIncome - monthlyExpenses,
      activeCount: activeRecurring.length,
      pausedCount: pausedRecurring.length,
    };
  }, [recurring]);
};

/**
 * Hook to toggle active status of a recurring transaction
 */
export const useToggleRecurringStatus = () => {
  const { updateRecurring, isUpdating, error, reset } = useUpdateRecurring();

  const toggleStatus = useCallback(
    async (recurringId: string, currentStatus: boolean) => {
      return updateRecurring(recurringId, { isActive: !currentStatus });
    },
    [updateRecurring]
  );

  return {
    toggleStatus,
    isToggling: isUpdating,
    error,
    reset,
  };
};
