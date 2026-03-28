import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import type { SmartPreviewData, PreviewTransactionItem } from '../imports.smart-types';

interface SmartImportPreviewProps {
  preview: SmartPreviewData;
  onConfirm: (
    overrides: Record<string, { category?: string; action?: string }>,
    importFlagged: boolean,
  ) => void;
  onBack: () => void;
  isImporting: boolean;
  importError: string | null;
}

const CATEGORIES = [
  'Groceries', 'Restaurants', 'Transportation', 'Utilities', 'Healthcare',
  'Insurance', 'Subscriptions', 'Shopping', 'Entertainment', 'Education',
  'Travel', 'Gifts', 'Personal Care', 'Pets', 'Home Improvement',
  'Salary', 'Freelance Income', 'Investment Income', 'Other Income',
  'Bank Fees', 'Rent', 'Taxes', 'Uncategorized',
];

export const SmartImportPreview = ({
  preview,
  onConfirm,
  onBack,
  isImporting,
  importError,
}: SmartImportPreviewProps) => {
  const { t } = useTranslation();

  // Track user overrides
  const [overrides, setOverrides] = useState<
    Record<string, { category?: string; action?: string }>
  >({});
  const [importFlagged, setImportFlagged] = useState(false);

  const handleCategoryChange = (rowNum: number, category: string) => {
    setOverrides((prev) => ({
      ...prev,
      [String(rowNum)]: { ...prev[String(rowNum)], category },
    }));
  };

  const handleActionOverride = (rowNum: number, action: 'import' | 'skip') => {
    setOverrides((prev) => ({
      ...prev,
      [String(rowNum)]: { ...prev[String(rowNum)], action },
    }));
  };

  const effectiveCategory = (tx: PreviewTransactionItem): string => {
    return overrides[String(tx.rowNumber)]?.category ?? tx.classification.category;
  };

  const effectiveAction = (tx: PreviewTransactionItem): string => {
    return overrides[String(tx.rowNumber)]?.action ?? tx.reconciliation.action;
  };

  // Summary counts (accounting for overrides)
  const counts = useMemo(() => {
    let toImport = 0;
    let duplicates = 0;
    let flagged = 0;
    for (const tx of preview.previewTransactions) {
      const action = effectiveAction(tx);
      if (action === 'skip') duplicates++;
      else if (action === 'flag' && !importFlagged) flagged++;
      else toImport++;
    }
    return { toImport, duplicates, flagged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.previewTransactions, overrides, importFlagged]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const reconciliationBadge = (tx: PreviewTransactionItem) => {
    const action = effectiveAction(tx);
    if (action === 'skip') {
      return <Badge variant="danger" size="sm">{t('smartImport.preview.duplicate')}</Badge>;
    }
    if (action === 'flag') {
      return <Badge variant="warning" size="sm">{t('smartImport.preview.needsReview')}</Badge>;
    }
    return <Badge variant="success" size="sm">{t('smartImport.preview.new')}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Detected format info */}
      <Card variant="bordered">
        <CardHeader title={t('smartImport.preview.detectedFormat')} />
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">{t('smartImport.preview.encoding')}:</span>{' '}
              <span className="font-medium">{preview.detectedFormat.encoding}</span>
            </div>
            <div>
              <span className="text-neutral-500">{t('smartImport.preview.separator')}:</span>{' '}
              <span className="font-medium">
                {preview.detectedFormat.separator === ';' ? '; (semicolon)' : preview.detectedFormat.separator === ',' ? ', (comma)' : preview.detectedFormat.separator}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">{t('smartImport.preview.dateFormat')}:</span>{' '}
              <span className="font-medium">{preview.detectedFormat.dateFormat}</span>
            </div>
            <div>
              <span className="text-neutral-500">{t('smartImport.preview.headerRow')}:</span>{' '}
              <span className="font-medium">{preview.detectedFormat.headerRow + 1}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-neutral-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">
            {t('smartImport.preview.toImport', { count: counts.toImport })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium">
            {t('smartImport.preview.duplicatesCount', { count: counts.duplicates })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium">
            {t('smartImport.preview.flaggedCount', { count: counts.flagged })}
          </span>
        </div>
        {preview.warnings.length > 0 && (
          <div className="text-sm text-amber-600">
            {t('smartImport.preview.parseWarnings', { count: preview.warnings.length })}
          </div>
        )}
      </div>

      {/* Transactions table */}
      <Card variant="bordered">
        <CardHeader title={t('smartImport.preview.transactions')} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left">
                  <th className="py-2 px-3 font-medium text-neutral-500">#</th>
                  <th className="py-2 px-3 font-medium text-neutral-500">{t('smartImport.preview.date')}</th>
                  <th className="py-2 px-3 font-medium text-neutral-500">{t('smartImport.preview.description')}</th>
                  <th className="py-2 px-3 font-medium text-neutral-500 text-right">{t('smartImport.preview.amount')}</th>
                  <th className="py-2 px-3 font-medium text-neutral-500">{t('smartImport.preview.category')}</th>
                  <th className="py-2 px-3 font-medium text-neutral-500">{t('smartImport.preview.status')}</th>
                  <th className="py-2 px-3 font-medium text-neutral-500">{t('smartImport.preview.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {preview.previewTransactions.map((tx) => (
                  <tr
                    key={tx.rowNumber}
                    className={`border-b border-neutral-100 ${
                      effectiveAction(tx) === 'skip' ? 'opacity-50 bg-neutral-50' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-neutral-400">{tx.rowNumber}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{tx.date}</td>
                    <td className="py-2 px-3 max-w-xs truncate" title={tx.originalDescription}>
                      {tx.description}
                    </td>
                    <td className={`py-2 px-3 text-right whitespace-nowrap font-medium ${
                      tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(tx.amount)}
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={effectiveCategory(tx)}
                        onChange={(e) => handleCategoryChange(tx.rowNumber, e.target.value)}
                        className="text-sm border border-neutral-200 rounded px-2 py-1 max-w-[160px]"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">{reconciliationBadge(tx)}</td>
                    <td className="py-2 px-3">
                      {effectiveAction(tx) === 'skip' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActionOverride(tx.rowNumber, 'import')}
                        >
                          {t('smartImport.preview.forceImport')}
                        </Button>
                      )}
                      {effectiveAction(tx) === 'import' && tx.reconciliation.action === 'skip' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActionOverride(tx.rowNumber, 'skip')}
                        >
                          {t('smartImport.preview.undoForce')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Import flagged toggle */}
      {counts.flagged > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={importFlagged}
            onChange={(e) => setImportFlagged(e.target.checked)}
            className="rounded border-neutral-300"
          />
          {t('smartImport.preview.importFlaggedLabel', { count: counts.flagged })}
        </label>
      )}

      {/* Error display */}
      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {importError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          onClick={() => onConfirm(overrides, importFlagged)}
          isLoading={isImporting}
          disabled={isImporting || counts.toImport === 0}
        >
          {t('smartImport.preview.confirmImport', { count: counts.toImport })}
        </Button>
      </div>
    </div>
  );
};

export default SmartImportPreview;
