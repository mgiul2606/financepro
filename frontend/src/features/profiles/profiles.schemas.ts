import { z } from 'zod';
import { ProfileType, DatabaseType } from '@/api/generated/models';

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
 */
export const profileCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Profile name is required')
    .max(100, 'Profile name is too long'),

  description: z
    .string()
    .max(500, 'Description is too long')
    .optional()
    .nullable(),

  profileType: profileTypeSchema.default(ProfileType.personal),

  databaseType: databaseTypeSchema.default(DatabaseType.primary).optional(),

  encryptionKey: z.string().optional().nullable(),

  isActive: z.boolean().default(true).optional(),
});

/**
 * Profile Update Schema
 */
export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  description: z.string().max(500).optional().nullable(),

  profileType: profileTypeSchema.optional(),

  isActive: z.boolean().optional(),
});

/**
 * Profile Response Schema
 */
export const profileResponseSchema = z.object({
  id: z.string().uuid(),

  userId: z.string().uuid(),

  name: z.string(),

  description: z.string().nullable(),

  profileType: profileTypeSchema,

  databaseType: databaseTypeSchema,

  isActive: z.boolean(),

  isMainProfile: z.boolean(),

  createdAt: z.string().datetime(),

  updatedAt: z.string().datetime(),
});

/**
 * Profile List Response Schema
 */
export const profileListSchema = z.object({
  items: z.array(profileResponseSchema),
  total: z.number().int().min(0),
});

/**
 * Profile Filters Schema
 */
export const profileFiltersSchema = z.object({
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Main Profile Update Schema
 */
export const mainProfileUpdateSchema = z.object({
  mainProfileId: z.string().uuid('Invalid profile ID'),
});
