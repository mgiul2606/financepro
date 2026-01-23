// features/assets/assets.constants.ts

import {
  Building,
  Car,
  TrendingUp,
  Gem,
  Bitcoin,
  Package,
  HelpCircle,
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
 * Available asset type options
 */
export const ASSET_TYPE_OPTIONS = [
  { value: 'property', label: 'assets.types.property' },
  { value: 'vehicle', label: 'assets.types.vehicle' },
  { value: 'investment', label: 'assets.types.investment' },
  { value: 'precious_metal', label: 'assets.types.precious_metal' },
  { value: 'crypto', label: 'assets.types.crypto' },
  { value: 'collectible', label: 'assets.types.collectible' },
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
  property: Building,
  vehicle: Car,
  investment: TrendingUp,
  precious_metal: Gem,
  crypto: Bitcoin,
  collectible: Package,
  other: HelpCircle,
};

/**
 * Color mapping for asset types (Tailwind classes)
 */
export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  property: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  vehicle: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  investment: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  precious_metal: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  crypto: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  collectible: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

/**
 * Badge variant mapping for asset types
 */
export const ASSET_TYPE_BADGE_VARIANTS: Record<
  AssetType,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  property: 'default',
  vehicle: 'secondary',
  investment: 'default',
  precious_metal: 'secondary',
  crypto: 'outline',
  collectible: 'outline',
  other: 'secondary',
};
