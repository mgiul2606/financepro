// src/hooks/index.ts
// Re-export all hooks for easier imports

export { 
  useConfirm,
  useDeleteConfirm,
  useDiscardConfirm,
  useSaveConfirm,
  ConfirmProvider,
  simpleConfirm
} from './useConfirm';
export type { ConfirmOptions } from './useConfirm';

export { 
  useCrud,
  useOptimisticCrud
} from './useCrud';
export type { 
  CrudState, 
  CrudActions, 
  UseCrudOptions 
} from './useCrud';
// Confirm hooks
export { 
  useConfirm,
  useDeleteConfirm,
  useDiscardConfirm,
  useSaveConfirm,
  ConfirmProvider,
  simpleConfirm
} from './useConfirm';
export type { ConfirmOptions } from './useConfirm';

// CRUD hooks
export { 
  useCrud,
  useOptimisticCrud
} from './useCrud';
export type { 
  CrudState, 
  CrudActions, 
  UseCrudOptions 
} from './useCrud';
