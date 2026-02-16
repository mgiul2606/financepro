/**
 * Profile schemas with runtime validation using Zod
 *
 * Bridges Orval-generated schemas with application-specific needs
 */
import { z } from 'zod';
import { ProfileType, DatabaseType } from '@/api/generated/models';

// Import auto-generated Zod schemas from Orval
import {
  CreateProfileApiV1ProfilesPostBody,
  UpdateProfileApiV1ProfilesProfileIdPatchBody,
  GetProfileApiV1ProfilesProfileIdGetResponse,
  ListProfilesApiV1ProfilesGetResponse,
  SetMainProfileApiV1ProfilesMainPatchBody,
} from '@/api/generated/zod/financial-profiles/financial-profiles.zod';

/**
 * Profile Type Enum Schema
 */
export const profileTypeSchema = z.enum([
  ProfileType.Personal,
  ProfileType.Business,
  ProfileType.Family,
]);

/**
 * Database Type Enum Schema
 */
export const databaseTypeSchema = z.enum([
  DatabaseType.Mssql,
  DatabaseType.Postgresql,
]);

/**
 * Profile Create Schema
 * Base schema from Orval
 */
export const profileCreateSchema = CreateProfileApiV1ProfilesPostBody;

/**
 * Profile Update Schema
 * Base schema from Orval for partial updates
 */
export const profileUpdateSchema = UpdateProfileApiV1ProfilesProfileIdPatchBody;

/**
 * Profile Response Schema
 */
export const profileResponseSchema = GetProfileApiV1ProfilesProfileIdGetResponse;

/**
 * Profile List Response Schema
 */
export const profileListSchema = ListProfilesApiV1ProfilesGetResponse;

/**
 * Main Profile Update Schema
 */
export const mainProfileUpdateSchema = SetMainProfileApiV1ProfilesMainPatchBody;

/**
 * Profile Filters Schema (UI-specific)
 */
export const profileFiltersSchema = z.object({
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  isActive: z.boolean().optional(),
});
