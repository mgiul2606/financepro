import { defineConfig } from 'orval';
import snakeToCamelTransformer from './orvalTransformer'

/**
 * Orval Configuration for Finance Pro
 *
 * Pipeline: Pydantic Models → OpenAPI → TypeScript + Zod (Orval)
 * Single Source of Truth: Backend Pydantic models
 *
 * Generated artifacts:
 * - TypeScript interfaces from OpenAPI schemas
 * - React Query hooks for all API endpoints
 * - Zod schemas for runtime validation
 * - Type-safe API client with custom Axios instance
 */
export default defineConfig({
  // React Query + TypeScript types
  financepro: {
    input: {
      target: './openapi.json',
      override: {
        transformer: snakeToCamelTransformer
      }
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      mock: false,
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: false,
          signal: true,
        },
        namingConvention: {
          enum: 'PascalCase',
        },
      },
      bundler: {
        esbuild: {
          target: 'esnext',
        },
      },
    },
  },

  // Zod schemas for runtime validation
  financepro_zod: {
    input: {
      target: './openapi.json',
      override: {
        transformer: snakeToCamelTransformer
      }
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/zod/index.ts',
      client: 'zod',
      mock: false,
      clean: true,
      prettier: true,
      fileExtension: '.zod.ts',
      override: {
        namingConvention: {
          enum: 'PascalCase',
        },
      },
    },
  },
});
