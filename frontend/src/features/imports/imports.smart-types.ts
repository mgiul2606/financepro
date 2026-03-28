/**
 * Types for the Smart CSV Import feature.
 * These map to the backend SmartImport Pydantic schemas.
 */

export interface DetectedFormat {
  encoding: string;
  separator: string;
  dateFormat: string;
  columnMapping: Record<string, string>;
  headerRow: number;
}

export interface ClassificationInfo {
  category: string;
  merchant: string | null;
  confidence: number;
  transactionType: string;
  matchMethod: string;
}

export interface ReconciliationInfo {
  action: 'skip' | 'flag' | 'import';
  reason: string;
  confidence: number;
  matchedTransactionId: string | null;
}

export interface PreviewTransactionItem {
  rowNumber: number;
  date: string;
  description: string;
  originalDescription: string;
  amount: number;
  balance: number | null;
  currency: string;
  classification: ClassificationInfo;
  reconciliation: ReconciliationInfo;
}

export interface PreviewSummary {
  totalRows: number;
  parsedRows: number;
  toImport: number;
  duplicates: number;
  needsReview: number;
  parseErrors: number;
}

export interface SmartPreviewData {
  jobId: string;
  detectedFormat: DetectedFormat;
  previewTransactions: PreviewTransactionItem[];
  summary: PreviewSummary;
  warnings: string[];
}

export interface SmartConfirmResult {
  jobId: string;
  status: string;
  imported: number;
  skippedDuplicates: number;
  flaggedForReview: number;
  errors: number;
}
