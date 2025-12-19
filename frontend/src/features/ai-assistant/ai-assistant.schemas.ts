import { z } from 'zod';

/**
 * AI Assistant Schemas
 * Mix of backend API schemas and frontend UI schemas
 */

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
  metadata: z.record(z.any()).optional(),
});

export const chatMessageResponseSchema = z.object({
  message: z.string(),
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
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

export const assistantActionSchema = z.object({
  type: actionTypeSchema,
  title: z.string(),
  description: z.string(),
  parameters: z.record(z.any()).optional(),
  suggestedValues: z.record(z.any()).optional(),
});

export const aiInsightSchema = z.object({
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string(),
  relatedData: z.array(z.any()).optional(),
});

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  role: messageRoleSchema,
  type: messageTypeSchema,
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.object({
    chartData: z.any().optional(),
    tableData: z.any().optional(),
    actionData: assistantActionSchema.optional(),
    insightData: aiInsightSchema.optional(),
  }).optional(),
});

export const quickQuerySchema = z.object({
  id: z.string(),
  label: z.string(),
  query: z.string(),
  icon: z.string(),
  category: z.enum(['spending', 'income', 'budget', 'insights', 'predictions']),
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
