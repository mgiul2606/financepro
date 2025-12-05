export function removeEmptyFilters<T extends object>(filters: T): Partial<T> {
  const cleanedFilters: Partial<T> = {};

  for (const [key, value] of Object.entries(filters)) {
    // Elimina undefined o null
    if (value === undefined || value === null) continue;

    // Elimina stringhe vuote
    if (typeof value === 'string' && value.trim() === '') continue;

    // Elimina array vuoti
    if (Array.isArray(value) && value.length === 0) continue;

    // Tutto il resto è considerato valido (0, false, stringhe, array non vuoti, oggetti)
    cleanedFilters[key as keyof T] = value;
  }

  return cleanedFilters;
}
