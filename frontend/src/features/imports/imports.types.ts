import { z } from 'zod';
import {
  importStatusSchema,
  importFileFormatSchema,
  importFiltersSchema,
  importJobListSchema,
  importStatusInfoSchema,
  importJobWithProgressSchema,
  importFileSchema,
} from './imports.schemas';

/**
 * Type definitions derived from Zod schemas
 * These ensure type safety across the application
 *
 * Note: ImportJobResponse, ImportResultResponse, ImportPreviewResponse,
 * and BodyImportCsvApiV1ImportsPost are imported from Orval-generated models
 * for API compatibility. Only UI-specific types are defined here.
 */

// Status types
export type ImportStatus = z.infer<typeof importStatusSchema>;
export type ImportFileFormat = z.infer<typeof importFileFormatSchema>;

// Query/Filter types
export type ImportFilters = z.infer<typeof importFiltersSchema>;

// Response types (output) - for lists and aggregations
export type ImportJobList = z.infer<typeof importJobListSchema>;

// UI-specific types
export type ImportStatusInfo = z.infer<typeof importStatusInfoSchema>;
export type ImportJobWithProgress = z.infer<typeof importJobWithProgressSchema>;

// File validation types
export type ImportFile = z.infer<typeof importFileSchema>;

/**
 * Import upload state for the upload zone component
 */
export interface ImportUploadState {
  file: File | null;
  isDragActive: boolean;
  isUploading: boolean;
  error: string | null;
}

/**
 * Import job display item for UI (normalized from API response)
 */
export interface ImportJobDisplayItem {
  id: string;
  fileName: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successfulImports: number;
  failedImports: number;
  skippedDuplicates: number;
  createdAt: string;
  completedAt: string | null;
  progressPercentage: number;
}
