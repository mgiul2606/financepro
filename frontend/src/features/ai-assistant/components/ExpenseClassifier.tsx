import { useState } from 'react';
import { Upload, Sparkles, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/core/components/atomic/Button';
import { Spinner } from '@/core/components/atomic/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ClassificationCard } from './ClassificationCard';
import type { TransactionToClassify, ClassificationBatch } from '../types';

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
    // For now, we'll use mock data
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
          <h3 className="text-lg font-semibold text-neutral-900">
            Classificazione Automatica Spese
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            L'AI analizzerà le tue transazioni e assegnerà automaticamente le categorie più
            appropriate
          </p>
        </div>
        {transactions.length > 0 && !classificationBatch && (
          <Button
            variant="primary"
            leftIcon={<Sparkles />}
            onClick={handleClassify}
            isLoading={isClassifying}
          >
            Classifica {transactions.length} transazioni
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" closable onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Section */}
      {!classificationBatch && transactions.length === 0 && (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8">
          <div className="text-center">
            <Upload className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-neutral-900 mb-2">
              Importa transazioni da classificare
            </h4>
            <p className="text-sm text-neutral-600 mb-4">
              Carica un file CSV o seleziona transazioni esistenti
            </p>
            <div className="flex items-center justify-center gap-3">
              <label>
                <Button variant="secondary" size="sm" leftIcon={<Upload />} as="span">
                  Carica CSV
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <Button
                variant="primary"
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
                      accountId: 1,
                    },
                    {
                      id: '2',
                      amount: -12.5,
                      description: 'NETFLIX.COM',
                      merchant: 'Netflix',
                      date: new Date().toISOString(),
                      accountId: 1,
                    },
                    {
                      id: '3',
                      amount: -89.99,
                      description: 'AMAZON EU',
                      merchant: 'Amazon',
                      date: new Date().toISOString(),
                      accountId: 1,
                    },
                    {
                      id: '4',
                      amount: -25.0,
                      description: 'RISTORANTE LA PERGOLA',
                      merchant: 'La Pergola',
                      date: new Date().toISOString(),
                      accountId: 1,
                    },
                    {
                      id: '5',
                      amount: -150.0,
                      description: 'ENEL ENERGIA',
                      merchant: 'Enel',
                      date: new Date().toISOString(),
                      accountId: 1,
                    },
                  ]);
                }}
              >
                Usa dati di esempio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isClassifying && (
        <div className="text-center py-12">
          <Spinner size="lg" className="mx-auto mb-4" />
          <h4 className="text-sm font-medium text-neutral-900 mb-2">
            Classificazione in corso...
          </h4>
          <p className="text-sm text-neutral-600">
            L'AI sta analizzando le transazioni. Questo potrebbe richiedere qualche secondo.
          </p>
        </div>
      )}

      {/* Status Summary */}
      {statusSummary && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{statusSummary.confirmed}</span>
              </div>
              <p className="text-xs text-neutral-600">Confermate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Loader className="h-4 w-4 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{statusSummary.pending}</span>
              </div>
              <p className="text-xs text-neutral-600">In attesa</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{statusSummary.total}</span>
              </div>
              <p className="text-xs text-neutral-600">Totali</p>
            </div>
          </div>
          {classificationBatch && (
            <div className="mt-3 pt-3 border-t border-neutral-300">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Confidenza media:</span>
                <span className="font-semibold text-neutral-900">
                  {Math.round(classificationBatch.averageConfidence * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Classification Results */}
      {classificationBatch && classificationBatch.results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-700">
              Risultati Classificazione ({classificationBatch.results.length})
            </h4>
            {statusSummary && statusSummary.pending === 0 && (
              <Button
                variant="success"
                size="sm"
                leftIcon={<CheckCircle />}
                onClick={() => {
                  setClassificationBatch(null);
                  setTransactions([]);
                }}
              >
                Completa classificazione
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
