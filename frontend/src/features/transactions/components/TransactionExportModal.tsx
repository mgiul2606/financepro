// features/transactions/components/TransactionExportModal.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Table, FileCode } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/core/components/atomic/Button';
import { SelectField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import type { Transaction } from '../types';

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

  const formatOptions = [
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
      new Date(txn.date).toLocaleDateString(),
      txn.description,
      txn.type,
      txn.category || '',
      txn.amount.toFixed(2),
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
    // In production, use: import * as XLSX from 'xlsx';

    setError('Excel export requires additional library. Using CSV format instead.');
    exportToCSV(data);
  };

  const exportToPDF = (data: Transaction[]) => {
    // For a real implementation, you'd use a library like jsPDF or pdfmake
    // For now, we'll show an error
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
          exportToPDF(transactions);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactions.export.title')}
      size="sm"
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            isLoading={isExporting}
            leftIcon={<Download />}
          >
            {t('common.export')}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="warning" closable onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>{transactions.length}</strong> {t('transactions.title').toLowerCase()}{' '}
            will be exported
          </p>
        </div>

        <SelectField
          label={t('transactions.export.format')}
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          options={formatOptions}
          required
        />

        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          {getFormatIcon(format)}
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900">
              {formatOptions.find((f) => f.value === format)?.label}
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {format === 'csv' &&
                'Compatible with Excel, Google Sheets, and most spreadsheet applications'}
              {format === 'excel' &&
                'Microsoft Excel format with formatting and formulas'}
              {format === 'pdf' && 'Printable PDF document with transaction details'}
            </p>
          </div>
        </div>

        {includeFilters && (
          <div className="text-xs text-neutral-600 p-3 bg-neutral-50 rounded border border-neutral-200">
            Note: Current filters will be applied to the exported data
          </div>
        )}
      </div>
    </Modal>
  );
};
