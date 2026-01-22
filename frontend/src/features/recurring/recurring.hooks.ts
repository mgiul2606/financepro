/**
 * React Query hooks for Recurring Transaction operations
 *
 * NOTE: Backend API for recurring transactions does not exist yet.
 * These hooks are PLACEHOLDERS that return empty/mock data.
 *
 * TODO: When backend is implemented:
 * 1. Generate Orval types and hooks from OpenAPI spec
 * 2. Import Orval-generated hooks:
 *    - useGetRecurringApiV1RecurringIdGet
 *    - useCreateRecurringApiV1RecurringPost
 *    - useUpdateRecurringApiV1RecurringIdPut
 *    - useDeleteRecurringApiV1RecurringIdDelete
 *    - getListRecurringApiV1RecurringGetQueryKey
 *    - listRecurringApiV1RecurringGet
 * 3. Follow accounts.hooks.ts pattern with factory functions
 */
import { useState, useCallback, useMemo } from 'react';
import { useProfileContext } from '@/contexts/ProfileContext';
import type {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  RecurringTransactionList,
  RecurringFilters,
  RecurringSummary,
  RecurringOccurrence,
} from './recurring.types';
import { FREQUENCY_DAYS } from './recurring.constants';

// ============================================================================
// PLACEHOLDER DATA - Remove when backend is implemented
// ============================================================================

/**
 * Mock data for development/preview purposes
 * TODO: Remove when backend API is available
 */
const MOCK_RECURRING: RecurringTransaction[] = [];

// ============================================================================
// LIST HOOKS
// ============================================================================

/**
 * Hook to list all recurring transactions
 * Fetches from all active profiles and aggregates results
 *
 * TODO: Replace with factory-based implementation when backend exists:
 * ```typescript
 * const useRecurringBase = createMultiProfileListHook<
 *   ListRecurringApiV1RecurringGetParams,
 *   listRecurringApiV1RecurringGetResponse,
 *   RecurringTransaction
 * >({
 *   getQueryKey: getListRecurringApiV1RecurringGetQueryKey,
 *   queryFn: listRecurringApiV1RecurringGet,
 *   extractItems: (response) => response.data.items,
 *   extractTotal: (response) => response.data.total,
 * });
 * ```
 */
export const useRecurring = (_filters?: RecurringFilters) => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  // Placeholder implementation - returns empty array
  // TODO: Replace with actual API call
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  const recurring = useMemo(() => {
    // Filter mock data by active profiles
    return MOCK_RECURRING.filter((r) =>
      activeProfileIds.includes(r.profileId)
    );
  }, [activeProfileIds]);

  const refetch = useCallback(() => {
    // TODO: Implement actual refetch when backend exists
    console.warn('useRecurring.refetch: Backend API not implemented');
  }, []);

  return {
    recurring,
    total: recurring.length,
    isLoading: isLoading || profileLoading,
    error,
    refetch,
  };
};

/**
 * Hook to get a single recurring transaction by ID
 *
 * TODO: Replace with factory-based implementation:
 * ```typescript
 * const useRecurringBase = createGetByIdHook<
 *   { data: RecurringTransaction; status: number },
 *   RecurringTransaction
 * >({
 *   useQuery: useGetRecurringApiV1RecurringIdGet,
 * });
 * ```
 */
