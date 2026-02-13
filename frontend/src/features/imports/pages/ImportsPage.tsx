import { useState, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ImportUploadZone } from '../components/ImportUploadZone';
import { ImportJobsTable } from '../components/ImportJobsTable';
import { useImports, useCreateImport, useDeleteImport } from '../imports.hooks';

/**
 * Imports page component
 * Allows users to upload CSV/Excel files and view import history
 */
export const ImportsPage = () => {
  const { t } = useTranslation();
  const { activeProfileIds } = useProfileContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Hooks for data fetching and mutations
  const { imports, total, isLoading, error: fetchError, refetch } = useImports();
  const { uploadFile, isUploading, error: uploadError, reset: resetUpload } = useCreateImport();
  const { deleteImport, isDeleting } = useDeleteImport();

  const handleFileSelect = useCallback((file: File) => {
    resetUpload();
    setSelectedFile(file);
  }, [resetUpload]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || activeProfileIds.length === 0) return;

    try {
      await uploadFile({
        file: selectedFile,
        profileId: activeProfileIds[0],
        skipDuplicates: true,
      });
      setSelectedFile(null);
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Error is handled by the hook
    }
  }, [selectedFile, activeProfileIds, uploadFile, refetch]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    resetUpload();
  }, [resetUpload]);

  const handleDelete = useCallback(async (jobId: string) => {
    try {
      await deleteImport(jobId, false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Error is handled by the hook
    }
  }, [deleteImport]);

  const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : null;

  return (
    <div className="p-8">
      <PageHeader
        title={t('imports.title')}
        subtitle={t('imports.subtitle')}
      />

      {/* Upload Section */}
      <Card variant="bordered" className="mb-6">
        <CardHeader
          title={t('imports.uploadFile')}
          subtitle={t('imports.uploadDescription')}
        />
        <CardBody>
          <ImportUploadZone
            onFileSelect={handleFileSelect}
            onUpload={handleUpload}
            onCancel={handleCancel}
            selectedFile={selectedFile}
            isUploading={isUploading}
            error={uploadErrorMessage}
          />
        </CardBody>
      </Card>

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
