import { Lightbulb, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardAction, CardBody, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OptimizationSuggestion } from '../optimization.types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency, formatDate } from '@/utils/currency';

export interface SuggestionCardProps {
  suggestion: OptimizationSuggestion;
  onImplement?: () => void;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

const priorityConfig = {
  low: { variant: 'info' as const, label: 'Bassa' },
  medium: { variant: 'warning' as const, label: 'Media' },
  high: { variant: 'destructive' as const, label: 'Alta' },
  critical: { variant: 'destructive' as const, label: 'Critica' },
};

const categoryLabels = {
  savings: 'Risparmio',
  subscriptions: 'Abbonamenti',
  alternatives: 'Alternative',
  timing: 'Tempistiche',
  cashflow: 'Flusso di Cassa',
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onImplement,
  onDismiss,
  onViewDetails,
}) => {
  const { preferences } = usePreferences();
  const priorityBadge = priorityConfig[suggestion.priority];

  return (
    <Card
      variant="elevated"
      className={
        suggestion.status === 'implemented'
          ? 'border-2 border-green-200 bg-income-subtle'
          : suggestion.status === 'dismissed'
          ? 'opacity-60'
          : ''
      }
    >
      <CardHeader>
        <CardTitle>
          <div className="flex items-start gap-2">
            {suggestion.status === 'implemented' ? (
              <CheckCircle2 className="h-5 w-5 text-income shrink-0 mt-0.5" />
            ) : (
              <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{suggestion.title}</span>
          </div>
        </CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {categoryLabels[suggestion.category]}
            </Badge>
            <Badge variant={priorityBadge.variant}>
              {priorityBadge.label}
            </Badge>
          </div>
        </CardAction>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">{suggestion.description}</p>

          <div className="bg-income-subtle border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-income-foreground">Risparmio Potenziale</span>
              <div className="text-right">
                <p className="text-xl font-bold text-income">
                  {formatCurrency(suggestion.potentialSavings, preferences.currency, preferences.locale)}
                </p>
                {suggestion.monthlySavings > 0 && (
                  <p className="text-xs text-income-foreground">
                    {formatCurrency(suggestion.monthlySavings, preferences.currency, preferences.locale)}/mese
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-900 mb-1">AI Insight</p>
                <p className="text-sm text-blue-800">{suggestion.aiExplanation}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Affidabilità</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${suggestion.confidence * 100}%` }}
                />
              </div>
              <span className="font-medium text-neutral-900">
                {(suggestion.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {suggestion.status === 'implemented' && suggestion.implementedAt && (
            <div className="bg-income-subtle border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-income-foreground">
                ✓ Implementato il{' '}
                {formatDate(suggestion.implementedAt, preferences.locale)}
              </p>
            </div>
          )}
        </div>
      </CardBody>
      {suggestion.status === 'active' && (
        <CardFooter className="justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Dettagli
          </Button>
          <div className="flex items-center gap-2">
            {onDismiss && (
              <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={onDismiss}>
                Ignora
              </Button>
            )}
            {onImplement && (
              <Button variant="default" size="sm" onClick={onImplement}>
                Implementa
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
