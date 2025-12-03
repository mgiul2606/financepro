import { defineConfig } from 'orval';

/**
 * Orval Configuration for Finance Pro
 *
 * Pipeline: Pydantic Models → OpenAPI → TypeScript (Orval)
 * Single Source of Truth: Backend Pydantic models
 *
 * Generated artifacts:
 * - TypeScript interfaces from OpenAPI schemas
 * - React Query hooks for all API endpoints
 * - Type-safe API client with custom Axios instance
 */
export default defineConfig({
  financepro: {
    input: {
      target: './openapi.json',
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
      },
      bundler: {
        esbuild: {
          target: 'esnext',
        },
      },
    },
  },
});
