/**
 * Asset schemas with runtime validation using Zod
 *
 * This file defines schemas for the assets feature:
 * - Base schemas for asset types and valuation methods
 * - Response schemas matching the backend model
 * - Form validation schemas for create/edit operations
 * - Filter schemas for queries
 *
 * TODO: When Orval generates asset API schemas, import and re-export them here:
 * import {
 *   createAssetApiV1AssetsPostBody,
 *   updateAssetApiV1AssetsAssetIdPutBody,
 *   getAssetApiV1AssetsAssetIdGetResponse,
 *   listAssetsApiV1AssetsGetResponse,
 * } from '@/api/generated/zod/assets/assets.zod';
 */
import { z } from 'zod';

/**
 * Asset Type Enum Schema
 * Matches backend AssetType enum
 */
export const assetTypeSchema = z.enum([
  'property',
  'vehicle',
  'investment',
  'precious_metal',
  'crypto',
  'collectible',
  'other',
]);

/**
 * Valuation Method Enum Schema
 * Matches backend ValuationMethod enum
 */
export const valuationMethodSchema = z.enum([
  'manual',
  'market_quote',
  'range',
  'comparative',
  'appraisal',
]);

/**
 * Currency Schema - ISO 4217 currency code
 */
export const currencySchema = z
  .string()
  .length(3, 'Currency must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters (e.g., EUR, USD)')
  .default('EUR');

/**
 * Asset Response Schema
 * Validates data returned from the API
 *
 * TODO: Replace with Orval-generated schema when API is available
 */
export const assetResponseSchema = z.object({
  id: z.string().uuid(),
  financialProfileId: z.string().uuid(),
  name: z.string().min(1),
  assetType: assetTypeSchema,
  purchaseDate: z.string().nullable().optional(),
  purchasePrice: z.string().nullable().optional(),
  currentValue: z.string(),
  currentValueMin: z.string().nullable().optional(),
  currentValueMax: z.string().nullable().optional(),
  valuationMethod: valuationMethodSchema,
  lastValuationDate: z.string().nullable().optional(),
  currency: z.string(),
  isLiquid: z.boolean(),
  quantity: z.string().nullable().optional(),
  tickerSymbol: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Asset List Response Schema
 *
 * TODO: Replace with Orval-generated schema when API is available
 */
export const assetListSchema = z.object({
  assets: z.array(assetResponseSchema),
  total: z.number().int().min(0),
});

/**
 * Asset Create Schema
 * Used for validating create form submissions
 *
 * TODO: Replace with Orval-generated schema when API is available
 */
export const assetCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  assetType: assetTypeSchema,
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  currentValue: z.number().min(0, 'Current value is required'),
  currentValueMin: z.number().min(0).optional(),
  currentValueMax: z.number().min(0).optional(),
  valuationMethod: valuationMethodSchema.default('manual'),
  currency: currencySchema,
  isLiquid: z.boolean().default(false),
  quantity: z.number().min(0).optional(),
  tickerSymbol: z.string().max(20).optional(),
  notes: z.string().optional(),
});

/**
 * Asset Update Schema
 * Used for validating update form submissions (all fields optional)
 *
 * TODO: Replace with Orval-generated schema when API is available
 */
export const assetUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .optional(),
  assetType: assetTypeSchema.optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  currentValueMin: z.number().min(0).optional(),
  currentValueMax: z.number().min(0).optional(),
  valuationMethod: valuationMethodSchema.optional(),
  currency: currencySchema.optional(),
  isLiquid: z.boolean().optional(),
  quantity: z.number().min(0).optional(),
  tickerSymbol: z.string().max(20).optional(),
  notes: z.string().optional(),
});

/**
 * Asset Form Schema
 * Combined schema for create/edit forms with proper validation messages
 */
export const assetFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  assetType: assetTypeSchema,
  purchaseDate: z.string().optional(),
  purchasePrice: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) || 0 : val))
    .optional(),
  currentValue: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) || 0 : val)),
  valuationMethod: valuationMethodSchema.default('manual'),
  currency: currencySchema,
  // Handle both boolean and string values for form compatibility
  isLiquid: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val === 'true';
      }
      return val;
    })
    .default(false),
  quantity: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    })
    .optional(),
  tickerSymbol: z.string().max(20).optional(),
  notes: z.string().optional(),
});

/**
 * Asset Query Filters Schema
 */
export const assetFiltersSchema = z.object({
  profileId: z.string().uuid().optional(),
  skip: z.number().int().min(0).default(0).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  assetType: assetTypeSchema.optional(),
  isLiquid: z.boolean().optional(),
});
