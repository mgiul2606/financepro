import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/core/components/atomic/Button';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import type { SmartConfirmResult } from '../imports.smart-types';

interface SmartImportResultProps {
  result: SmartConfirmResult;
  onReset: () => void;
}

export const SmartImportResult = ({ result, onReset }: SmartImportResultProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isSuccess = result.status === 'completed';
  const isPartial = result.status === 'partial';

  return (
    <Card variant="bordered">
      <CardHeader
        title={t('smartImport.result.title')}
        subtitle={
          isSuccess
            ? t('smartImport.result.subtitleSuccess')
            : isPartial
              ? t('smartImport.result.subtitlePartial')
              : t('smartImport.result.subtitleFailed')
        }
      />
      <CardBody>
        <div className="space-y-6">
          {/* Status icon */}
          <div className="flex justify-center">
            {isSuccess ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : isPartial ? (
              <AlertTriangle className="h-16 w-16 text-amber-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{result.imported}</div>
              <div className="text-sm text-green-600">{t('smartImport.result.imported')}</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-700">{result.skippedDuplicates}</div>
              <div className="text-sm text-neutral-500">{t('smartImport.result.skipped')}</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-700">{result.flaggedForReview}</div>
              <div className="text-sm text-amber-600">{t('smartImport.result.flagged')}</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{result.errors}</div>
              <div className="text-sm text-red-600">{t('smartImport.result.errors')}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="secondary"
              onClick={onReset}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              {t('smartImport.result.importAnother')}
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/transactions')}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {t('smartImport.result.viewTransactions')}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SmartImportResult;
