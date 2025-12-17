// src/hooks/useConfirm.ts
import { useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmContext } from '@/components/ConfirmDialog/ConfirmProvider';

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const useDeleteConfirm = () => {
  const confirm = useConfirm();
  const { t } = useTranslation();
  
  return useCallback((entityName: string = 'item') => {
    return confirm({
      title: t('confirm.deleteTitle', { entity: entityName }),
      message: t('confirm.deleteMessage', { entity: entityName.toLowerCase() }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
      confirmButtonVariant: 'destructive'
    });
  }, [confirm, t]);
};

export const useDiscardConfirm = () => {
  const confirm = useConfirm();
  const { t } = useTranslation();

  return useCallback(() => {
    return confirm({
      title: t('confirm.discardChangesTitle'),
      message: t('confirm.discardChangesMessage'),
      confirmText: t('confirm.discard'),
      cancelText: t('confirm.keepEditing'),
      variant: 'warning'
    });
  }, [confirm, t]);
};

export const useSaveConfirm = () => {
  const confirm = useConfirm();
  const { t } = useTranslation();

  return useCallback((message?: string) => {
    return confirm({
      title: t('confirm.saveChangesTitle'),
      message: message || t('confirm.saveChangesMessage'),
      confirmText: t('common.save'),
      cancelText: t('common.cancel'),
      variant: 'info'
    });
  }, [confirm, t]);
};