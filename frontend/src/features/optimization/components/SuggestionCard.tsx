import { Lightbulb, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import { Button } from '@/core/components/atomic/Button';
import type { OptimizationSuggestion } from '../optimization.types';

export interface SuggestionCardProps {
  suggestion: OptimizationSuggestion;
  onImplement?: () => void;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

const priorityConfig = {
  low: { variant: 'info' as const, label: 'Bassa' },
  medium: { variant: 'warning' as const, label: 'Media' },
  high: { variant: 'danger' as const, label: 'Alta' },
  critical: { variant: 'danger' as const, label: 'Critica' },
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
  const priorityBadge = priorityConfig[suggestion.priority];

  return (
    <Card
      variant="elevated"
      className={
        suggestion.status === 'implemented'
          ? 'border-2 border-green-200 bg-green-50'
          : suggestion.status === 'dismissed'
          ? 'opacity-60'
          : ''
      }
    >
      <CardHeader
        title={
          <div className="flex items-start gap-2">
            {suggestion.status === 'implemented' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{suggestion.title}</span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm">
              {categoryLabels[suggestion.category]}
            </Badge>
            <Badge variant={priorityBadge.variant} size="sm">
              {priorityBadge.label}
            </Badge>
          </div>
        }
      />
      <CardBody>
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">{suggestion.description}</p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900">Risparmio Potenziale</span>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">
                  €{suggestion.potentialSavings.toFixed(2)}
                </p>
                {suggestion.monthlySavings > 0 && (
                  <p className="text-xs text-green-700">
                    €{suggestion.monthlySavings.toFixed(2)}/mese
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
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
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900">
                ✓ Implementato il{' '}
                {new Date(suggestion.implementedAt).toLocaleDateString('it-IT')}
              </p>
            </div>
          )}
        </div>
      </CardBody>
      {suggestion.status === 'active' && (
        <CardFooter align="between">
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
              <Button variant="primary" size="sm" onClick={onImplement}>
                Implementa
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
