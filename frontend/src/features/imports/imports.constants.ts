// features/imports/imports.constants.ts

import { ImportStatus } from '@/api/generated/models';
import type { ImportStatusInfo } from './imports.types';

/**
 * Import status options for filters and dropdowns
 */
export const IMPORT_STATUS_OPTIONS = [
  { value: ImportStatus.Pending, label: 'imports.status.pending' },
  { value: ImportStatus.Processing, label: 'imports.status.processing' },
  { value: ImportStatus.Completed, label: 'imports.status.completed' },
  { value: ImportStatus.Failed, label: 'imports.status.failed' },
  { value: ImportStatus.Partial, label: 'imports.status.partial' },
] as const;

/**
 * Supported file formats for import
 */
export const SUPPORTED_FORMATS = ['.csv', '.xlsx', '.xls'] as const;

/**
 * Supported MIME types for file input accept attribute
 */
export const SUPPORTED_MIME_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;

/**
 * File input accept attribute value
 */
export const FILE_ACCEPT = '.csv,.xlsx,.xls';

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum file size display string
 */
export const MAX_FILE_SIZE_DISPLAY = '10MB';

/**
 * Status to variant mapping for badges
 */
export const STATUS_VARIANT_MAP: Record<string, ImportStatusInfo['variant']> = {
  [ImportStatus.Pending]: 'info',
  [ImportStatus.Processing]: 'warning',
  [ImportStatus.Completed]: 'success',
  [ImportStatus.Failed]: 'danger',
  [ImportStatus.Partial]: 'warning',
} as const;

/**
 * Status to label mapping for display
 */
export const STATUS_LABEL_MAP: Record<string, string> = {
  [ImportStatus.Pending]: 'imports.status.pending',
  [ImportStatus.Processing]: 'imports.status.processing',
  [ImportStatus.Completed]: 'imports.status.completed',
  [ImportStatus.Failed]: 'imports.status.failed',
  [ImportStatus.Partial]: 'imports.status.partial',
} as const;

/**
 * Default pagination limit for import jobs list
 */
export const DEFAULT_IMPORT_LIMIT = 50;

/**
 * Polling interval for in-progress imports (in ms)
 */
export const IMPORT_POLLING_INTERVAL = 3000;
