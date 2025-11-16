import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, Calendar } from 'lucide-react';
import { Card } from '@/core/components/atomic/Card';
import type { AnalyticOverview } from '../types';

export interface OverviewStatsProps {
  overview: AnalyticOverview;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down';
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, change, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card variant="elevated" className="h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-600 mb-2">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mb-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : null}
              <span
                className={`text-sm font-medium ${
                  change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-neutral-600'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-neutral-500">vs precedente</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const OverviewStats: React.FC<OverviewStatsProps> = ({ overview }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<DollarSign className="h-6 w-6" />}
        label="Totale Speso"
        value={`€${overview.totalSpent.toLocaleString()}`}
        change={overview.comparisonToPrevious.spent}
        trend={overview.comparisonToPrevious.spent < 0 ? 'down' : 'up'}
        color="red"
      />
      <StatCard
        icon={<CreditCard className="h-6 w-6" />}
        label="Totale Entrate"
        value={`€${overview.totalIncome.toLocaleString()}`}
        change={overview.comparisonToPrevious.income}
        trend={overview.comparisonToPrevious.income > 0 ? 'up' : 'down'}
        color="green"
      />
      <StatCard
        icon={<Target className="h-6 w-6" />}
        label="Bilancio Netto"
        value={`€${overview.netBalance.toLocaleString()}`}
        change={overview.comparisonToPrevious.balance}
        trend={overview.comparisonToPrevious.balance > 0 ? 'up' : 'down'}
        color={overview.netBalance > 0 ? 'green' : 'red'}
      />
      <StatCard
        icon={<Calendar className="h-6 w-6" />}
        label="Media Giornaliera"
        value={`€${overview.averageDaily.toFixed(2)}`}
        color="purple"
      />
    </div>
  );
};
