import { useMemo } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/core/components/composite/DataTable';
import { Button } from '@/core/components/atomic/Button';
import type { ImportJobResponse } from '@/api/generated/models';
import { ImportStatusBadge } from './ImportStatusBadge';
import { calculateProgress } from '../imports.hooks';

interface ImportJobsTableProps {
  jobs: ImportJobResponse[];
  onDelete?: (jobId: string) => void;
  isDeleting?: boolean;
}

/**
 * Table component for displaying import job history
 */
export const ImportJobsTable = ({
  jobs,
  onDelete,
  isDeleting = false,
}: ImportJobsTableProps) => {
  const { t } = useTranslation();

  const columns: Column<ImportJobResponse>[] = useMemo(() => [
    {
      key: 'fileName',
      label: t('imports.filename'),
      render: (job) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{job.fileName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('imports.status'),
      render: (job) => <ImportStatusBadge status={job.status} />,
    },
    {
      key: 'progress',
      label: t('imports.progress'),
      render: (job) => {
        const processed = job.processedRows ?? 0;
        const total = job.totalRows ?? 0;
        const percentage = calculateProgress(processed, total);
        return (
          <div className="flex items-center gap-2">
            <span>{processed} / {total}</span>
            {total > 0 && (
              <span className="text-gray-500 text-sm">({percentage}%)</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'results',
      label: t('imports.results'),
      render: (job) => {
        const successful = job.successfulImports ?? 0;
        const failed = job.failedImports ?? 0;
        const skipped = job.skippedDuplicates ?? 0;
        return (
          <div className="flex gap-3 text-sm">
            <span className="text-green-600" title={t('imports.successful')}>
              {successful}
            </span>
            <span className={failed > 0 ? 'text-red-600' : 'text-gray-400'} title={t('imports.failed')}>
              {failed}
            </span>
            <span className="text-gray-500" title={t('imports.skipped')}>
              {skipped}
            </span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: t('imports.date'),
      render: (job) => (
        <span className="text-gray-600">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    ...(onDelete ? [{
      key: 'actions' as keyof ImportJobResponse,
      label: '',
      render: (job: ImportJobResponse) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(job.id)}
          disabled={isDeleting}
          aria-label={t('imports.deleteJob')}
        >
          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
        </Button>
      ),
    }] : []),
  ], [t, onDelete, isDeleting]);

  return (
    <DataTable
      data={jobs}
      columns={columns}
      keyExtractor={(job) => job.id}
    />
  );
};

export default ImportJobsTable;
