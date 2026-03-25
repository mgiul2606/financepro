/**
 * React Query hooks for Asset operations
 *
 * Uses direct API calls via the axios instance until Orval-generated
 * hooks become available.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { AssetResponse, AssetCreate, AssetUpdate } from './assets.types';

// Query key for cache invalidation
export const ASSETS_QUERY_KEY = ['assets'] as const;

/**
 * Hook to list all assets across active profiles
 */
export const useAssets = () => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const query = useQuery({
    queryKey: [...ASSETS_QUERY_KEY, activeProfileIds],
    queryFn: async () => {
      // Fetch assets for each active profile and aggregate
      const results = await Promise.all(
        activeProfileIds.map((profileId) =>
          api.get<{ items: AssetResponse[]; total: number }>(`/api/v1/assets/`, {
            params: { profile_id: profileId },
          })
        )
      );

      const allAssets = results.flatMap((res) => res.data.items ?? []);
      return allAssets;
    },
    enabled: !profileLoading && activeProfileIds.length > 0,
  });

  return {
    assets: query.data ?? [],
    total: query.data?.length ?? 0,
    isLoading: query.isLoading || profileLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get a single asset by ID
 */
export const useAsset = (assetId: string) => {
  const query = useQuery({
    queryKey: [...ASSETS_QUERY_KEY, assetId],
    queryFn: async () => {
      const res = await api.get<AssetResponse>(`/api/v1/assets/${assetId}`);
      return res.data;
    },
    enabled: !!assetId,
  });

  return {
    asset: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to create a new asset
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  const { mainProfileId } = useProfileContext();

  const mutation = useMutation({
    mutationFn: async (data: AssetCreate): Promise<AssetResponse> => {
      const payload = {
        ...data,
        financialProfileId: mainProfileId,
      };
      const res = await api.post<AssetResponse>('/api/v1/assets/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
    },
  });

  return {
    createAsset: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to update an existing asset
 */
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ assetId, data }: { assetId: string; data: AssetUpdate }): Promise<AssetResponse> => {
      const res = await api.patch<AssetResponse>(`/api/v1/assets/${assetId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
    },
  });

  return {
    updateAsset: async (assetId: string, data: AssetUpdate): Promise<AssetResponse> => {
      return mutation.mutateAsync({ assetId, data });
    },
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete an asset
 */
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (assetId: string): Promise<void> => {
      await api.delete(`/api/v1/assets/${assetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
    },
  });

  return {
    deleteAsset: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
