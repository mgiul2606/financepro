import { z } from 'zod';

/**
 * Shared pagination schema for list queries
 */
export const paginationParamsSchema = z.object({
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

/**
 * Pagination metadata returned by API
 */
export const paginationMetaSchema = z.object({
  total: z.number().int().min(0),
  skip: z.number().int().min(0),
  limit: z.number().int().min(1),
  hasMore: z.boolean().optional(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
