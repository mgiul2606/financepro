// src/hooks/index.ts
// Re-export all hooks for easier imports

// Confirm hooks
export {
  useConfirm,
  useDeleteConfirm,
  useDiscardConfirm,
  useSaveConfirm,
  ConfirmProvider,
} from './useConfirm';
export type { ConfirmOptions } from '@/components/ConfirmDialog/types';
