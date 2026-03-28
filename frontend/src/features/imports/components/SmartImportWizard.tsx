import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAccounts } from '@/features/accounts';
import { ImportUploadZone } from './ImportUploadZone';
import { SmartImportPreview } from './SmartImportPreview';
import { SmartImportResult } from './SmartImportResult';
import { useSmartImport } from '../imports.smart-hooks';
import type { ImportJobResponse } from '@/api/generated/models';

type WizardStep = 'upload' | 'preview' | 'result';

interface SmartImportWizardProps {
  activeJobs?: ImportJobResponse[];
}

/**
 * Multi-step wizard for smart CSV import.
 * Step 1: Upload file + select account
 * Step 2: Preview parsed transactions with auto-classification
 * Step 3: Import result summary
 */
export const SmartImportWizard = ({ activeJobs = [] }: SmartImportWizardProps) => {
  const { t } = useTranslation();
  const { activeProfileIds } = useProfileContext();
  const { accounts, isLoading: accountsLoading } = useAccounts();

  const [step, setStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const {
    preview,
    confirmResult,
    isAnalyzing,
    isImporting,
    analyzeError,
    importError,
    analyze,
    confirm,
    reset,
  } = useSmartImport();

  // Block navigation during import
  useEffect(() => {
    if (isImporting) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = t('smartImport.preview.leaveWarning');
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isImporting, t]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !selectedAccountId || activeProfileIds.length === 0) return;
    try {
      await analyze(selectedFile, selectedAccountId, activeProfileIds[0]);
      setStep('preview');
    } catch {
      // Error handled by hook
    }
  }, [selectedFile, selectedAccountId, activeProfileIds, analyze]);

  const handleConfirm = useCallback(
    async (
      overrides: Record<string, { category?: string; action?: string }>,
      importFlagged: boolean,
      excludedRows: number[],
      invertAmounts: boolean,
    ) => {
      if (!preview) return;
      try {
        await confirm(preview.jobId, overrides, importFlagged, excludedRows, invertAmounts);
        setStep('result');
      } catch {
        // Error handled by hook
      }
    },
    [preview, confirm],
  );

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setSelectedAccountId('');
    setStep('upload');
    reset();
  }, [reset]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    reset();
  }, [reset]);

  // Step indicators
  const steps = [
    { key: 'upload', label: t('smartImport.steps.upload') },
    { key: 'preview', label: t('smartImport.steps.preview') },
    { key: 'result', label: t('smartImport.steps.result') },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  const hasActiveJob = activeJobs.some(
    (j) => j.status === 'pending' || j.status === 'processing',
  );

  return (
    <div className="space-y-6">
      {/* Active job warning */}
      {hasActiveJob && step === 'upload' && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {t('smartImport.upload.activeJobWarning')}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {t('smartImport.upload.activeJobHint')}
            </p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                idx <= currentIdx
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {idx + 1}
            </div>
            <span
              className={`text-sm ${idx <= currentIdx ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${idx < currentIdx ? 'bg-blue-600' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card variant="bordered">
          <CardHeader
            title={t('smartImport.upload.title')}
            subtitle={t('smartImport.upload.subtitle')}
          />
          <CardBody>
            <div className="space-y-4">
              {/* Account selector */}
              <div>
                <label htmlFor="account-select" className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('smartImport.upload.selectAccount')}
                </label>
                <select
                  id="account-select"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={accountsLoading}
                >
                  <option value="">{t('smartImport.upload.chooseAccount')}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload zone */}
              <ImportUploadZone
                onFileSelect={handleFileSelect}
                onUpload={handleAnalyze}
                onCancel={handleCancel}
                selectedFile={selectedFile}
                isUploading={isAnalyzing}
                error={analyzeError}
                disabled={hasActiveJob}
              />

              {!selectedAccountId && selectedFile && (
                <p className="text-sm text-amber-600">{t('smartImport.upload.selectAccountFirst')}</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <SmartImportPreview
          preview={preview}
          onConfirm={handleConfirm}
          onBack={() => setStep('upload')}
          isImporting={isImporting}
          importError={importError}
        />
      )}

      {/* Step 3: Result */}
      {step === 'result' && confirmResult && (
        <SmartImportResult result={confirmResult} onReset={handleReset} />
      )}
    </div>
  );
};

export default SmartImportWizard;
