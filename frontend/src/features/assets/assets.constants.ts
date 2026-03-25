// features/assets/assets.constants.ts

import {
  Building,
  Car,
  TrendingUp,
  Gem,
  Bitcoin,
  Package,
  HelpCircle,
  Landmark,
  BarChart3,
  Watch,
  Diamond,
  type LucideIcon,
} from 'lucide-react';
import type { AssetType } from './assets.types';

/**
 * Available currency options for assets
 */
export const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'settings.currencies.EUR' },
  { value: 'USD', label: 'settings.currencies.USD' },
  { value: 'GBP', label: 'settings.currencies.GBP' },
  { value: 'CHF', label: 'settings.currencies.CHF' },
  { value: 'JPY', label: 'settings.currencies.JPY' },
] as const;

/**
 * Available asset type options - matches backend AssetType enum
 */
export const ASSET_TYPE_OPTIONS = [
  { value: 'real_estate', label: 'assets.types.real_estate' },
  { value: 'vehicle', label: 'assets.types.vehicle' },
  { value: 'stock', label: 'assets.types.stock' },
  { value: 'bond', label: 'assets.types.bond' },
  { value: 'fund', label: 'assets.types.fund' },
  { value: 'etf', label: 'assets.types.etf' },
  { value: 'precious_metal', label: 'assets.types.precious_metal' },
  { value: 'crypto', label: 'assets.types.crypto' },
  { value: 'artwork', label: 'assets.types.artwork' },
  { value: 'jewelry', label: 'assets.types.jewelry' },
  { value: 'watch', label: 'assets.types.watch' },
  { value: 'other', label: 'assets.types.other' },
] as const;

/**
 * Available valuation method options
 */
export const VALUATION_METHOD_OPTIONS = [
  { value: 'manual', label: 'assets.valuationMethods.manual' },
  { value: 'market_quote', label: 'assets.valuationMethods.market_quote' },
  { value: 'range', label: 'assets.valuationMethods.range' },
  { value: 'comparative', label: 'assets.valuationMethods.comparative' },
  { value: 'appraisal', label: 'assets.valuationMethods.appraisal' },
] as const;

/**
 * Icon mapping for asset types
 */
export const ASSET_TYPE_ICONS: Record<AssetType, LucideIcon> = {
  real_estate: Building,
  vehicle: Car,
  stock: TrendingUp,
  bond: Landmark,
  fund: BarChart3,
  etf: BarChart3,
  precious_metal: Gem,
  crypto: Bitcoin,
  artwork: Package,
  jewelry: Diamond,
  watch: Watch,
  other: HelpCircle,
};

/**
 * Color mapping for asset types (Tailwind classes)
 */
export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  real_estate: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  vehicle: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  stock: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  bond: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  fund: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  etf: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  precious_metal: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  crypto: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  artwork: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  jewelry: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  watch: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

/**
 * Badge variant mapping for asset types
 */
export const ASSET_TYPE_BADGE_VARIANTS: Record<
  AssetType,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  real_estate: 'default',
  vehicle: 'secondary',
  stock: 'default',
  bond: 'default',
  fund: 'default',
  etf: 'default',
  precious_metal: 'secondary',
  crypto: 'outline',
  artwork: 'outline',
  jewelry: 'outline',
  watch: 'outline',
  other: 'secondary',
};
