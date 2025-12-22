/**
 * Generic CRUD modal state management hook for React Query
 *
 * This hook manages the common state and handlers for CRUD operations
 * using modals. It works with React Query mutation hooks and provides
 * type-safe handlers for create, update, and delete operations.
 *
 * @example
 * ```tsx
 * const { createAccount, ...createMutation } = useCreateAccount();
 * const { updateAccount, ...updateMutation } = useUpdateAccount();
 * const { deleteAccount, ...deleteMutation } = useDeleteAccount();
 *
 * const crud = useCrudModal<AccountResponse, AccountCreate, AccountUpdate>({
 *   useCreate: () => createMutation,
 *   useUpdate: () => updateMutation,
 *   useDelete: () => deleteMutation,
 *   createFn: createAccount,
 *   updateFn: updateAccount,
 *   deleteFn: deleteAccount,
 *   confirmDelete: async (account) => {
 *     return await confirm({
 *       title: 'Delete Account',
 *       message: `Are you sure you want to delete ${account.name}?`,
 *     });
 *   },
 * });
 *
 * // Usage in component:
 * <Dialog open={crud.showCreateModal} onOpenChange={crud.setShowCreateModal}>
 *   <Form onSubmit={crud.handleCreate} isLoading={crud.isCreating} />
 * </Dialog>
 * ```
 */
import { useState, useCallback } from 'react';

/**
 * Entity with an ID field (most common case)
 */
export type EntityWithId = {
  id: string;
  [key: string]: unknown;
};

/**
 * Structure returned by a create mutation hook
 * Flexible to accept any property name for the create function
 */
export interface CreateMutationHook<TCreate, TResponse> {
  [key: string]: unknown;
  isCreating?: boolean;
  error?: Error | null;
  reset?: () => void;
}

/**
 * Structure returned by an update mutation hook
 * Flexible to accept any property name for the update function
 */
export interface UpdateMutationHook<TUpdate, TResponse> {
  [key: string]: unknown;
  isUpdating?: boolean;
  error?: Error | null;
  reset?: () => void;
}

/**
 * Structure returned by a delete mutation hook
 * Flexible to accept any property name for the delete function
 */
export interface DeleteMutationHook {
  [key: string]: unknown;
  isDeleting?: boolean;
  error?: Error | null;
  reset?: () => void;
}

/**
 * Options for useCrudModal hook
 */
export interface UseCrudModalOptions<TEntity extends EntityWithId, TCreate, TUpdate> {
  /**
   * Hook that returns create mutation state
   * Should return an object with: { isCreating, error, reset }
   */
  useCreate: () => CreateMutationHook<TCreate, TEntity>;

  /**
   * Hook that returns update mutation state
   * Should return an object with: { isUpdating, error, reset }
   */
  useUpdate: () => UpdateMutationHook<TUpdate, TEntity>;

  /**
   * Hook that returns delete mutation state
   * Should return an object with: { isDeleting, error, reset }
   */
  useDelete: () => DeleteMutationHook;

  /**
   * Function to create an entity
   * Extracted from the create mutation hook
   */
  createFn: (data: TCreate) => Promise<TEntity>;

  /**
   * Function to update an entity
   * Extracted from the update mutation hook
   */
  updateFn: (id: string, data: TUpdate) => Promise<TEntity>;

  /**
   * Function to delete an entity
   * Extracted from the delete mutation hook
   */
  deleteFn: (id: string) => Promise<void>;

  /**
   * Optional confirmation callback before delete
   * If provided, will be called before executing delete
   * Return true to proceed with delete, false to cancel
   */
  confirmDelete?: (entity: TEntity) => Promise<boolean>;

  /**
   * Optional callback after successful create
   */
  onCreateSuccess?: (entity: TEntity) => void;

  /**
   * Optional callback after successful update
   */
  onUpdateSuccess?: (entity: TEntity) => void;

  /**
   * Optional callback after successful delete
   */
  onDeleteSuccess?: (id: string) => void;

  /**
   * Optional callback for create error
   */
  onCreateError?: (error: Error) => void;

  /**
   * Optional callback for update error
   */
  onUpdateError?: (error: Error) => void;

  /**
   * Optional callback for delete error
   */
  onDeleteError?: (error: Error) => void;
}

/**
 * Return type of useCrudModal hook
 */
export interface UseCrudModalReturn<TEntity extends EntityWithId, TCreate, TUpdate> {
  // Modal state
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  editingEntity: TEntity | null;
  setEditingEntity: (entity: TEntity | null) => void;

