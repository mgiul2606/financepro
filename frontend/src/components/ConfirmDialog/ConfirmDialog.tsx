// src/components/ConfirmDialog/ConfirmDialog.tsx
import { useTranslation } from 'react-i18next';
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
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfirmOptions } from './types.ts';

interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmOptions;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
}

const getVariantConfig = (t: (key: string) => string) => ({
  danger: {
    icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
    iconBgClass: 'bg-destructive/10',
    defaultTitle: t('confirm.deletionTitle'),
    defaultVariant: 'destructive' as const
  },
  warning: {
    icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
    iconBgClass: 'bg-yellow-50',
    defaultTitle: t('confirm.warningTitle'),
    defaultVariant: 'default' as const
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-600" />,
    iconBgClass: 'bg-blue-50',
    defaultTitle: t('confirm.infoTitle'),
    defaultVariant: 'default' as const
  },
  success: {
    icon: <CheckCircle className="h-6 w-6 text-green-600" />,
    iconBgClass: 'bg-green-50',
    defaultTitle: t('confirm.successTitle'),
    defaultVariant: 'default' as const
  },
  default: {
    icon: <Info className="h-6 w-6 text-muted-foreground" />,
    iconBgClass: 'bg-muted',
    defaultTitle: t('confirm.defaultTitle'),
    defaultVariant: 'default' as const
  }
});

export const ConfirmDialog = ({
  isOpen,
  options,
  loading,
  onConfirm,
  onCancel,
  onOpenChange
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const variant = options.variant || 'default';
  const variantConfig = getVariantConfig(t);
  const config = variantConfig[variant];
  const confirmButtonVariant = options.confirmButtonVariant || config.defaultVariant;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {options.showIcon !== false && (
            <div className="flex justify-center mb-4">
              <div className={cn(
                'flex items-center justify-center h-12 w-12 rounded-full',
                config.iconBgClass
              )}>
                {config.icon}
              </div>
            </div>
          )}
          <AlertDialogTitle className="text-center">
            {options.title || config.defaultTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {typeof options.message === 'string' ? (
              options.message
            ) : (
              <div>{options.message}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel
            onClick={onCancel}
            disabled={loading}
          >
            {options.cancelText || t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              confirmButtonVariant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
            asChild
          >
            <Button variant={confirmButtonVariant} disabled={loading}>
              {loading ? t('common.processing') : (options.confirmText || t('common.confirm'))}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};