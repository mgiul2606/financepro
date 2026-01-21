/**
 * Constants for the categories feature
 *
 * NOTE: Categories are USER-level resources, shared across all profiles.
 */

/**
 * Default category icon options for the UI
 * Uses emoji icons for simplicity and cross-platform support
 */
export const CATEGORY_ICON_OPTIONS = [
  { value: '🛒', label: 'categories.icons.shopping' },
  { value: '🍔', label: 'categories.icons.food' },
  { value: '🚗', label: 'categories.icons.transport' },
  { value: '🏠', label: 'categories.icons.home' },
  { value: '💊', label: 'categories.icons.health' },
  { value: '🎬', label: 'categories.icons.entertainment' },
  { value: '📚', label: 'categories.icons.education' },
  { value: '👔', label: 'categories.icons.clothing' },
  { value: '✈️', label: 'categories.icons.travel' },
  { value: '💼', label: 'categories.icons.work' },
  { value: '💰', label: 'categories.icons.salary' },
  { value: '📈', label: 'categories.icons.investment' },
  { value: '🎁', label: 'categories.icons.gifts' },
  { value: '💡', label: 'categories.icons.utilities' },
  { value: '📱', label: 'categories.icons.tech' },
  { value: '🏋️', label: 'categories.icons.fitness' },
  { value: '🐕', label: 'categories.icons.pets' },
  { value: '💅', label: 'categories.icons.beauty' },
  { value: '🔧', label: 'categories.icons.maintenance' },
  { value: '📦', label: 'categories.icons.other' },
] as const;

/**
 * Default category color options for the UI
 * Uses hex color codes with i18n labels
 */
export const CATEGORY_COLOR_OPTIONS = [
  { value: '#EF4444', label: 'categories.colors.red' },
  { value: '#F97316', label: 'categories.colors.orange' },
  { value: '#F59E0B', label: 'categories.colors.amber' },
  { value: '#EAB308', label: 'categories.colors.yellow' },
  { value: '#84CC16', label: 'categories.colors.lime' },
  { value: '#22C55E', label: 'categories.colors.green' },
  { value: '#10B981', label: 'categories.colors.emerald' },
  { value: '#14B8A6', label: 'categories.colors.teal' },
  { value: '#06B6D4', label: 'categories.colors.cyan' },
  { value: '#0EA5E9', label: 'categories.colors.sky' },
  { value: '#3B82F6', label: 'categories.colors.blue' },
  { value: '#6366F1', label: 'categories.colors.indigo' },
  { value: '#8B5CF6', label: 'categories.colors.violet' },
  { value: '#A855F7', label: 'categories.colors.purple' },
  { value: '#D946EF', label: 'categories.colors.fuchsia' },
  { value: '#EC4899', label: 'categories.colors.pink' },
  { value: '#F43F5E', label: 'categories.colors.rose' },
  { value: '#78716C', label: 'categories.colors.gray' },
] as const;

/**
 * Category type options (income vs expense)
 */
export const CATEGORY_TYPE_OPTIONS = [
  { value: false, label: 'categories.types.expense' },
  { value: true, label: 'categories.types.income' },
] as const;

/**
 * Category status options (active vs inactive)
 */
export const CATEGORY_STATUS_OPTIONS = [
  { value: true, label: 'categories.status.active' },
  { value: false, label: 'categories.status.inactive' },
] as const;
