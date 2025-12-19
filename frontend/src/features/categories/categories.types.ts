import { z } from 'zod';
import {
  categoryResponseSchema,
  categoryListSchema,
  categoryFiltersSchema,
} from './categories.schemas';

export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type Category = CategoryResponse;
export type CategoryList = z.infer<typeof categoryListSchema>;
export type CategoryFilters = z.infer<typeof categoryFiltersSchema>;
