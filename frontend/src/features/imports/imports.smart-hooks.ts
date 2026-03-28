/**
 * React hooks for the Smart CSV Import feature.
 * Uses direct axios calls since these endpoints are not yet in the Orval-generated code.
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { getListImportJobsApiV1ImportsGetQueryKey } from '@/api/generated/imports/imports';
import type { SmartPreviewData, SmartConfirmResult } from './imports.smart-types';

export const useSmartImport = () => {
  const queryClient = useQueryClient();

  const [preview, setPreview] = useState<SmartPreviewData | null>(null);
  const [confirmResult, setConfirmResult] = useState<SmartConfirmResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const analyze = useCallback(
    async (file: File, accountId: string, profileId: string) => {
      setIsAnalyzing(true);
      setAnalyzeError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('account_id', accountId);
        formData.append('financial_profile_id', profileId);

        const response = await api.post<SmartPreviewData>(
          '/api/v1/import/csv/preview',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        setPreview(response.data);
        return response.data;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to analyze CSV file';
        setAnalyzeError(message);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const confirm = useCallback(
    async (
      jobId: string,
      userOverrides: Record<string, { category?: string; action?: string }>,
      importFlagged: boolean,
    ) => {
      setIsImporting(true);
      setImportError(null);
      try {
        const response = await api.post<SmartConfirmResult>(
          '/api/v1/import/csv/confirm',
          {
            jobId,
            userOverrides: Object.keys(userOverrides).length > 0 ? userOverrides : undefined,
            importFlagged,
          },
        );

        setConfirmResult(response.data);

        // Invalidate import jobs list cache
        queryClient.invalidateQueries({
          queryKey: getListImportJobsApiV1ImportsGetQueryKey(),
        });

        return response.data;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to import transactions';
        setImportError(message);
        throw err;
      } finally {
        setIsImporting(false);
      }
    },
    [queryClient],
  );

  const reset = useCallback(() => {
    setPreview(null);
    setConfirmResult(null);
    setAnalyzeError(null);
    setImportError(null);
  }, []);

  return {
    preview,
    confirmResult,
    isAnalyzing,
    isImporting,
    analyzeError,
    importError,
    analyze,
    confirm,
    reset,
  };
};
