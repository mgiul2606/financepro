// src/components/ConfirmDialog/types.ts
import type { ReactNode } from 'react';

export interface ConfirmOptions {
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success' | 'default';
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  showIcon?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}