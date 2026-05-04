// features/categories/useCategoryName.ts
import { useCallback } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { CategoryResponse } from '@/api/generated/models';

type CategoryLike = Pick<CategoryResponse, 'name' | 'nameTranslations'>;

/**
 * Returns a stable `getCategoryName(category)` function that resolves
 * the localized name for the current user language, falling back to `name`.
 *
 * Usage:
 *   const getCategoryName = useCategoryName();
 *   <span>{getCategoryName(category)}</span>
 */
export const useCategoryName = () => {
  const { preferences } = usePreferences();

  return useCallback(
    (category: CategoryLike): string => {
      const translations = category.nameTranslations as Record<string, string> | null | undefined;
      return translations?.[preferences.language] || category.name;
    },
    [preferences.language],
  );
};
