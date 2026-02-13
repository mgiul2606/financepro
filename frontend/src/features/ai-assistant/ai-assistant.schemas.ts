/**
 * AI Assistant schemas with runtime validation using Zod
 *
 * Mix of Orval-generated schemas and frontend UI schemas
 */
import { z } from 'zod';

// Backend API Request/Response Schemas
export const classificationRequestSchema = z.object({
  transactionId: z.string().uuid(),
  description: z.string(),
  amount: z.number(),
  merchantName: z.string().optional(),
  transactionDate: z.string(),
});

export const classificationResultSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  confidence: z.number().min(0).max(1),
  suggestedTags: z.array(z.string()).optional(),
  explanation: z.string().optional(),
});

export const chatMessageRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  financialProfileId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const chatMessageResponseSchema = z.object({
  message: z.string(),
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const optimizationInsightsRequestSchema = z.object({
  financialProfileId: z.string().uuid(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional(),
  categories: z.array(z.string()).optional(),
});

// Frontend UI Schemas
export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);
export const messageTypeSchema = z.enum(['text', 'chart', 'table', 'action', 'insight']);
export const actionTypeSchema = z.enum([
  'create_budget',
  'create_goal',
  'categorize_transaction',
  'generate_report',
  'optimize_spending',
]);

// Chart data schema for pie and line charts
export const chartDataItemSchema = z.object({
  category: z.string().optional(),
  amount: z.number().optional(),
  month: z.string().optional(),
  balance: z.number().optional(),
  name: z.string().optional(),
  value: z.number().optional(),
});

export const chartDataSchema = z.object({
  chartType: z.enum(['pie', 'line', 'bar']).optional(),
  data: z.array(chartDataItemSchema).optional(),
  prediction: z.object({
    expected: z.number(),
    min: z.number(),
    max: z.number(),
    confidence: z.number().min(0).max(1),
  }).optional(),
  factors: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
});

export const assistantActionSchema = z.object({
  type: actionTypeSchema,
  title: z.string(),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  suggestedValues: z.record(z.string(), z.unknown()).optional(),
});

export const aiInsightSchema = z.object({
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string(),
  relatedData: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const chatMessageMetadataSchema = z.object({
  chartData: chartDataSchema.optional(),
  tableData: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
  actionData: assistantActionSchema.optional(),
  insightData: aiInsightSchema.optional(),
});

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  role: messageRoleSchema,
  type: messageTypeSchema,
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: chatMessageMetadataSchema.optional(),
});

export const quickQueryCategorySchema = z.enum([
  'spending',
  'income',
  'budget',
  'insights',
  'predictions',
]);

export const quickQuerySchema = z.object({
  id: z.string(),
  label: z.string(),
  query: z.string(),
  icon: z.string(),
  category: quickQueryCategorySchema,
});

export const assistantCapabilitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
  icon: z.string(),
});

export const aiServiceStatusSchema = z.object({
  isAvailable: z.boolean(),
  modelVersion: z.string().optional(),
  lastUpdated: z.string().datetime().optional(),
  capabilities: z.array(z.string()).optional(),
});

// Transaction classification schemas
export const transactionToClassifySchema = z.object({
  id: z.string(),
  amount: z.number(),
  description: z.string(),
  merchant: z.string().optional(),
  date: z.string(),
  accountId: z.string(), // UUID string, consistent with the rest of the app
});

export const classificationSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  confirmedByUser: z.boolean().optional(),
});

export const alternativeCategorySchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const classificationResultUISchema = z.object({
  transactionId: z.string(),
  originalDescription: z.string().optional(),
  classification: classificationSchema,
  alternativeCategories: z.array(alternativeCategorySchema).optional(),
});

export const classificationBatchSchema = z.object({
  results: z.array(classificationResultUISchema),
  averageConfidence: z.number().min(0).max(1),
});

export const explanationTypeSchema = z.enum([
  'classification',
  'anomaly',
  'prediction',
  'suggestion',
]);

export const explanationRequestSchema = z.object({
  transactionId: z.string().optional(),
  category: z.string().optional(),
  anomalyId: z.string().optional(),
  type: explanationTypeSchema,
});

export const assistantResponseSchema = z.object({
  message: z.string(),
  type: messageTypeSchema,
  suggestions: z.array(z.string()).optional(),
  actions: z.array(assistantActionSchema).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});
