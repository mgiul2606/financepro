import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

export interface PageStateWrapperProps {
  isLoading: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  children: ReactNode;
}

const stateShell = 'p-8 flex items-center justify-center min-h-[400px] bg-background';

export const PageStateWrapper = ({
  isLoading,
  error,
  isEmpty = true,
  onRetry,
  loadingMessage,
  errorTitle,
  errorMessage,
  children,
}: PageStateWrapperProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={stateShell}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">{loadingMessage ?? t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && isEmpty) {
    return (
      <div className={stateShell}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-expense mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {errorTitle ?? t('common.errorLoadingData')}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {errorMessage ?? t('common.errorLoadingDataDesc')}
          </p>
          {onRetry && (
            <Button variant="default" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
