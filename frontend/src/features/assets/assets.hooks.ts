/**
 * React Query hooks for Asset operations
 *
 * PLACEHOLDER IMPLEMENTATION:
 * These hooks use mock data because the Orval-generated API hooks
 * are not yet available. When the backend API is implemented and
 * Orval generates the hooks, replace the placeholder implementations
 * with the real hook factory patterns.
 *
 * TODO: Replace with real implementations when API is available:
 *
 * import {
 *   useGetAssetApiV1AssetsAssetIdGet,
 *   useCreateAssetApiV1AssetsPost,
 *   useUpdateAssetApiV1AssetsAssetIdPut,
 *   useDeleteAssetApiV1AssetsAssetIdDelete,
 *   getListAssetsApiV1AssetsGetQueryKey,
 *   listAssetsApiV1AssetsGet,
 * } from '@/api/generated/assets/assets';
 *
 * Then use hook factories:
 * - createMultiProfileListHook for useAssets
 * - createGetByIdHook for useAsset
 * - createCreateMutationHook for useCreateAsset
 * - createUpdateMutationHook for useUpdateAsset
 * - createDeleteMutationHook for useDeleteAsset
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AssetResponse, AssetCreate, AssetUpdate, AssetList } from './assets.types';

// Query key for cache invalidation
export const ASSETS_QUERY_KEY = ['assets'] as const;

/**
 * Hook to list all assets
 *
 * PLACEHOLDER: Returns empty array until API is implemented
 *
 * TODO: Replace with real implementation:
 * const useAssetsBase = createMultiProfileListHook<
 *   ListAssetsApiV1AssetsGetParams,
 *   listAssetsApiV1AssetsGetResponse,
 *   AssetResponse
 * >({
 *   getQueryKey: getListAssetsApiV1AssetsGetQueryKey,
 *   queryFn: listAssetsApiV1AssetsGet,
 *   extractItems: (response) => (response.data as AssetList)?.assets,
 *   extractTotal: (response) => (response.data as AssetList)?.total,
 * });
 */
export const useAssets = () => {
  // TODO: Replace with useProfileContext and real hook
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Placeholder: empty assets array
  const assets: AssetResponse[] = [];
  const total = 0;

  return {
    assets,
    total,
    isLoading,
    error,
    refetch: () => {
      // TODO: Implement refetch when API is available
    },
  };
};

/**
 * Hook to get a single asset by ID
 *
 * PLACEHOLDER: Returns undefined until API is implemented
 *
 * TODO: Replace with real implementation:
 * const useAssetBase = createGetByIdHook<
 *   { data: AssetResponse; status: number },
 *   AssetResponse
 * >({
 *   useQuery: useGetAssetApiV1AssetsAssetIdGet,
 * });
 */
export const useAsset = (assetId: string) => {
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Placeholder: no asset data
  const asset: AssetResponse | undefined = undefined;

  return {
    asset,
    isLoading: isLoading || !assetId,
    error,
    refetch: () => {
      // TODO: Implement refetch when API is available
    },
  };
};

/**
 * Hook to create a new asset
 *
 * PLACEHOLDER: Simulates creation until API is implemented
 *
 * TODO: Replace with real implementation:
 * const useCreateAssetBase = createCreateMutationHook<
 *   CreateAssetApiV1AssetsPostMutationResult,
 *   AssetCreate
 * >({
 *   useMutation: useCreateAssetApiV1AssetsPost,
 *   defaultOptions: {
 *     invalidateKeys: getListAssetsApiV1AssetsGetQueryKey(),
 *   },
 * });
 */
export const useCreateAsset = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const createAsset = useCallback(
    async (data: AssetCreate): Promise<AssetResponse> => {
      setIsCreating(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Create mock response
        const newAsset: AssetResponse = {
          id: crypto.randomUUID(),
          financialProfileId: crypto.randomUUID(),
          name: data.name,
          assetType: data.assetType,
          purchaseDate: data.purchaseDate ?? null,
          purchasePrice: data.purchasePrice?.toString() ?? null,
          currentValue: data.currentValue.toString(),
          currentValueMin: data.currentValueMin?.toString() ?? null,
          currentValueMax: data.currentValueMax?.toString() ?? null,
          valuationMethod: data.valuationMethod ?? 'manual',
          lastValuationDate: null,
          currency: data.currency,
          isLiquid: data.isLiquid ?? false,
          quantity: data.quantity?.toString() ?? null,
          tickerSymbol: data.tickerSymbol ?? null,
          notes: data.notes ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });

        return newAsset;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create asset');
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [queryClient]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    createAsset,
    isCreating,
    error,
    reset,
  };
};

/**
 * Hook to update an existing asset
 *
 * PLACEHOLDER: Simulates update until API is implemented
 *
 * TODO: Replace with real implementation:
 * const useUpdateAssetBase = createUpdateMutationHook<
 *   UpdateAssetApiV1AssetsAssetIdPutMutationResult,
 *   AssetUpdate,
 *   ExtractOrvalData<UpdateAssetApiV1AssetsAssetIdPutMutationResult>,
 *   'assetId'
 * >({
 *   useMutation: useUpdateAssetApiV1AssetsAssetIdPut,
 *   idParamName: 'assetId',
 *   defaultOptions: {
 *     invalidateKeys: getListAssetsApiV1AssetsGetQueryKey(),
 *   },
 * });
 */
export const useUpdateAsset = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const updateAsset = useCallback(
    async (assetId: string, data: AssetUpdate): Promise<AssetResponse> => {
      setIsUpdating(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Create mock response (in real implementation, this would be the server response)
        const updatedAsset: AssetResponse = {
          id: assetId,
          financialProfileId: crypto.randomUUID(),
          name: data.name ?? 'Updated Asset',
          assetType: data.assetType ?? 'other',
          purchaseDate: data.purchaseDate ?? null,
          purchasePrice: data.purchasePrice?.toString() ?? null,
          currentValue: data.currentValue?.toString() ?? '0',
          currentValueMin: data.currentValueMin?.toString() ?? null,
          currentValueMax: data.currentValueMax?.toString() ?? null,
          valuationMethod: data.valuationMethod ?? 'manual',
          lastValuationDate: null,
          currency: data.currency ?? 'EUR',
          isLiquid: data.isLiquid ?? false,
          quantity: data.quantity?.toString() ?? null,
          tickerSymbol: data.tickerSymbol ?? null,
          notes: data.notes ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });

        return updatedAsset;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update asset');
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [queryClient]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateAsset,
    isUpdating,
    error,
    reset,
  };
};

/**
 * Hook to delete an asset
 *
 * PLACEHOLDER: Simulates deletion until API is implemented
 *
 * TODO: Replace with real implementation:
 * const useDeleteAssetBase = createDeleteMutationHook<
 *   DeleteAssetApiV1AssetsAssetIdDeleteMutationResult,
 *   'assetId'
 * >({
 *   useMutation: useDeleteAssetApiV1AssetsAssetIdDelete,
 *   idParamName: 'assetId',
 *   defaultOptions: {
 *     invalidateKeys: getListAssetsApiV1AssetsGetQueryKey(),
 *   },
 * });
 */
export const useDeleteAsset = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const deleteAsset = useCallback(
    async (assetId: string): Promise<void> => {
      setIsDeleting(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete asset');
        setError(error);
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [queryClient]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    deleteAsset,
    isDeleting,
    error,
    reset,
  };
};
