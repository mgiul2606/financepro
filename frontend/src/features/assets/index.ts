// features/assets/index.ts
/**
 * Public API for assets feature
 * Exports components, hooks, types, schemas, and constants
 */

// Pages
export { AssetsPage } from './pages/AssetsPage';

// Components
export { AssetForm } from './components/AssetForm';

// Hooks
export {
  useAssets,
  useAsset,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  ASSETS_QUERY_KEY,
} from './assets.hooks';

// Schemas
export {
  assetTypeSchema,
  valuationMethodSchema,
  currencySchema,
  assetResponseSchema,
  assetListSchema,
  assetCreateSchema,
  assetUpdateSchema,
  assetFormSchema,
  assetFiltersSchema,
} from './assets.schemas';

// Types - Local types for UI and validation
export type {
  AssetResponse,
  AssetCreate,
  AssetUpdate,
  AssetList,
  AssetFilters,
  AssetType,
  ValuationMethod,
  AssetWithStats,
} from './assets.types';

// Constants
export {
  CURRENCY_OPTIONS,
  ASSET_TYPE_OPTIONS,
  VALUATION_METHOD_OPTIONS,
  ASSET_TYPE_ICONS,
  ASSET_TYPE_COLORS,
  ASSET_TYPE_BADGE_VARIANTS,
} from './assets.constants';
