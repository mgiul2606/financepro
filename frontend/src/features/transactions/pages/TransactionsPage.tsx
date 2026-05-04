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
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/utils/currency';
import { usePreferences } from '@/contexts/PreferencesContext';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
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
import { CurrencyText } from '@/core/components/formatters';
import { useConfirm } from '@/hooks/useConfirm';
import { useCrudModal } from '@/hooks/useCrudModal';

import {
  useTransactionsWithUIFilters,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../transactions.hooks';
import { useCategories, useCategoryName } from '@/features/categories';
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
import { getApiErrorMessage } from '@/lib/form-utils';

export const TransactionsPage = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter and modal states - initialize accountId from URL on first render
  const [filters, setFilters] = useState<TransactionUIFilters>(() => {
    const accountId = searchParams.get('account_id');
    return accountId ? { accountId } : {};
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Sync accountId filter when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const accountId = searchParams.get('account_id');
    setFilters((prev) => {
      if (accountId) {
        return { ...prev, accountId };
      }
      if (prev.accountId) {
        const { accountId: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, [searchParams]);

  // Data fetching using the UI-aware hook
  const { transactions, isLoading, error: loadError, refetch } = useTransactionsWithUIFilters(filters);
  const { categories } = useCategories();
  const getCategoryName = useCategoryName();

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

  // Compute summary stats from the currently visible (filtered) transactions
  const stats = useMemo(() => {
    const list = filteredTransactions;
    if (list.length === 0) return null;

    let totalIncome = 0;
    let totalExpenses = 0;

    const incomeTypes = new Set(['income', 'salary', 'invoice', 'refund', 'dividend', 'interest', 'asset_sale']);
    const expenseTypes = new Set(['purchase', 'payment', 'withdrawal', 'loan_payment', 'asset_purchase', 'fee', 'tax']);

    for (const txn of list) {
      const amount = parseFloat(txn.amount.toString());
      if (incomeTypes.has(txn.transactionType)) {
        totalIncome += Math.abs(amount);
      } else if (expenseTypes.has(txn.transactionType)) {
        totalExpenses += Math.abs(amount);
      } else {
        // Neutral types (bank_transfer, internal_transfer, other): classify by sign
        if (amount > 0) totalIncome += amount;
        else if (amount < 0) totalExpenses += Math.abs(amount);
      }
    }

    const netAmount = totalIncome - totalExpenses;

    return {
      totalIncome: totalIncome.toString(),
      totalExpenses: totalExpenses.toString(),
      netAmount: netAmount.toString(),
    };
  }, [filteredTransactions]);

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
      <div className="p-8 space-y-8 bg-gray-50 min-h-full">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl shadow-sm border border-gray-100 bg-white">
              <CardHeader>
                <Skeleton className="h-4 w-32 rounded-xl" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('transactions.title')}</h1>
          <p className="text-gray-500 mt-1">{t('transactions.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            disabled={crud.isCreating}
            className="rounded-lg border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
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
            className="rounded-lg border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button
            onClick={() => crud.openCreateModal()}
            disabled={crud.isCreating}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('transactions.newTransaction')}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {loadError ? (
        <Alert variant="destructive">
          <div className="flex items-center justify-between">
            <div>
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription>{t('transactions.errors.loadFailed')}</AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        </Alert>
      ) : null}

      {/* Active Filters Banner */}
      {activeFiltersCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-900">
                {activeFiltersCount > 1
                  ? t('transactions.filtersActiveMany', { count: activeFiltersCount })
                  : t('transactions.filtersActive', { count: activeFiltersCount })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              {t('transactions.clearFilters')}
            </Button>
          </div>
          <div className="text-sm text-indigo-800">
            <strong>{filteredTransactions.length}</strong> / <strong>{transactions?.length || 0}</strong> {t('transactions.title').toLowerCase()}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Income */}
          <div className="rounded-xl shadow-sm border border-gray-100 bg-white p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('transactions.totalIncome')}
              </p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                <CurrencyText value={parseFloat(stats.totalIncome)} />
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-xl shadow-sm border border-gray-100 bg-white p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('transactions.totalExpenses')}
              </p>
              <p className="text-3xl font-bold text-rose-600 mt-1">
                <CurrencyText value={parseFloat(stats.totalExpenses)} />
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <TrendingDown className="h-6 w-6 text-rose-600" />
            </div>
          </div>

          {/* Balance */}
          <div className="rounded-xl shadow-sm border border-gray-100 bg-white p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('transactions.balance')}
              </p>
              <p
                className={`text-3xl font-bold mt-1 ${
                  parseFloat(stats.netAmount) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                <CurrencyText value={parseFloat(stats.netAmount)} />
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <DollarSign className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <DollarSign className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-gray-900">
              {activeFiltersCount > 0
                ? t('transactions.noMatchingTransactions')
                : t('transactions.noTransactions')}
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500 max-w-sm">
              {activeFiltersCount > 0
                ? t('transactions.adjustFilters')
                : t('transactions.noTransactionsDesc')}
            </p>
            <Button
              onClick={() =>
                activeFiltersCount > 0 ? handleClearFilters() : crud.openCreateModal()
              }
              className="mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {activeFiltersCount > 0 ? (
                <>{t('transactions.clearFilters')}</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('transactions.createTransaction')}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{t('transactions.allTransactions')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredTransactions.length} {t('transactions.title').toLowerCase()}
            </p>
          </div>
          <div className="divide-y divide-gray-50 px-4 py-2">
            {filteredTransactions.map((transaction) => {
              const rawAmount = parseFloat(transaction.amount.toString());
              const isIncome = ['income', 'salary', 'invoice', 'refund', 'dividend', 'interest', 'asset_sale'].includes(transaction.transactionType);
              const amount = isIncome ? Math.abs(rawAmount) : -Math.abs(rawAmount);

              return (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border-l-4 ${
                    isIncome ? 'border-l-emerald-500' : 'border-l-rose-500'
                  } ${
                    deletingTransactionId === transaction.id
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{transaction.description}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {t(`transactions.types.${transaction.transactionType}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span>
                        {formatDate(transaction.transactionDate, preferences.locale)}
                      </span>
                      {transaction.merchantName && <span>• {transaction.merchantName}</span>}
                      {transaction.categoryId && (() => {
                        const cat = categories.find((c) => c.id === transaction.categoryId);
                        return cat ? <span>• {getCategoryName(cat)}</span> : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-lg font-bold ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      <CurrencyText
                        value={amount}
                        currency={transaction.currency as SupportedCurrency}
                        showSign
                      />
                    </span>
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
        </div>
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
            error={crud.createError ? getApiErrorMessage(crud.createError, t('transactions.errors.createFailed')) : undefined}
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
              error={crud.updateError ? getApiErrorMessage(crud.updateError, t('transactions.errors.updateFailed')) : undefined}
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
