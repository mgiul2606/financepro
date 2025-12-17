/**
 * Orval v8 Input Transformer
 * Converte i nomi delle proprietà degli schema da snake_case a camelCase
 */
import type { OpenAPIObject } from 'openapi3-ts/oas30';  // <-- cambia da oas31 a oas30

/**
 * Converte una stringa da snake_case a camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Verifica se una stringa è in snake_case
 */
function isSnakeCase(str: string): boolean {
  return str.includes('_') && str === str.toLowerCase();
}

/**
 * Trasforma ricorsivamente un oggetto generico convertendo le chiavi delle proprietà
 */
function transformObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformObject) as T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    let transformedValue: unknown;

    if (key === 'properties' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const propsObject: Record<string, unknown> = {};
      for (const [propName, propValue] of Object.entries(value)) {
        const newPropName = isSnakeCase(propName) ? snakeToCamel(propName) : propName;
        propsObject[newPropName] = transformObject(propValue);
      }
      transformedValue = propsObject;
    } else if (key === 'required' && Array.isArray(value)) {
      transformedValue = value.map((name: unknown) =>
        typeof name === 'string' && isSnakeCase(name) ? snakeToCamel(name) : name
      );
    } else {
      transformedValue = transformObject(value);
    }

    result[key] = transformedValue;
  }

  return result as T;
}

/**
 * Transformer principale per Orval
 */
export default function transformer(inputSchema: OpenAPIObject): OpenAPIObject {
  return transformObject(structuredClone(inputSchema));
}