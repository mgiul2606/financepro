/**
 * Import schemas with runtime validation using Zod
 *
 * This file bridges Orval-generated schemas with application-specific needs:
 * - Imports base Zod schemas auto-generated from OpenAPI spec
 * - Provides simple, friendly aliases for generated schemas
 * - Extends schemas with custom validation messages for i18n
 * - Defines UI-specific schemas not present in the API
 */
import { z } from 'zod';
import { ImportStatus } from '@/api/generated/models';

// Import auto-generated Zod schemas from Orval
import {
  listImportJobsApiV1ImportsGetQueryParams,
  listImportJobsApiV1ImportsGetResponse,
  importCsvApiV1ImportsPostBody,
  previewImportApiV1ImportsPreviewPostBody,
  previewImportApiV1ImportsPreviewPostResponse,
  getImportJobApiV1ImportsJobIdGetResponse,
} from '@/api/generated/zod/imports/imports.zod';

/**
 * Import Status Enum Schema
 */
export const importStatusSchema = z.enum([
  ImportStatus.Pending,
  ImportStatus.Processing,
  ImportStatus.Completed,
  ImportStatus.Failed,
  ImportStatus.Partial,
]);

/**
 * Supported file formats for import
 */
export const importFileFormatSchema = z.enum(['csv', 'xlsx', 'xls']);

/**
 * Import Job Response Schema
 * Validates data returned from the API for a single import job
 */
export const importJobResponseSchema = getImportJobApiV1ImportsJobIdGetResponse;

/**
 * Import Job List Response Schema
 * Validates data returned from the API for list of import jobs
 */
export const importJobListSchema = listImportJobsApiV1ImportsGetResponse;

/**
 * Import Query Filters Schema
 * Base schema from Orval for filtering import jobs
 */
export const importFiltersSchema = listImportJobsApiV1ImportsGetQueryParams;

/**
 * Import CSV Body Schema
 * Validates the request body for CSV import
 */
export const importCsvSchema = importCsvApiV1ImportsPostBody;

/**
 * Import Preview Body Schema
 * Validates the request body for previewing an import
 */
export const importPreviewSchema = previewImportApiV1ImportsPreviewPostBody;

/**
 * Import Preview Response Schema
 * Validates the response from import preview
 */
export const importPreviewResponseSchema = previewImportApiV1ImportsPreviewPostResponse;

/**
 * Import File Validation Schema
 * Validates file before upload (format, size)
 */
export const importFileSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      return validExtensions.includes(extension);
    },
    { message: 'File must be CSV, XLSX, or XLS format' }
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB max
    { message: 'File size must be less than 10MB' }
  ),
});

/**
 * Import Status Info Schema (for UI)
 * Maps status to display properties
 */
export const importStatusInfoSchema = z.object({
  status: importStatusSchema,
  label: z.string(),
  variant: z.enum(['success', 'danger', 'warning', 'info', 'default']),
});

/**
 * Import Job with UI Extensions Schema
 * Extends the base import job with computed UI fields
 */
export const importJobWithProgressSchema = importJobResponseSchema.extend({
  progressPercentage: z.number().min(0).max(100),
});
