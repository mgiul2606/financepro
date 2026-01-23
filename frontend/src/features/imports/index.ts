// features/imports/index.ts
/**
 * Public API for imports feature
 * Exports components, hooks, types, schemas, and constants
 */

// Pages
export { ImportsPage } from './pages/ImportsPage';

// Components
export { ImportStatusBadge } from './components/ImportStatusBadge';
export { ImportUploadZone } from './components/ImportUploadZone';
export { ImportJobsTable } from './components/ImportJobsTable';

// Hooks
export {
  useImports,
  useImportJob,
  useCreateImport,
  usePreviewImport,
  useDeleteImport,
  calculateProgress,
  normalizeImportJob,
} from './imports.hooks';

// Schemas
export {
  importStatusSchema,
  importFileFormatSchema,
  importJobResponseSchema,
  importJobListSchema,
  importFiltersSchema,
  importCsvSchema,
  importPreviewSchema,
  importPreviewResponseSchema,
  importFileSchema,
  importStatusInfoSchema,
  importJobWithProgressSchema,
} from './imports.schemas';

// Types - Using Orval-generated types for API compatibility
export type {
  ImportJobResponse,
  ImportJobListResponse,
  ImportResultResponse,
  ImportPreviewResponse,
  BodyImportCsvApiV1ImportsPost,
  BodyPreviewImportApiV1ImportsPreviewPost,
  ListImportJobsApiV1ImportsGetParams,
  ImportStatus,
} from '@/api/generated/models';

// Types - Local types for UI and validation
export type {
  ImportStatus as ImportStatusType,
  ImportFileFormat,
  ImportFilters,
  ImportJobList,
  ImportStatusInfo,
  ImportJobWithProgress,
  ImportFile,
  ImportUploadState,
  ImportJobDisplayItem,
} from './imports.types';

// Constants
export {
  IMPORT_STATUS_OPTIONS,
  SUPPORTED_FORMATS,
  SUPPORTED_MIME_TYPES,
  FILE_ACCEPT,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_DISPLAY,
  STATUS_VARIANT_MAP,
  STATUS_LABEL_MAP,
  DEFAULT_IMPORT_LIMIT,
  IMPORT_POLLING_INTERVAL,
} from './imports.constants';
