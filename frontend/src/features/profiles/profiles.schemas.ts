/**
 * Profile schemas with runtime validation using Zod
 *
 * Bridges Orval-generated schemas with application-specific needs
 */
import { z } from 'zod';
import { ProfileType, DatabaseType } from '@/api/generated/models';

// Import auto-generated Zod schemas from Orval
import {
  createProfileApiV1ProfilesPostBody,
  updateProfileApiV1ProfilesProfileIdPatchBody,
  getProfileApiV1ProfilesProfileIdGetResponse,
  listProfilesApiV1ProfilesGetResponse,
  setMainProfileApiV1ProfilesMainPatchBody,
} from '@/api/generated/zod/financial-profiles/financial-profiles.zod';

/**
 * Profile Type Enum Schema
 */
export const profileTypeSchema = z.enum([
  ProfileType.personal,
  ProfileType.business,
  ProfileType.joint,
  ProfileType.investment,
]);

/**
 * Database Type Enum Schema
 */
export const databaseTypeSchema = z.enum([
  DatabaseType.primary,
  DatabaseType.secondary,
  DatabaseType.encrypted,
]);

/**
 * Profile Create Schema
 * Base schema from Orval
 */
export const profileCreateSchema = createProfileApiV1ProfilesPostBody;

/**
 * Profile Update Schema
 * Base schema from Orval for partial updates
 */
export const profileUpdateSchema = updateProfileApiV1ProfilesProfileIdPatchBody;

/**
 * Profile Response Schema
 */
export const profileResponseSchema = getProfileApiV1ProfilesProfileIdGetResponse;

/**
 * Profile List Response Schema
 */
export const profileListSchema = listProfilesApiV1ProfilesGetResponse;

/**
 * Main Profile Update Schema
 */
export const mainProfileUpdateSchema = setMainProfileApiV1ProfilesMainPatchBody;

/**
 * Profile Filters Schema (UI-specific)
 */
export const profileFiltersSchema = z.object({
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  isActive: z.boolean().optional(),
});
