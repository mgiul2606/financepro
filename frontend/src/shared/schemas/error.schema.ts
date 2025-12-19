import { z } from 'zod';

/**
 * Standard API error response schema
 */
export const apiErrorSchema = z.object({
  message: z.string(),
  detail: z.string().optional(),
  code: z.string().optional(),
  field: z.string().optional(),
});

/**
 * Validation error schema (422 responses)
 */
export const validationErrorSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

export const validationErrorResponseSchema = z.object({
  detail: z.array(validationErrorSchema),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>;
