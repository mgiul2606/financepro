// lib/form-utils.ts

/**
 * Safely converts a field value to a non-null string
 * Handles null and undefined values by returning empty string
 *
 * @param value - The field value to convert
 * @returns A safe string value (never null or undefined)
 */
export function safeFieldValue(value: string | null | undefined): string {
  return value ?? '';
}

/**
 * Builds a clean update payload by removing undefined and empty string values
 * This ensures only fields with actual values are sent in update requests
 *
 * @param data - The raw form data
 * @param fields - Array of field names to include in the payload
 * @returns A clean object with only defined values
 */
export function buildUpdatePayload<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): Partial<T> {
  const payload: Partial<T> = {};

  for (const field of fields) {
    const value = data[field];

    // Include the field if it has a value
    if (value !== undefined && value !== null) {
      // Convert empty strings to undefined for optional fields
      if (typeof value === 'string' && value === '') {
        payload[field] = undefined as T[keyof T];
      } else {
        payload[field] = value;
      }
    }
  }

  return payload;
}
