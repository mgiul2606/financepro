import { useState, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ImportJobsTable } from '../components/ImportJobsTable';
import { SmartImportWizard } from '../components/SmartImportWizard';
import { useImports, useDeleteImport } from '../imports.hooks';
import { useSmartImport } from '../imports.smart-hooks';

/**
 * Imports page component
 * Features the smart CSV import wizard and import history
 */
export const ImportsPage = () => {
  const { t } = useTranslation();
  const { activeProfileIds } = useProfileContext();
  const [showWizard, setShowWizard] = useState(true);
  const [wizardKey, setWizardKey] = useState(0);

  // Hooks for data fetching and mutations
  const { imports, total, isLoading, error: fetchError } = useImports();
  const { deleteImport, isDeleting } = useDeleteImport();
  const { resume, preview, setPreview } = useSmartImport();

  const handleDelete = async (jobId: string) => {
    try {
      await deleteImport(jobId, false);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleResume = useCallback(async (jobId: string) => {
    try {
      const data = await resume(jobId);
      setShowWizard(true);
      // Force wizard remount with resume data
      setWizardKey((k) => k + 1);
    } catch {
      // Error handled by hook
    }
  }, [resume]);

  return (
    <div className="p-8">
      <PageHeader
        title={t('imports.title')}
        subtitle={t('imports.subtitle')}
      />

      {/* Smart Import Wizard */}
      {showWizard ? (
        <div className="mb-6">
          <SmartImportWizard key={wizardKey} />
        </div>
      ) : (
        <div className="mb-6">
          <Button variant="primary" onClick={() => setShowWizard(true)}>
            {t('smartImport.startNew')}
          </Button>
        </div>
      )}

      {/* Import History */}
      <Card variant="bordered">
        <CardHeader
          title={t('imports.importHistory')}
          subtitle={t('imports.recentImports', { count: total })}
        />
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
              <p className="text-gray-500 mt-4">{t('common.loading')}</p>
            </div>
          ) : fetchError ? (
            <div className="text-center py-8">
              <p className="text-red-500">{t('imports.errors.loadFailed')}</p>
            </div>
          ) : imports.length > 0 ? (
            <ImportJobsTable
              jobs={imports}
              onDelete={handleDelete}
              onResume={handleResume}
              isDeleting={isDeleting}
            />
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('imports.noImportsYet')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('imports.uploadToStart')}
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ImportsPage;
