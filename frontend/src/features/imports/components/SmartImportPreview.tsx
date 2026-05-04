import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import type { SmartPreviewData, PreviewTransactionItem } from '../imports.smart-types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency } from '@/utils/currency';

interface SmartImportPreviewProps {
  preview: SmartPreviewData;
  onConfirm: (
    overrides: Record<string, { category?: string; action?: string }>,
    importFlagged: boolean,
    excludedRows: number[],
    invertAmounts: boolean,
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
  const { preferences } = usePreferences();

  // Track user overrides
  const [overrides, setOverrides] = useState<
    Record<string, { category?: string; action?: string }>
  >({});
  const [importFlagged, setImportFlagged] = useState(false);
  const [invertAmounts, setInvertAmounts] = useState(false);

  // Track excluded rows — pre-exclude rows that aren't parseable
  const [excludedRows, setExcludedRows] = useState<Set<number>>(() =>
    new Set(
      preview.previewTransactions
        .filter((r) => !r.isParseable)
        .map((r) => r.rowNumber),
    ),
  );

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

  const toggleRow = (rowNumber: number) => {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const toggleAll = () => {
    if (excludedRows.size === 0) {
      // Exclude all
      setExcludedRows(new Set(preview.previewTransactions.map((r) => r.rowNumber)));
    } else {
      // Include all
      setExcludedRows(new Set());
    }
  };

  // Summary counts (accounting for overrides and exclusions)
  const counts = useMemo(() => {
    let toImport = 0;
    let duplicates = 0;
    let flagged = 0;
    let excluded = 0;
    let uncategorized = 0;
    for (const tx of preview.previewTransactions) {
      if (excludedRows.has(tx.rowNumber)) {
        excluded++;
        continue;
      }
      const action = effectiveAction(tx);
      if (action === 'skip') duplicates++;
      else if (action === 'flag' && !importFlagged) flagged++;
      else toImport++;

      if (effectiveCategory(tx) === 'Uncategorized') uncategorized++;
    }
    return { toImport, duplicates, flagged, excluded, uncategorized };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.previewTransactions, overrides, importFlagged, excludedRows]);

  const formatAmount = (amount: number) => {
    const displayAmount = invertAmounts ? -amount : amount;
    return formatCurrency(displayAmount, preferences.currency, preferences.locale);
  };

  const getDisplayAmount = (amount: number) => {
    return invertAmounts ? -amount : amount;
  };

  const reconciliationBadge = (tx: PreviewTransactionItem) => {
    const action = effectiveAction(tx);
    if (action === 'skip') {
      return <Badge variant="destructive">{t('smartImport.preview.duplicate')}</Badge>;
    }
    if (action === 'flag') {
      return <Badge variant="warning">{t('smartImport.preview.needsReview')}</Badge>;
    }
    return <Badge variant="success">{t('smartImport.preview.new')}</Badge>;
  };

  const allChecked = excludedRows.size === 0;

  return (
    <div className="space-y-4">
      {/* Detected format info */}
      <Card variant="bordered">
        <CardHeader><CardTitle>{t('smartImport.preview.detectedFormat')}</CardTitle></CardHeader>
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

      {/* Invert amounts toggle */}
      <Card variant="bordered">
        <CardBody>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={invertAmounts}
              onChange={(e) => setInvertAmounts(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <ArrowUpDown className="h-4 w-4 text-neutral-500" />
            <div>
              <span className="text-sm font-medium">{t('smartImport.preview.invertAmounts')}</span>
              <p className="text-xs text-neutral-500">{t('smartImport.preview.invertAmountsHint')}</p>
            </div>
          </label>
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
        {counts.excluded > 0 && (
          <div className="text-sm text-neutral-600">
            {t('smartImport.preview.excludedCount', { count: counts.excluded })}
          </div>
        )}
        {counts.uncategorized > 0 && (
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            {t('smartImport.preview.uncategorizedCount', { count: counts.uncategorized })}
          </div>
        )}
        {preview.warnings.length > 0 && (
          <div className="text-sm text-amber-600">
            {t('smartImport.preview.parseWarnings', { count: preview.warnings.length })}
          </div>
        )}
      </div>

      {/* Transactions table */}
      <Card variant="bordered">
        <CardHeader><CardTitle>{t('smartImport.preview.transactions')}</CardTitle></CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left">
                  <th className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="rounded border-neutral-300"
                      title={t('smartImport.preview.selectAll')}
                    />
                  </th>
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
                {preview.previewTransactions.map((tx) => {
                  const isExcluded = excludedRows.has(tx.rowNumber);
                  const isUncategorized = effectiveCategory(tx) === 'Uncategorized';
                  const isSkipped = effectiveAction(tx) === 'skip';

                  return (
                    <tr
                      key={tx.rowNumber}
                      className={`border-b border-neutral-100 ${
                        isExcluded
                          ? 'opacity-40 bg-neutral-100'
                          : !tx.isParseable
                            ? 'bg-neutral-50 text-neutral-400'
                            : isSkipped
                              ? 'opacity-50 bg-neutral-50'
                              : isUncategorized
                                ? 'bg-amber-50'
                                : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleRow(tx.rowNumber)}
                          className="rounded border-neutral-300"
                        />
                      </td>
                      <td className="py-2 px-3 text-neutral-400">{tx.rowNumber}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{tx.date}</td>
                      <td className="py-2 px-3 max-w-xs truncate" title={tx.originalDescription}>
                        <div className="flex items-center gap-1">
                          {tx.description}
                          {tx.parseWarnings.length > 0 && (
                            <span
                              title={tx.parseWarnings.join(', ')}
                              className="text-amber-500"
                            >
                              <AlertTriangle className="h-3 w-3 inline" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`py-2 px-3 text-right whitespace-nowrap font-medium ${
                        getDisplayAmount(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="py-2 px-3">
                        {isUncategorized ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <select
                              value="Uncategorized"
                              onChange={(e) => handleCategoryChange(tx.rowNumber, e.target.value)}
                              className="text-sm border border-amber-300 bg-amber-50 rounded px-2 py-1 max-w-[160px] text-amber-700"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={effectiveCategory(tx)}
                              onChange={(e) => handleCategoryChange(tx.rowNumber, e.target.value)}
                              className="text-sm border border-neutral-200 rounded px-2 py-1 max-w-[160px]"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            {tx.classification.confidence < 0.7 && tx.classification.confidence > 0 && (
                              <span className="text-xs text-neutral-400">
                                ({Math.round(tx.classification.confidence * 100)}%)
                              </span>
                            )}
                          </div>
                        )}
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
                  );
                })}
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
          variant="default"
          onClick={() => onConfirm(overrides, importFlagged, Array.from(excludedRows), invertAmounts)}
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
