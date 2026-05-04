import { useState, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImportJobsTable } from '../components/ImportJobsTable';
import { SmartImportWizard } from '../components/SmartImportWizard';
import { useImports, useDeleteImport } from '../imports.hooks';
import { useSmartImport } from '../imports.smart-hooks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ImportJobResponse } from '@/api/generated/models';

/**
 * Imports page component
 * Features the smart CSV import wizard and import history
 */
export const ImportsPage = () => {
  const { t } = useTranslation();
  const [showWizard, setShowWizard] = useState(true);
  const [wizardKey, setWizardKey] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<ImportJobResponse | null>(null);

  // Hooks for data fetching and mutations
  const { imports, total, isLoading, error: fetchError } = useImports();
  const { deleteImport, isDeleting } = useDeleteImport();
  const { resume } = useSmartImport();

  const handleDeleteClick = (jobId: string) => {
    const job = imports.find((j) => j.id === jobId) ?? null;
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      await deleteImport(jobToDelete.id, true);
    } catch {
      // Error is handled by the hook
    } finally {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  const handleResume = useCallback(async (jobId: string) => {
    try {
      await resume(jobId);
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
          <SmartImportWizard key={wizardKey} activeJobs={imports} />
        </div>
      ) : (
        <div className="mb-6">
          <Button variant="default" onClick={() => setShowWizard(true)}>
            {t('smartImport.startNew')}
          </Button>
        </div>
      )}

      {/* Import History */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>{t('imports.importHistory')}</CardTitle>
          <CardDescription>{t('imports.recentImports', { count: total })}</CardDescription>
        </CardHeader>
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
              onDelete={handleDeleteClick}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('imports.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(jobToDelete?.successfulImports ?? 0) > 0
                ? t('imports.deleteDialog.withTransactions', { count: jobToDelete?.successfulImports ?? 0 })
                : t('imports.deleteDialog.noTransactions')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {t('imports.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportsPage;
