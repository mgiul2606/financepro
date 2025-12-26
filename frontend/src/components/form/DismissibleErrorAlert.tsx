// components/form/DismissibleErrorAlert.tsx
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DismissibleErrorAlertProps {
  /** The error message to display */
  error: string;
  /** Optional callback when the dismiss button is clicked */
  onDismiss?: () => void;
  /** Optional custom dismiss button text (defaults to translated 'common.dismiss') */
  dismissText?: string;
}

/**
 * A reusable error alert component with optional dismiss functionality
 */
export function DismissibleErrorAlert({
  error,
  onDismiss,
  dismissText,
}: DismissibleErrorAlertProps) {
  const { t } = useTranslation();

  return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm underline hover:no-underline"
          >
            {dismissText || t('common.dismiss')}
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
