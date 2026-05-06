import type { ColorScheme } from '@/core/components/composite/StatCard';

export type StatVariant = 'balance' | 'budget' | 'goals' | 'trend';

export const STAT_CARD_COLORS: Record<StatVariant, ColorScheme> = {
  balance: { border: 'border-indigo-600', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
  budget: { border: 'border-amber-500', iconBg: 'bg-amber-100', iconText: 'text-amber-500' },
  goals: { border: 'border-income', iconBg: 'bg-income-subtle', iconText: 'text-income' },
  trend: { border: 'border-violet-600', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
};
