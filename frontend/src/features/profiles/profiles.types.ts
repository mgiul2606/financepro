import { z } from 'zod';
import {
  profileCreateSchema,
  profileUpdateSchema,
  profileResponseSchema,
  profileListSchema,
  profileFiltersSchema,
  mainProfileUpdateSchema,
  profileTypeSchema,
} from './profiles.schemas';

/**
 * Type definitions derived from Zod schemas
 */

// Request types (input)
export type ProfileCreate = z.infer<typeof profileCreateSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ProfileFilters = z.infer<typeof profileFiltersSchema>;
export type MainProfileUpdate = z.infer<typeof mainProfileUpdateSchema>;

// Response types (output)
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type FinancialProfile = ProfileResponse; // Alias for convenience
export type ProfileList = z.infer<typeof profileListSchema>;

// Utility types
export type ProfileType = z.infer<typeof profileTypeSchema>;

/**
 * Profile type options for UI select components
 */
export const PROFILE_TYPE_OPTIONS = [
  'personal',
  'business',
  'joint',
  'investment',
] as const;
