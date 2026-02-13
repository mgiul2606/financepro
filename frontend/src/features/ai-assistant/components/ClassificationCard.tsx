import { Check, X, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ClassificationResultUI } from '../ai-assistant.types';
import { cn } from '@/lib/utils';

export interface ClassificationCardProps {
  result: ClassificationResultUI;
  onConfirm?: (transactionId: string, categoryId: string) => void;
  onReject?: (transactionId: string) => void;
  onSelectAlternative?: (transactionId: string, category: string, subcategory?: string) => void;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({
  result,
  onConfirm,
  onReject,
  onSelectAlternative,
}) => {
  const { classification, alternativeCategories } = result;
  const confidencePercentage = Math.round(classification.confidence * 100);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBadgeVariant = (
    confidence: number
  ): 'default' | 'secondary' | 'destructive' => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  const getProgressColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="space-y-4 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="mb-1 font-semibold text-foreground">
              {result.originalDescription}
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="default">{classification.category}</Badge>
              {classification.subcategory && (
                <Badge variant="secondary">{classification.subcategory}</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge variant={getConfidenceBadgeVariant(classification.confidence)}>
              <Sparkles className="mr-1 h-3 w-3" />
              {confidencePercentage}% confidenza
            </Badge>
          </div>
        </div>

        {/* Tags */}
        {classification.tags && classification.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {classification.tags.map((tag, index) => (
              <span
                key={index}
                className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Confidence Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Livello di confidenza</span>
            <span className={cn('font-medium', getConfidenceColor(classification.confidence))}>
              {confidencePercentage}%
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                getProgressColor(classification.confidence)
              )}
              style={{ width: `${confidencePercentage}%` }}
            />
          </div>
        </div>

        {/* Explanation */}
        {classification.explanation && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-xs font-medium text-blue-900 dark:text-blue-100">
              Spiegazione
            </AlertTitle>
            <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
              {classification.explanation}
            </AlertDescription>
          </Alert>
        )}

        {/* Alternative Categories */}
        {alternativeCategories && alternativeCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Categorie alternative:</p>
            <div className="space-y-1">
              {alternativeCategories.slice(0, 3).map((alt, index) => (
                <button
                  key={index}
                  onClick={() =>
                    onSelectAlternative?.(result.transactionId, alt.category, alt.subcategory)
                  }
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 p-2 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
                      {alt.category}
                      {alt.subcategory && ` • ${alt.subcategory}`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(alt.confidence * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!classification.confirmedByUser && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onConfirm?.(result.transactionId, classification.category)}
            >
              <Check className="mr-2 h-4 w-4" />
              Conferma
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReject?.(result.transactionId)}
            >
              <X className="mr-2 h-4 w-4" />
              Rifiuta
            </Button>
          </div>
        )}

        {classification.confirmedByUser && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-green-600 dark:bg-green-950 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span className="text-xs font-medium">Classificazione confermata</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
