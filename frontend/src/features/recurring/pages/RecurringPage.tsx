/**
 * Recurring Transactions Page
 * Lists and manages recurring income/expense transactions
 * Follows the AccountsPage.tsx architecture pattern
 */
import { useState } from 'react';
import {
  PlusCircle,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Pause,
  Play,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Custom components
import { CurrencyText } from '@/core/components/atomic';
import { useConfirm } from '@/hooks/useConfirm';
import { useCrudModal } from '@/hooks/useCrudModal';

// Feature imports
import {
  useRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useRecurringSummary,
  useToggleRecurringStatus,
} from '../recurring.hooks';
import type {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  Frequency,
} from '../recurring.types';
import { FREQUENCY_DAYS } from '../recurring.constants';
import { RecurringForm } from '../components/RecurringForm';
import type { SupportedCurrency } from '@/utils/currency';

// ============================================================================
// TYPES
// ============================================================================

type FrequencyBadgeVariant = 'default' | 'secondary' | 'outline';

// ============================================================================
// COMPONENT
// ============================================================================

export const RecurringPage = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  // State for deleting indicator
  const [deletingRecurringId, setDeletingRecurringId] = useState<string | null>(null);

  // Data fetching
  const { recurring, isLoading, error: loadError } = useRecurring();
  const summary = useRecurringSummary();

  // Mutations
  const { createRecurring, isCreating, error: createError, reset: resetCreate } = useCreateRecurring();
  const { updateRecurring, isUpdating, error: updateError, reset: resetUpdate } = useUpdateRecurring();
  const { deleteRecurring, isDeleting } = useDeleteRecurring();
  const { toggleStatus, isToggling } = useToggleRecurringStatus();

  // CRUD Modal management
  const crud = useCrudModal<RecurringTransaction, RecurringTransactionCreate, RecurringTransactionUpdate>({
    useCreate: () => ({ isCreating, error: createError, reset: resetCreate }),
    useUpdate: () => ({ isUpdating, error: updateError, reset: resetUpdate }),
    useDelete: () => ({ isDeleting, error: null, reset: () => {} }),
    createFn: createRecurring,
    updateFn: async (id: string, data: RecurringTransactionUpdate) => {
      return updateRecurring(id, data);
    },
    deleteFn: async (id: string) => {
      setDeletingRecurringId(id);
      try {
        await deleteRecurring(id);
      } finally {
        setDeletingRecurringId(null);
      }
    },
    confirmDelete: async (recurringTxn) => {
      return await confirm({
        title: t('recurring.deleteRecurring'),
        message: t('recurring.deleteConfirm', { name: recurringTxn.name }),
        confirmText: t('common.delete'),
        variant: 'danger',
        confirmButtonVariant: 'destructive',
      });
    },
  });

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const getFrequencyLabel = (frequency: Frequency, interval: number): string => {
    if (interval === 1) {
      return t(`recurring.frequency.${frequency}`);
    }
    return t('recurring.frequency.every', {
      interval,
      frequency: t(`recurring.frequency.${frequency}`),
    });
  };

  const getFrequencyBadgeVariant = (frequency: Frequency): FrequencyBadgeVariant => {
    switch (frequency) {
      case 'daily':
      case 'weekly':
        return 'secondary';
      case 'monthly':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getMonthlyEquivalent = (amount: number, frequency: Frequency, interval: number): number => {
    const daysInFrequency = FREQUENCY_DAYS[frequency] || 30;
    const monthlyMultiplier = 30 / (daysInFrequency * interval);
    return amount * monthlyMultiplier;
  };

  const getDaysUntilNext = (nextOccurrence: string | null | undefined): number | null => {
    if (!nextOccurrence) return null;
    const next = new Date(nextOccurrence);
    const today = new Date();
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleToggleStatus = async (recurringTxn: RecurringTransaction) => {
    try {
      await toggleStatus(recurringTxn.id, recurringTxn.isActive);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('recurring.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('recurring.subtitle')}</p>
        </div>
        <Button
          onClick={() => crud.openCreateModal()}
          disabled={crud.isCreating}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('recurring.addRecurring')}
        </Button>
      </div>

      {/* Error Alert */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{t('recurring.errors.loadFailed')}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {recurring.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Monthly Income */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('recurring.monthlyIncome')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                <CurrencyText value={summary.monthlyIncome} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('recurring.activeRecurring', { count: summary.activeCount })}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('recurring.monthlyExpenses')}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                <CurrencyText value={summary.monthlyExpenses} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('recurring.pausedRecurring', { count: summary.pausedCount })}
              </p>
            </CardContent>
          </Card>

          {/* Net Monthly */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('recurring.netMonthly')}
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <CurrencyText value={summary.netMonthly} showSign />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('recurring.projectedCashFlow')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {recurring.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <RefreshCw className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">{t('recurring.noRecurringYet')}</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
              {t('recurring.addFirstRecurring')}
            </p>
            <Button
              onClick={() => crud.openCreateModal()}
              className="mt-6"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('recurring.addRecurring')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Recurring Cards Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recurring.map((recurringTxn) => {
            const monthlyEquivalent = getMonthlyEquivalent(
              recurringTxn.amount,
              recurringTxn.frequency,
              recurringTxn.interval
            );
            const daysUntil = getDaysUntilNext(recurringTxn.nextOccurrence);
            const isIncome = recurringTxn.transactionType === 'income';

            return (
              <Card
                key={recurringTxn.id}
                className={`relative transition-all hover:shadow-lg ${
                  deletingRecurringId === recurringTxn.id ? 'opacity-50 pointer-events-none' : ''
                } ${!recurringTxn.isActive ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isIncome ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <RefreshCw className={`h-5 w-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{recurringTxn.name}</CardTitle>
                        <CardDescription>
                          {getFrequencyLabel(recurringTxn.frequency, recurringTxn.interval)}
                        </CardDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={deletingRecurringId === recurringTxn.id || isToggling}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => crud.openEditModal(recurringTxn)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(recurringTxn)}>
                          {recurringTxn.isActive ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              {t('recurring.pause')}
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              {t('recurring.resume')}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => crud.handleDelete(recurringTxn)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Badge variant={getFrequencyBadgeVariant(recurringTxn.frequency)}>
                      {t(`recurring.frequency.${recurringTxn.frequency}`)}
                    </Badge>
                    {!recurringTxn.isActive && (
                      <Badge variant="secondary">{t('recurring.paused')}</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />

                  {/* Amount */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('recurring.amount')}
                    </p>
                    <p className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}
                      <CurrencyText
                        value={recurringTxn.amount}
                        currency={recurringTxn.currency as SupportedCurrency}
                      />
                    </p>
                  </div>

                  {/* Monthly Equivalent */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('recurring.monthlyEquivalent')}
                    </span>
                    <span className={`font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}
                      <CurrencyText
                        value={monthlyEquivalent}
                        currency={recurringTxn.currency as SupportedCurrency}
                      />
                    </span>
                  </div>

                  {/* Next Occurrence */}
                  {recurringTxn.nextOccurrence && recurringTxn.isActive && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t('recurring.nextDate')}
                      </span>
                      <span className="font-medium">
                        {new Date(recurringTxn.nextOccurrence).toLocaleDateString()}
                        {daysUntil !== null && daysUntil >= 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({t('recurring.daysUntil', { days: daysUntil })})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>

                {deletingRecurringId === recurringTxn.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm font-medium">{t('common.deleting')}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={crud.showCreateModal} onOpenChange={(open) => {
        if (!crud.isCreating) {
          if (!open) {
            crud.closeCreateModal();
          } else {
            crud.setShowCreateModal(open);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('recurring.createRecurring')}</DialogTitle>
            <DialogDescription>
              {t('recurring.createRecurringDesc')}
            </DialogDescription>
          </DialogHeader>

          <RecurringForm
            onSubmit={crud.handleCreate}
            isLoading={crud.isCreating}
            error={crud.createError ? t('recurring.errors.createFailed') : undefined}
            onClearError={crud.resetCreate}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => crud.closeCreateModal()}
              disabled={crud.isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="recurring-form"
              disabled={crud.isCreating}
            >
              {crud.isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('common.creating')}
                </>
              ) : (
                t('recurring.createRecurring')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!crud.editingEntity} onOpenChange={(open) => {
        if (!crud.isUpdating) {
          if (!open) {
            crud.closeEditModal();
          }
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('recurring.editRecurring')}</DialogTitle>
            <DialogDescription>
              {t('recurring.editRecurringDesc')}
            </DialogDescription>
          </DialogHeader>

          {crud.editingEntity && (
            <RecurringForm
              recurring={crud.editingEntity}
              onSubmit={crud.handleUpdate}
              isLoading={crud.isUpdating}
              error={crud.updateError ? t('recurring.errors.updateFailed') : undefined}
              onClearError={crud.resetUpdate}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => crud.closeEditModal()}
              disabled={crud.isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="recurring-form"
              disabled={crud.isUpdating}
            >
              {crud.isUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringPage;
