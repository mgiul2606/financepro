import { AlertCircle, Trash2, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardBody, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WasteDetection } from '../optimization.types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency, formatDate } from '@/utils/currency';

export interface WasteCardProps {
  waste: WasteDetection;
  onTakeAction?: () => void;
}

const wasteTypeLabels = {
  unused_subscription: 'Abbonamento Inutilizzato',
  duplicate_service: 'Servizio Duplicato',
  high_cost_low_usage: 'Alto Costo, Basso Utilizzo',
  better_alternative: 'Alternativa Migliore Disponibile',
};

const usageLabels = {
  never: 'Mai',
  rarely: 'Raramente',
  occasionally: 'Occasionalmente',
  frequently: 'Frequentemente',
};

const usageColors = {
  never: 'destructive' as const,
  rarely: 'warning' as const,
  occasionally: 'info' as const,
  frequently: 'success' as const,
};

export const WasteCard: React.FC<WasteCardProps> = ({ waste, onTakeAction }) => {
  const { preferences } = usePreferences();
  return (
    <Card variant="bordered" className="border-orange-200 bg-orange-50/30">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-orange-600" />
            <span>{waste.merchantName}</span>
          </div>
        </CardTitle>
        <CardDescription>{waste.category}</CardDescription>
        <CardAction>
          <Badge variant={usageColors[waste.usageFrequency]}>
            {usageLabels[waste.usageFrequency]}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-neutral-600 mb-1">{wasteTypeLabels[waste.type]}</p>
            <Badge variant="secondary">
              {waste.frequency === 'monthly' && 'Mensile'}
              {waste.frequency === 'yearly' && 'Annuale'}
              {waste.frequency === 'quarterly' && 'Trimestrale'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-600 mb-1">Costo Mensile</p>
              <p className="text-lg font-bold text-expense">{formatCurrency(waste.monthlyCost, preferences.currency, preferences.locale)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-600 mb-1">Utilizzi</p>
              <p className="text-lg font-bold text-neutral-900">{waste.usageCount}</p>
            </div>
          </div>

          {waste.costPerUse > 0 && (
            <div>
              <p className="text-xs text-neutral-600 mb-1">Costo per Utilizzo</p>
              <p className="text-base font-semibold text-neutral-900">
                {formatCurrency(waste.costPerUse, preferences.currency, preferences.locale)}
              </p>
            </div>
          )}

          {waste.lastUsage && (
            <div>
              <p className="text-xs text-neutral-600 mb-1">Ultimo Utilizzo</p>
              <p className="text-sm text-neutral-900">
                {formatDate(waste.lastUsage, preferences.locale)}
              </p>
            </div>
          )}

          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-700 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900">{waste.recommendation}</p>
            </div>
          </div>

          <div className="bg-income-subtle border border-green-200 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-income-foreground">Risparmio Potenziale</span>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-income" />
                <span className="font-bold text-income">
                  {formatCurrency(waste.potentialSaving, preferences.currency, preferences.locale)}/anno
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
      {onTakeAction && (
        <CardFooter>
          <Button variant="default" size="sm" fullWidth onClick={onTakeAction}>
            Prendi Provvedimenti
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
