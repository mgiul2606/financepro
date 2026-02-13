import { useState } from 'react';
import { Upload, Sparkles, CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClassificationCard } from './ClassificationCard';
import type { TransactionToClassify, ClassificationBatch } from '../ai-assistant.types';

export interface ExpenseClassifierProps {
  transactions?: TransactionToClassify[];
  onClassify?: (transactions: TransactionToClassify[]) => Promise<ClassificationBatch>;
  onConfirmClassification?: (transactionId: string, categoryId: string) => void;
  onRejectClassification?: (transactionId: string) => void;
  isLoading?: boolean;
}

export const ExpenseClassifier: React.FC<ExpenseClassifierProps> = ({
  transactions: initialTransactions,
  onClassify,
  onConfirmClassification,
  onRejectClassification,
  isLoading = false,
}) => {
  const [transactions, setTransactions] = useState<TransactionToClassify[]>(
    initialTransactions || []
  );
  const [classificationBatch, setClassificationBatch] = useState<ClassificationBatch | null>(
    null
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    if (!onClassify || transactions.length === 0) return;

    setIsClassifying(true);
    setError(null);

    try {
      const batch = await onClassify(transactions);
      setClassificationBatch(batch);
    } catch (err) {
      setError('Errore durante la classificazione. Riprova.');
      console.error('Classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Implement CSV parsing
    console.log('File uploaded:', file.name);
    setError('Importazione CSV in arrivo. Usa i dati mock per ora.');
  };

  const getStatusSummary = () => {
    if (!classificationBatch) return null;

    const confirmed = classificationBatch.results.filter(
      (r) => r.classification.confirmedByUser
    ).length;
    const pending = classificationBatch.results.length - confirmed;

    return { confirmed, pending, total: classificationBatch.results.length };
  };

  const statusSummary = getStatusSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Classificazione Automatica Spese
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            L'AI analizzerà le tue transazioni e assegnerà automaticamente le categorie più
            appropriate
          </p>
        </div>
        {transactions.length > 0 && !classificationBatch && (
          <Button onClick={handleClassify} disabled={isClassifying}>
            {isClassifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Classifica {transactions.length} transazioni
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setError(null)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      {!classificationBatch && transactions.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-8">
            <div className="text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Importa transazioni da classificare
              </h4>
              <p className="mb-4 text-sm text-muted-foreground">
                Carica un file CSV o seleziona transazioni esistenti
              </p>
              <div className="flex items-center justify-center gap-3">
                <label>
                  <Button variant="secondary" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Carica CSV
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <Button
                  size="sm"
                  onClick={() => {
                    // Mock data for demonstration
                    setTransactions([
                      {
                        id: '1',
                        amount: -45.67,
                        description: 'ESSELUNGA MILANO',
                        merchant: 'Esselunga',
                        date: new Date().toISOString(),
                        accountId: 'acc-1',
                      },
                      {
                        id: '2',
                        amount: -12.5,
                        description: 'NETFLIX.COM',
                        merchant: 'Netflix',
                        date: new Date().toISOString(),
                        accountId: 'acc-1',
                      },
                      {
                        id: '3',
                        amount: -89.99,
                        description: 'AMAZON EU',
                        merchant: 'Amazon',
                        date: new Date().toISOString(),
                        accountId: 'acc-1',
                      },
                      {
                        id: '4',
                        amount: -25.0,
                        description: 'RISTORANTE LA PERGOLA',
                        merchant: 'La Pergola',
                        date: new Date().toISOString(),
                        accountId: 'acc-1',
                      },
                      {
                        id: '5',
                        amount: -150.0,
                        description: 'ENEL ENERGIA',
                        merchant: 'Enel',
                        date: new Date().toISOString(),
                        accountId: 'acc-1',
                      },
                    ]);
                  }}
                >
                  Usa dati di esempio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isClassifying && (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <h4 className="mb-2 text-sm font-medium text-foreground">
            Classificazione in corso...
          </h4>
          <p className="text-sm text-muted-foreground">
            L'AI sta analizzando le transazioni. Questo potrebbe richiedere qualche secondo.
          </p>
        </div>
      )}

      {/* Status Summary */}
      {statusSummary && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {statusSummary.confirmed}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Confermate</p>
              </div>
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">
                    {statusSummary.pending}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">In attesa</p>
              </div>
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold text-primary">{statusSummary.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">Totali</p>
              </div>
            </div>
            {classificationBatch && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidenza media:</span>
                  <span className="font-semibold text-foreground">
                    {Math.round(classificationBatch.averageConfidence * 100)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Classification Results */}
      {classificationBatch && classificationBatch.results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Risultati Classificazione ({classificationBatch.results.length})
            </h4>
            {statusSummary && statusSummary.pending === 0 && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setClassificationBatch(null);
                  setTransactions([]);
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Completa classificazione
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {classificationBatch.results.map((result) => (
              <ClassificationCard
                key={result.transactionId}
                result={result}
                onConfirm={onConfirmClassification}
                onReject={onRejectClassification}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
