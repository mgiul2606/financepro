import { Check, X, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardBody } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import { Button } from '@/core/components/atomic/Button';
import type { ClassificationResult } from '../types';
import { format } from 'date-fns';

export interface ClassificationCardProps {
  result: ClassificationResult;
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
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeVariant = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Card variant="bordered" className="hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 mb-1">
                {result.originalDescription}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {classification.category}
                </Badge>
                {classification.subcategory && (
                  <Badge variant="secondary" size="sm">
                    {classification.subcategory}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant={getConfidenceBadgeVariant(classification.confidence)} size="sm">
                <Sparkles className="h-3 w-3 mr-1" />
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
                  className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Confidence Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-600">Livello di confidenza</span>
              <span className={`font-medium ${getConfidenceColor(classification.confidence)}`}>
                {confidencePercentage}%
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  classification.confidence >= 0.8
                    ? 'bg-green-500'
                    : classification.confidence >= 0.6
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${confidencePercentage}%` }}
              />
            </div>
          </div>

          {/* Explanation */}
          {classification.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900 mb-1">Spiegazione</p>
                  <p className="text-xs text-blue-800">{classification.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alternative Categories */}
          {alternativeCategories && alternativeCategories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-700">Categorie alternative:</p>
              <div className="space-y-1">
                {alternativeCategories.slice(0, 3).map((alt, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      onSelectAlternative?.(
                        result.transactionId,
                        alt.category,
                        alt.subcategory
                      )
                    }
                    className="w-full flex items-center justify-between p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-neutral-400 group-hover:text-blue-600" />
                      <span className="text-xs font-medium text-neutral-700 group-hover:text-blue-600">
                        {alt.category}
                        {alt.subcategory && ` • ${alt.subcategory}`}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {Math.round(alt.confidence * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!classification.confirmedByUser && (
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
              <Button
                variant="success"
                size="sm"
                leftIcon={<Check className="h-4 w-4" />}
                onClick={() => onConfirm?.(result.transactionId, classification.category)}
                className="flex-1"
              >
                Conferma
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<X className="h-4 w-4" />}
                onClick={() => onReject?.(result.transactionId)}
              >
                Rifiuta
              </Button>
            </div>
          )}

          {classification.confirmedByUser && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-2">
              <Check className="h-4 w-4" />
              <span className="text-xs font-medium">Classificazione confermata</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