export const useRecurringById = (recurringId: string) => {
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Placeholder - find in mock data
  const recurring = useMemo(() => {
    return MOCK_RECURRING.find((r) => r.id === recurringId) ?? null;
  }, [recurringId]);

  const refetch = useCallback(() => {
    console.warn('useRecurringById.refetch: Backend API not implemented');
  }, []);

  return {
    recurring,
    isLoading,
    error,
    refetch,
  };
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new recurring transaction
 *
 * TODO: Replace with factory-based implementation:
 * ```typescript
 * const useCreateRecurringBase = createCreateMutationHook<
 *   CreateRecurringApiV1RecurringPostMutationResult,
 *   RecurringTransactionCreate
 * >({
 *   useMutation: useCreateRecurringApiV1RecurringPost,
 *   defaultOptions: {
 *     invalidateKeys: getListRecurringApiV1RecurringGetQueryKey(),
 *   },
 * });
 * ```
 */
export const useCreateRecurring = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRecurring = useCallback(
    async (_data: RecurringTransactionCreate): Promise<RecurringTransaction> => {
      setIsCreating(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        console.warn('useCreateRecurring: Backend API not implemented');
        throw new Error('Backend API not implemented. Please implement recurring endpoints first.');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    createRecurring,
    isCreating,
    error,
    reset,
  };
};

/**
 * Hook to update an existing recurring transaction
 *
 * TODO: Replace with factory-based implementation:
 * ```typescript
 * const useUpdateRecurringBase = createUpdateMutationHook<
 *   UpdateRecurringApiV1RecurringIdPutMutationResult,
 *   RecurringTransactionUpdate,
 *   ExtractOrvalData<UpdateRecurringApiV1RecurringIdPutMutationResult>,
 *   'recurringId'
 * >({
 *   useMutation: useUpdateRecurringApiV1RecurringIdPut,
 *   idParamName: 'recurringId',
 *   defaultOptions: {
 *     invalidateKeys: getListRecurringApiV1RecurringGetQueryKey(),
 *   },
 * });
 * ```
 */
export const useUpdateRecurring = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateRecurring = useCallback(
    async (
      _recurringId: string,
      _data: RecurringTransactionUpdate
    ): Promise<RecurringTransaction> => {
      setIsUpdating(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        console.warn('useUpdateRecurring: Backend API not implemented');
        throw new Error('Backend API not implemented. Please implement recurring endpoints first.');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateRecurring,
    isUpdating,
    error,
    reset,
  };
};

/**
 * Hook to delete a recurring transaction
 *
 * TODO: Replace with factory-based implementation:
 * ```typescript
 * const useDeleteRecurringBase = createDeleteMutationHook<
 *   DeleteRecurringApiV1RecurringIdDeleteMutationResult,
 *   'recurringId'
 * >({
 *   useMutation: useDeleteRecurringApiV1RecurringIdDelete,
 *   idParamName: 'recurringId',
 *   defaultOptions: {
 *     invalidateKeys: getListRecurringApiV1RecurringGetQueryKey(),
 *   },
 * });
 * ```
 */
export const useDeleteRecurring = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteRecurring = useCallback(async (_recurringId: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      console.warn('useDeleteRecurring: Backend API not implemented');
      throw new Error('Backend API not implemented. Please implement recurring endpoints first.');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    deleteRecurring,
    isDeleting,
    error,
    reset,
  };
};

// ============================================================================
// OCCURRENCE HOOKS - For managing individual occurrences
// ============================================================================

/**
 * Hook to get occurrences for a recurring transaction
 *
 * TODO: Implement when backend API supports occurrences endpoint
 */
export const useRecurringOccurrences = (recurringId: string) => {
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Placeholder - returns empty array
  const occurrences = useMemo<RecurringOccurrence[]>(() => {
    console.warn(`useRecurringOccurrences(${recurringId}): Backend API not implemented`);
    return [];
  }, [recurringId]);

  const refetch = useCallback(() => {
    console.warn('useRecurringOccurrences.refetch: Backend API not implemented');
  }, []);

  return {
    occurrences,
    total: 0,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to skip an occurrence
 *
 * TODO: Implement when backend API supports skip endpoint
 */
export const useSkipOccurrence = () => {
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const skipOccurrence = useCallback(
    async (_occurrenceId: string, _reason?: string): Promise<void> => {
      setIsSkipping(true);
      setError(null);

      try {
        console.warn('useSkipOccurrence: Backend API not implemented');
        throw new Error('Backend API not implemented');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsSkipping(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    skipOccurrence,
    isSkipping,
    error,
    reset,
  };
};

/**
 * Hook to override an occurrence with a different amount
 *
 * TODO: Implement when backend API supports override endpoint
 */
export const useOverrideOccurrence = () => {
  const [isOverriding, setIsOverriding] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const overrideOccurrence = useCallback(
    async (_occurrenceId: string, _newAmount: number): Promise<void> => {
      setIsOverriding(true);
      setError(null);

      try {
        console.warn('useOverrideOccurrence: Backend API not implemented');
        throw new Error('Backend API not implemented');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsOverriding(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    overrideOccurrence,
    isOverriding,
    error,
    reset,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to calculate summary statistics for recurring transactions
 */
export const useRecurringSummary = (): RecurringSummary => {
  const { recurring } = useRecurring();

  return useMemo(() => {
    const activeRecurring = recurring.filter((r) => r.isActive);
    const pausedRecurring = recurring.filter((r) => !r.isActive);

    // Calculate monthly equivalent for each recurring transaction
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
