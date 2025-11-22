// src/features/imports/pages/ImportsPage.tsx
import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { DataTable, type Column } from '@/core/components/composite/DataTable';

interface ImportJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recordsTotal: number;
  recordsProcessed: number;
  errors: number;
  createdAt: string;
}

export const ImportsPage = () => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importJobs] = useState<ImportJob[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const columns: Column<ImportJob>[] = [
    {
      key: 'filename',
      label: t('imports.filename'),
      render: (job) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{job.filename}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('imports.status'),
      render: (job) => (
        <Badge
          variant={
            job.status === 'completed'
              ? 'success'
              : job.status === 'failed'
                ? 'danger'
                : job.status === 'processing'
                  ? 'warning'
                  : 'info'
          }
        >
          {job.status}
        </Badge>
      ),
    },
    {
      key: 'progress',
      label: t('imports.progress'),
      render: (job) => (
        <span>
          {job.recordsProcessed} / {job.recordsTotal}
        </span>
      ),
    },
    {
      key: 'errors',
      label: t('imports.errors'),
      render: (job) => (
        <span className={job.errors > 0 ? 'text-red-600' : 'text-green-600'}>
          {job.errors}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: t('imports.date'),
      render: (job) => new Date(job.createdAt).toLocaleDateString(),
    },
  ];

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
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {t('imports.dragAndDrop')}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t('imports.supportedFormats')}
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="secondary" as="span">
                {t('imports.selectFile')}
              </Button>
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedFile(null)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary">
                  {t('imports.startImport')}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Import History */}
      <Card variant="bordered">
        <CardHeader
          title={t('imports.importHistory')}
          subtitle={t('imports.recentImports')}
        />
        <CardBody>
          {importJobs.length > 0 ? (
            <DataTable
              data={importJobs}
              columns={columns}
              keyExtractor={(job) => job.id}
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
