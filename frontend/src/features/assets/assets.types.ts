import { z } from 'zod';
import {
  assetListSchema,
  assetFiltersSchema,
  assetResponseSchema,
  assetTypeSchema,
  valuationMethodSchema,
} from './assets.schemas';

/**
 * Type definitions derived from Zod schemas
 * These ensure type safety across the application
 *
 * Note: When Orval generates the asset API, these types should be replaced
 * with the generated types. For now, we define placeholder types that match
 * the expected backend model structure.
 *
 * TODO: Replace with Orval-generated types when API is available:
 * - AssetCreate from @/api/generated/models
 * - AssetUpdate from @/api/generated/models
 * - AssetResponse from @/api/generated/models
 */

// Query/Filter types
export type AssetFilters = z.infer<typeof assetFiltersSchema>;

// Response types (output) - for lists and aggregations
export type AssetList = z.infer<typeof assetListSchema>;

// Asset Response type (matches backend model)
export type AssetResponse = z.infer<typeof assetResponseSchema>;

// Utility types
export type AssetType = z.infer<typeof assetTypeSchema>;
export type ValuationMethod = z.infer<typeof valuationMethodSchema>;

/**
 * Asset Create type
 * Used for creating new assets via API
 *
 * TODO: Replace with Orval-generated AssetCreate when API is available
 */
export interface AssetCreate {
  name: string;
  assetType: AssetType;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue: number;
  currentValueMin?: number;
  currentValueMax?: number;
  valuationMethod?: ValuationMethod;
  currency: string;
  isLiquid?: boolean;
  quantity?: number;
  tickerSymbol?: string;
  notes?: string;
}

/**
 * Asset Update type
 * Used for updating existing assets via API
 *
 * TODO: Replace with Orval-generated AssetUpdate when API is available
 */
export interface AssetUpdate {
  name?: string;
  assetType?: AssetType;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  currentValueMin?: number;
  currentValueMax?: number;
  valuationMethod?: ValuationMethod;
  currency?: string;
  isLiquid?: boolean;
  quantity?: number;
  tickerSymbol?: string;
  notes?: string;
}

/**
 * Asset with computed statistics for UI display
 */
export interface AssetWithStats extends AssetResponse {
  /** Value change since purchase */
  change: number;
  /** Percentage change since purchase */
  changePercentage: number;
}
