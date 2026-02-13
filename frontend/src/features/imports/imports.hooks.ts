/**
 * React Query hooks for Import operations
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetImportJobApiV1ImportsJobIdGet,
  useImportCsvApiV1ImportsPost,
  usePreviewImportApiV1ImportsPreviewPost,
  useDeleteImportJobApiV1ImportsJobIdDelete,
  getListImportJobsApiV1ImportsGetQueryKey,
  listImportJobsApiV1ImportsGet,
  type listImportJobsApiV1ImportsGetResponse,
} from '@/api/generated/imports/imports';
import type {
  ImportJobResponse,
  ImportJobListResponse,
  ListImportJobsApiV1ImportsGetParams,
  BodyImportCsvApiV1ImportsPost,
  BodyPreviewImportApiV1ImportsPreviewPost,
  ImportPreviewResponse,
  ImportResultResponse,
} from '@/api/generated/models';
import { useProfileContext } from '@/contexts/ProfileContext';
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';

/**
 * Base hook for listing import jobs across multiple profiles
 * Created using the multi-profile list hook factory
 */
const useImportJobsBase = createMultiProfileListHook<
  ListImportJobsApiV1ImportsGetParams,
  listImportJobsApiV1ImportsGetResponse,
  ImportJobResponse
>({
  getQueryKey: getListImportJobsApiV1ImportsGetQueryKey,
  queryFn: listImportJobsApiV1ImportsGet,
  extractItems: (response) => (response.data as ImportJobListResponse)?.items,
  extractTotal: (response) => (response.data as ImportJobListResponse)?.total,
  mapProfileToParams: (profileId) => ({ profile_id: profileId }),
});

/**
 * Hook to list all import jobs
 * Fetches import jobs from all active profiles and aggregates the results
 */
export const useImports = () => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const result = useImportJobsBase(activeProfileIds, {
    enabled: !profileLoading,
  });

  return {
    imports: result.items,
    total: result.total,
    isLoading: result.isLoading || profileLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Base hook for getting a single import job by ID
 * Created using the GET by ID hook factory
 */
const useImportJobBase = createGetByIdHook<
  { data: ImportJobResponse; status: number },
  ImportJobResponse
>({
  useQuery: useGetImportJobApiV1ImportsJobIdGet,
});

/**
 * Hook to get a single import job by ID
 */
export const useImportJob = (jobId: string) => {
  const result = useImportJobBase(jobId);

  return {
    importJob: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

/**
 * Hook to create a new import (upload CSV file)
 */
export const useCreateImport = () => {
  const queryClient = useQueryClient();

  const mutation = useImportCsvApiV1ImportsPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListImportJobsApiV1ImportsGetQueryKey(),
        });
      },
    },
  });

  const uploadFile = async (data: BodyImportCsvApiV1ImportsPost) => {
    const result = await mutation.mutateAsync({ data });
    return result.data as ImportResultResponse;
  };

  return {
    uploadFile,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    error: mutation.error,
    data: mutation.data?.data as ImportResultResponse | undefined,
    reset: mutation.reset,
  };
};

/**
 * Hook to preview an import before processing
 */
export const usePreviewImport = () => {
  const mutation = usePreviewImportApiV1ImportsPreviewPost();

  const previewFile = async (data: BodyPreviewImportApiV1ImportsPreviewPost) => {
    const result = await mutation.mutateAsync({ data });
    return result.data as ImportPreviewResponse;
  };

  return {
    previewFile,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPreviewing: mutation.isPending,
    error: mutation.error,
    preview: mutation.data?.data as ImportPreviewResponse | undefined,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete an import job
 */
export const useDeleteImport = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteImportJobApiV1ImportsJobIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListImportJobsApiV1ImportsGetQueryKey(),
        });
      },
    },
  });

  const deleteImport = async (jobId: string, deleteTransactions = false) => {
    await mutation.mutateAsync({
      jobId,
      params: { delete_transactions: deleteTransactions },
    });
  };

  return {
    deleteImport,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Helper function to calculate progress percentage
 */
export const calculateProgress = (
  processedRows: number | null | undefined,
  totalRows: number | null | undefined
): number => {
  if (!totalRows || totalRows === 0) return 0;
  if (!processedRows) return 0;
  return Math.round((processedRows / totalRows) * 100);
};

/**
 * Helper function to normalize import job for display
 */
export const normalizeImportJob = (job: ImportJobResponse) => ({
  id: job.id,
  fileName: job.fileName,
  status: job.status,
  totalRows: job.totalRows ?? 0,
  processedRows: job.processedRows ?? 0,
  successfulImports: job.successfulImports ?? 0,
  failedImports: job.failedImports ?? 0,
  skippedDuplicates: job.skippedDuplicates ?? 0,
  createdAt: job.createdAt,
  completedAt: job.completedAt ?? null,
  progressPercentage: calculateProgress(job.processedRows, job.totalRows),
});
