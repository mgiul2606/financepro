import { Target, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import { Button } from '@/core/components/atomic/Button';
import type { SavingsStrategy } from '../optimization.types';

export interface SavingsStrategyCardProps {
  strategy: SavingsStrategy;
  onStart?: () => void;
  onContinue?: () => void;
}

const difficultyConfig = {
  easy: { variant: 'success' as const, label: 'Facile' },
  medium: { variant: 'warning' as const, label: 'Media' },
  hard: { variant: 'danger' as const, label: 'Difficile' },
};

const impactConfig = {
  low: { variant: 'secondary' as const, label: 'Basso', color: '#6b7280' },
  medium: { variant: 'warning' as const, label: 'Medio', color: '#f59e0b' },
  high: { variant: 'success' as const, label: 'Alto', color: '#10b981' },
};

const statusLabels = {
  suggested: 'Suggerita',
  active: 'Attiva',
  completed: 'Completata',
  abandoned: 'Abbandonata',
};

export const SavingsStrategyCard: React.FC<SavingsStrategyCardProps> = ({
  strategy,
  onStart,
  onContinue,
}) => {
  const completedSteps = strategy.steps.filter((s) => s.completed).length;
  const totalSteps = strategy.steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const isActive = strategy.status === 'active';
  const isCompleted = strategy.status === 'completed';

  return (
    <Card
      variant={isActive ? 'bordered' : 'default'}
      className={
        isCompleted ? 'border-2 border-green-200 bg-green-50/30' : isActive ? 'border-blue-300' : ''
      }
    >
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Target className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-neutral-600'}`} />
            <span>{strategy.title}</span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant={difficultyConfig[strategy.difficulty].variant} size="sm">
              {difficultyConfig[strategy.difficulty].label}
            </Badge>
            <Badge variant={impactConfig[strategy.impact].variant} size="sm">
              {impactConfig[strategy.impact].label}
            </Badge>
          </div>
        }
      />
      <CardBody>
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">{strategy.description}</p>

          {strategy.targetCategory && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600">Categoria:</span>
              <Badge variant="secondary" size="sm">
                {strategy.targetCategory}
              </Badge>
            </div>
          )}

          <div className="bg-linear-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-600 mb-1">Risparmio Mensile</p>
                <p className="text-lg font-bold text-blue-600">
                  €{strategy.projectedSavings.monthly.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 mb-1">Risparmio Annuale</p>
                <p className="text-lg font-bold text-green-600">
                  €{strategy.projectedSavings.yearly.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {isActive && strategy.actualSavings !== undefined && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 mb-1">Risparmio Effettivo</p>
                  <p className="text-xl font-bold text-green-600">
                    €{strategy.actualSavings.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-700 mb-1">Efficacia</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-base font-bold text-green-600">
                      {((strategy.actualSavings / strategy.projectedSavings.monthly) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(isActive || isCompleted) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600">Progresso</span>
                <span className="font-medium text-neutral-900">
                  {completedSteps}/{totalSteps} passi
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 space-y-2">
                {strategy.steps.map((step) => (
                  <div key={step.order} className="flex items-start gap-2">
                    {step.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        step.completed ? 'text-neutral-600 line-through' : 'text-neutral-900'
                      }`}
                    >
                      {step.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Status: {statusLabels[strategy.status]}</span>
            {strategy.startDate && (
              <span>
                Iniziata il {new Date(strategy.startDate).toLocaleDateString('it-IT')}
              </span>
            )}
          </div>
        </div>
      </CardBody>
      {!isCompleted && (
        <CardFooter>
          {strategy.status === 'suggested' && onStart ? (
            <Button variant="primary" size="sm" fullWidth onClick={onStart}>
              Inizia Strategia
            </Button>
          ) : isActive && onContinue ? (
            <Button variant="secondary" size="sm" fullWidth onClick={onContinue}>
              Continua
            </Button>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
};
