// features/categories/components/CategoryManagementCard.tsx
import { useTranslation } from 'react-i18next';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useConfirm } from '@/hooks/useConfirm';
import { useCrudModal } from '@/hooks/useCrudModal';

import type { CategoryResponse, CategoryCreate, CategoryUpdate } from '@/api/generated/models';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../categories.hooks';
import { useCategoryName } from '../useCategoryName';
import { CategoryForm } from './CategoryForm';

export const CategoryManagementCard = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const { categories, isLoading, error: loadError } = useCategories();
  const getCategoryName = useCategoryName();
  const { createCategory, isCreating, error: createError, reset: resetCreate } = useCreateCategory();
  const { updateCategory, isUpdating, error: updateError, reset: resetUpdate } = useUpdateCategory();
  const { deleteCategory, isDeleting } = useDeleteCategory();

  const crud = useCrudModal<CategoryResponse, CategoryCreate, CategoryUpdate>({
    useCreate: () => ({ isCreating, error: createError as Error | null, reset: resetCreate }),
    useUpdate: () => ({ isUpdating, error: updateError as Error | null, reset: resetUpdate }),
    useDelete: () => ({ isDeleting, error: null, reset: () => {} }),
    createFn: async (data) => {
      const res = await createCategory(data);
      return (res as { data: CategoryResponse }).data ?? (res as unknown as CategoryResponse);
    },
    updateFn: async (id, data) => {
      const res = await updateCategory(id, data);
      return (res as { data: CategoryResponse }).data ?? (res as unknown as CategoryResponse);
    },
    deleteFn: async (id) => {
      await deleteCategory(id);
    },
    confirmDelete: async (category) => {
      return await confirm({
        title: t('categories.deleteCategory'),
        message: t('categories.deleteConfirm', { name: getCategoryName(category) }),
        confirmText: t('common.delete'),
        variant: 'danger',
        confirmButtonVariant: 'destructive',
      });
    },
  });

  return (
    <>
      <Card variant="bordered">
        <CardHeader
          title={t('categories.title')}
          subtitle={t('categories.subtitle')}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => crud.openCreateModal()}
              disabled={crud.isCreating}
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              {t('categories.newCategory')}
            </Button>
          }
        />
        <CardBody>
          {loadError && (
            <Alert className="mb-4 border-rose-200 bg-rose-50 text-rose-800">
              <AlertDescription>{t('categories.errors.loadFailed')}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-gray-500">{t('categories.noCategories')}</p>
              <p className="mt-1 text-xs text-gray-400">{t('categories.noCategoriesDesc')}</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => crud.openCreateModal()}
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                {t('categories.createCategory')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2.5 text-left">{t('categories.name')}</th>
                    <th className="px-3 py-2.5 text-left">{t('categories.type')}</th>
                    <th className="px-3 py-2.5 text-left">{t('categories.color')}</th>
                    <th className="px-3 py-2.5 text-left">{t('categories.statusLabel')}</th>
                    <th className="px-3 py-2.5 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon + Name + Sistema badge */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span className="text-base leading-none">{category.icon}</span>
                          )}
                          <span className="font-medium text-gray-900">{getCategoryName(category)}</span>
                          {category.isSystem && (
                            <span
                              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                              title={t('categories.systemCategoryDesc')}
                            >
                              {t('categories.systemCategory')}
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="mt-0.5 text-xs text-gray-400 truncate max-w-xs">
                            {category.description}
                          </p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-3 py-3">
                        <Badge
                          variant={category.isIncome ? 'default' : 'secondary'}
                          className={
                            category.isIncome
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-orange-50 text-orange-700 border-orange-100'
                          }
                        >
                          {category.isIncome
                            ? t('categories.types.income')
                            : t('categories.types.expense')}
                        </Badge>
                      </td>

                      {/* Color swatch */}
                      <td className="px-3 py-3">
                        {category.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-200 shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                              {category.color}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={
                            category.isActive !== false
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-gray-50 text-gray-500'
                          }
                        >
                          {category.isActive !== false
                            ? t('categories.status.active')
                            : t('categories.status.inactive')}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => crud.openEditModal(category)}
                            disabled={crud.isUpdating}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                            title={t('common.edit')}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => crud.handleDelete(category)}
                            disabled={!!category.isSystem || crud.isDeleting}
                            className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              category.isSystem
                                ? t('categories.systemCategoryDesc')
                                : t('categories.deleteCategory')
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Dialog
        open={crud.showCreateModal}
        onOpenChange={(open) => {
          if (!crud.isCreating && !open) crud.closeCreateModal();
        }}
      >
        <DialogContent className="sm:max-w-[480px] rounded-xl">
          <DialogHeader>
            <DialogTitle>{t('categories.createCategory')}</DialogTitle>
            <DialogDescription>{t('categories.subtitle')}</DialogDescription>
          </DialogHeader>

          <CategoryForm
            onSubmit={crud.handleCreate}
            isLoading={crud.isCreating}
            error={crud.createError ? t('categories.errors.createFailed') : undefined}
            onClearError={crud.resetCreate}
          />

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => crud.closeCreateModal()}
              disabled={crud.isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="category-form"
              disabled={crud.isCreating}
            >
              {crud.isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('common.creating')}
                </>
              ) : (
                t('categories.createCategory')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={!!crud.editingEntity}
        onOpenChange={(open) => {
          if (!crud.isUpdating && !open) crud.closeEditModal();
        }}
      >
        <DialogContent className="sm:max-w-[480px] rounded-xl">
          <DialogHeader>
            <DialogTitle>{t('categories.editCategory')}</DialogTitle>
            <DialogDescription>
              {crud.editingEntity?.name}
            </DialogDescription>
          </DialogHeader>

          {crud.editingEntity && (
            <CategoryForm
              category={crud.editingEntity}
              onSubmit={crud.handleUpdate}
              isLoading={crud.isUpdating}
              error={crud.updateError ? t('categories.errors.updateFailed') : undefined}
              onClearError={crud.resetUpdate}
            />
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => crud.closeEditModal()}
              disabled={crud.isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="category-form"
              disabled={crud.isUpdating}
            >
              {crud.isUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
