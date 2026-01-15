// features/transactions/components/TransactionExportModal.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Table, FileCode } from 'lucide-react';

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types - using Transaction which is an alias for TransactionResponse
import type { Transaction } from '../transactions.types';

interface TransactionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  includeFilters?: boolean;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

export const TransactionExportModal = ({
  isOpen,
  onClose,
  transactions,
  includeFilters = false,
}: TransactionExportModalProps) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatOptions: { value: ExportFormat; label: string }[] = [
    { value: 'csv', label: `${t('transactions.export.csv')} (.csv)` },
    { value: 'excel', label: `${t('transactions.export.excel')} (.xlsx)` },
    { value: 'pdf', label: `${t('transactions.export.pdf')} (.pdf)` },
  ];

  const getFormatIcon = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'csv':
        return <FileCode className="h-4 w-4" />;
      case 'excel':
        return <Table className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
    }
  };

  const exportToCSV = (data: Transaction[]) => {
    const headers = [
      'Date',
      'Description',
      'Type',
      'Category',
      'Amount',
      'Currency',
      'Merchant',
      'Notes',
    ];

    const rows = data.map((txn) => [
      new Date(txn.transactionDate).toLocaleDateString(),
      txn.description,
      txn.transactionType,
      txn.categoryId || '',
      parseFloat(txn.amount).toFixed(2),
      txn.currency,
      txn.merchantName || '',
      txn.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToExcel = (data: Transaction[]) => {
    // For a real implementation, you'd use a library like xlsx or sheetjs
    // For now, we'll use CSV format with .xlsx extension
    setError('Excel export requires additional library. Using CSV format instead.');
    exportToCSV(data);
  };

  const exportToPDF = () => {
    // For a real implementation, you'd use a library like jsPDF or pdfmake
    setError('PDF export is not yet implemented. Please use CSV format.');
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      switch (format) {
        case 'csv':
          exportToCSV(transactions);
          break;
        case 'excel':
          exportToExcel(transactions);
          break;
        case 'pdf':
          exportToPDF();
          break;
      }

      if (format === 'csv' || format === 'excel') {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError(t('transactions.export.error'));
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('transactions.export.title')}</DialogTitle>
          <DialogDescription>
            {t(
              'transactions.export.description',
              'Export your transactions to a file for external use.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>{transactions.length}</strong> {t('transactions.title').toLowerCase()}{' '}
              will be exported
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">{t('transactions.export.format')}</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            {getFormatIcon(format)}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {formatOptions.find((f) => f.value === format)?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format === 'csv' &&
                  'Compatible with Excel, Google Sheets, and most spreadsheet applications'}
                {format === 'excel' &&
                  'Microsoft Excel format with formatting and formulas'}
                {format === 'pdf' && 'Printable PDF document with transaction details'}
              </p>
            </div>
          </div>

          {includeFilters && (
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded border">
              Note: Current filters will be applied to the exported data
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('common.export')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
