// features/transactions/pages/TransactionsPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';

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

// Custom components
import { CurrencyText } from '@/core/components/atomic';
import { useConfirm } from '@/hooks/useConfirm';
import { useCrudModal } from '@/hooks/useCrudModal';

import {
  useTransactionsWithUIFilters,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useTransactionStats,
} from '../transactions.hooks';
import type {
  TransactionResponse,
  TransactionCreate,
  TransactionUpdate,
} from '@/api/generated/models';
import type { TransactionUIFilters } from '../transactions.types';
import type { SupportedCurrency } from '@/utils/currency';
import { TransactionForm } from '..';
import { TransactionFilterModal } from '../components/TransactionFilterModal';
import { TransactionExportModal } from '../components/TransactionExportModal';

export const TransactionsPage = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter and modal states
  const [filters, setFilters] = useState<TransactionUIFilters>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Initialize filters from URL query parameters
  useEffect(() => {
    const accountId = searchParams.get('account_id');
    if (accountId) {
      setFilters((prev) => ({ ...prev, accountId }));
    }
  }, [searchParams]);

  // Data fetching using the UI-aware hook
  const { transactions, isLoading, error: loadError } = useTransactionsWithUIFilters(filters);
  const { stats } = useTransactionStats();

  // Mutations
  const { createTransaction, isCreating, error: createError, reset: resetCreate } =
    useCreateTransaction();
  const { updateTransaction, isUpdating, error: updateError, reset: resetUpdate } =
    useUpdateTransaction();
  const { deleteTransaction, isDeleting } = useDeleteTransaction();

  // CRUD Modal management
  const crud = useCrudModal<TransactionResponse, TransactionCreate, TransactionUpdate>({
    useCreate: () => ({ isCreating, error: createError, reset: resetCreate }),
    useUpdate: () => ({ isUpdating, error: updateError, reset: resetUpdate }),
    useDelete: () => ({ isDeleting, error: null, reset: () => {} }),
    createFn: createTransaction,
    updateFn: updateTransaction,
    deleteFn: async (id: string) => {
      setDeletingTransactionId(id);
      try {
        await deleteTransaction(id);
      } finally {
        setDeletingTransactionId(null);
      }
    },
    confirmDelete: async (transaction) => {
      return await confirm({
        title: t('transactions.deleteTransaction'),
        message: t('transactions.deleteConfirm', { description: transaction.description }),
        confirmText: t('common.delete'),
        variant: 'danger',
        confirmButtonVariant: 'destructive',
      });
    },
  });

  // The hook already applies all UI filters (types[], categories[], amount range, etc.)
  // We just need to ensure the transactions array is properly handled
  const filteredTransactions = useMemo(() => {
    return transactions ?? [];
  }, [transactions]);

  const handleApplyFilters = (newFilters: TransactionUIFilters) => {
    setFilters(newFilters);
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchParams({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  // Loading state with Skeleton
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
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('transactions.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            disabled={crud.isCreating}
          >
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filter')}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            disabled={!filteredTransactions || filteredTransactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button onClick={() => crud.openCreateModal()} disabled={crud.isCreating}>
            <Plus className="mr-2 h-4 w-4" />
            {t('transactions.newTransaction')}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{t('transactions.errors.loadFailed')}</AlertDescription>
        </Alert>
      )}

      {/* Active Filters Banner */}
      {activeFiltersCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                {activeFiltersCount} {t('common.filter').toLowerCase()}
                {activeFiltersCount > 1 ? 's' : ''} active
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
          <div className="text-sm text-blue-800">
            Showing <strong>{filteredTransactions.length}</strong> of{' '}
            <strong>{transactions?.length || 0}</strong> {t('transactions.title').toLowerCase()}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('transactions.totalIncome')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                <CurrencyText value={parseFloat(stats.totalIncome)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('transactions.totalExpenses')}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                <CurrencyText value={parseFloat(stats.totalExpenses)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('transactions.balance')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyText value={parseFloat(stats.netBalance)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <DollarSign className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">
              {activeFiltersCount > 0
                ? 'No transactions match your filters'
                : t('transactions.noTransactions')}
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
              {activeFiltersCount > 0
                ? 'Try adjusting your filter criteria'
                : t('transactions.noTransactionsDesc')}
            </p>
            <Button
              onClick={() =>
                activeFiltersCount > 0 ? handleClearFilters() : crud.openCreateModal()
              }
              className="mt-6"
            >
              {activeFiltersCount > 0 ? (
                <>Clear Filters</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('transactions.createTransaction')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('transactions.allTransactions')}</CardTitle>
            <CardDescription>
              {filteredTransactions.length} {t('transactions.title').toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const amount = parseFloat(transaction.amount.toString());
                const isIncome = transaction.transactionType === 'income';

                return (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      deletingTransactionId === transaction.id
                        ? 'opacity-50 pointer-events-none'
                        : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{transaction.description}</div>
                        <Badge variant={isIncome ? 'default' : 'secondary'}>
                          {t(`transactions.types.${transaction.transactionType}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                        </span>
                        {transaction.merchantName && <span>• {transaction.merchantName}</span>}
                        {transaction.categoryId && <span>• Category: {transaction.categoryId}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-lg font-semibold ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <CurrencyText
                          value={amount}
                          currency={transaction.currency as SupportedCurrency}
                          showSign
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={deletingTransactionId === transaction.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => crud.openEditModal(transaction)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => crud.handleDelete(transaction)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog
        open={crud.showCreateModal}
        onOpenChange={(open) => {
          if (!crud.isCreating) {
            if (!open) {
              crud.closeCreateModal();
            } else {
              crud.setShowCreateModal(open);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('transactions.createTransaction')}</DialogTitle>
            <DialogDescription>
              {t('transactions.createTransactionDesc', 'Add a new transaction to your account.')}
            </DialogDescription>
          </DialogHeader>

          <TransactionForm
            onSubmit={crud.handleCreate}
            isLoading={crud.isCreating}
            error={crud.createError ? t('transactions.errors.createFailed') : undefined}
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
            <Button type="submit" form="transaction-form" disabled={crud.isCreating}>
              {crud.isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('common.creating')}
                </>
              ) : (
                t('transactions.createTransaction')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={!!crud.editingEntity}
        onOpenChange={(open) => {
          if (!crud.isUpdating) {
            if (!open) {
              crud.closeEditModal();
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('transactions.editTransaction')}</DialogTitle>
            <DialogDescription>
              {t('transactions.editTransactionDesc', 'Update transaction information.')}
            </DialogDescription>
          </DialogHeader>

          {crud.editingEntity && (
            <TransactionForm
              transaction={crud.editingEntity}
              onSubmit={crud.handleUpdate}
              isLoading={crud.isUpdating}
              error={crud.updateError ? t('transactions.errors.updateFailed') : undefined}
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
            <Button type="submit" form="transaction-form" disabled={crud.isUpdating}>
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

      {/* Filter Modal */}
      <TransactionFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />

      {/* Export Modal */}
      <TransactionExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={filteredTransactions}
        includeFilters={activeFiltersCount > 0}
      />
    </div>
  );
};