  // Handlers
  handleCreate: (data: TCreate) => Promise<void>;
  handleUpdate: (data: TUpdate) => Promise<void>;
  handleDelete: (entity: TEntity) => Promise<void>;

  // Mutation states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createError: Error | null;
  updateError: Error | null;
  deleteError: Error | null;

  // Utilities
  resetCreate: () => void;
  resetUpdate: () => void;
  resetDelete: () => void;
  closeCreateModal: () => void;
  closeEditModal: () => void;
  openCreateModal: () => void;
  openEditModal: (entity: TEntity) => void;
}

/**
 * Generic hook for managing CRUD modal state and operations
 *
 * This hook encapsulates the common pattern of:
 * - Managing create/edit modal states
 * - Handling create/update/delete operations
 * - Managing loading states and errors
 * - Providing convenient helpers for opening/closing modals
 *
 * Works seamlessly with React Query mutation hooks.
 */
export function useCrudModal<
  TEntity extends EntityWithId,
  TCreate,
  TUpdate
>(
  options: UseCrudModalOptions<TEntity, TCreate, TUpdate>
): UseCrudModalReturn<TEntity, TCreate, TUpdate> {
  const {
    useCreate,
    useUpdate,
    useDelete,
    createFn,
    updateFn,
    deleteFn,
    confirmDelete,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onCreateError,
    onUpdateError,
    onDeleteError,
  } = options;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<TEntity | null>(null);

  // Get mutation hooks
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  // Extract mutation states
  const {
    isCreating = false,
    error: createError = null,
    reset: resetCreate = () => {},
  } = createMutation;

  const {
    isUpdating = false,
    error: updateError = null,
    reset: resetUpdate = () => {},
  } = updateMutation;

  const {
    isDeleting = false,
    error: deleteError = null,
    reset: resetDelete = () => {},
  } = deleteMutation;

  /**
   * Handle create operation
   */
  const handleCreate = useCallback(
    async (data: TCreate): Promise<void> => {
      try {
        const result = await createFn(data);
        setShowCreateModal(false);
        resetCreate();
        onCreateSuccess?.(result);
      } catch (error) {
        console.error('Failed to create entity:', error);
        onCreateError?.(error as Error);
        throw error;
      }
    },
    [createFn, resetCreate, onCreateSuccess, onCreateError]
  );

  /**
   * Handle update operation
   */
  const handleUpdate = useCallback(
    async (data: TUpdate): Promise<void> => {
      if (!editingEntity) {
        console.warn('No entity selected for update');
        return;
      }

      try {
        const result = await updateFn(editingEntity.id, data);
        setEditingEntity(null);
        resetUpdate();
        onUpdateSuccess?.(result);
      } catch (error) {
        console.error('Failed to update entity:', error);
        onUpdateError?.(error as Error);
        throw error;
      }
    },
    [editingEntity, updateFn, resetUpdate, onUpdateSuccess, onUpdateError]
  );

  /**
   * Handle delete operation with optional confirmation
   */
  const handleDelete = useCallback(
    async (entity: TEntity): Promise<void> => {
      // Check for confirmation if callback provided
      if (confirmDelete) {
        const confirmed = await confirmDelete(entity);
        if (!confirmed) {
          return;
        }
      }

      try {
        await deleteFn(entity.id);
        onDeleteSuccess?.(entity.id);
      } catch (error) {
        console.error('Failed to delete entity:', error);
        onDeleteError?.(error as Error);
        throw error;
      }
    },
    [deleteFn, confirmDelete, onDeleteSuccess, onDeleteError]
  );

  /**
   * Helper to close create modal and reset errors
   */
  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetCreate();
  }, [resetCreate]);

  /**
   * Helper to close edit modal and reset errors
   */
  const closeEditModal = useCallback(() => {
    setEditingEntity(null);
    resetUpdate();
  }, [resetUpdate]);

  /**
   * Helper to open create modal
   */
  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  /**
   * Helper to open edit modal with entity
   */
  const openEditModal = useCallback((entity: TEntity) => {
    setEditingEntity(entity);
  }, []);

  return {
    // Modal state
    showCreateModal,
    setShowCreateModal,
    editingEntity,
    setEditingEntity,

    // Handlers
    handleCreate,
    handleUpdate,
    handleDelete,

    // Mutation states
    isCreating,
    isUpdating,
    isDeleting,
    createError: createError ?? null,
    updateError: updateError ?? null,
    deleteError: deleteError ?? null,

    // Utilities
    resetCreate,
    resetUpdate,
    resetDelete,
    closeCreateModal,
    closeEditModal,
    openCreateModal,
    openEditModal,
  };
}
