import { defineConfig } from 'orval';

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
    },
  },
  'financepro-zod': {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      mode: 'single',
      target: './src/api/generated/zod.ts',
      client: 'zod',
      clean: false,
      prettier: true,
      fileExtension: '.ts',
    },
  },
});
